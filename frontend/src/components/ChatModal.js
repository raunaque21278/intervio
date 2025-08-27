import React, { useState, useRef, useEffect } from 'react';
import '../styles/Chat.css';
import socket from '../socket';

const ChatModal = ({ isOpen, onClose, user }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef(null);

  // Fetch participants and messages when component mounts
  useEffect(() => {
    if (isOpen) {
      // Listen for new messages
      socket.on('new_message', (message) => {
        setMessages(prev => [...prev, message]);
      });
      
      // Listen for all messages (when initially requested)
      socket.on('all_messages', (allMessages) => {
        setMessages(allMessages);
      });
      
      // Listen for updated participants list
      socket.on('participants_updated', (updatedParticipants) => {
        console.log("Received participants update:", updatedParticipants);
        setParticipants(updatedParticipants || []);
      });
      
      // Request initial data
      socket.emit('get_participants');
      socket.emit('get_messages');
      
      // Clean up event listeners when component unmounts
      return () => {
        socket.off('new_message');
        socket.off('all_messages');
        socket.off('participants_updated');
      };
    }
  }, [isOpen]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const messageObj = {
      sender: user.name || (user.role === 'teacher' ? 'Teacher' : 'Student'),
      text: newMessage,
      role: user.role,
      timestamp: new Date().toISOString()
    };
    
    socket.emit('send_message', messageObj);
    setNewMessage('');
  };
  
  const handleRemoveStudent = (studentId) => {
    if (user.role === 'teacher') {
      socket.emit('remove_student', studentId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={e => e.stopPropagation()}>
        <div className="chat-modal-header">
          <div className="tabs">
            <div 
              className={`tab ${activeTab === 'chat' ? 'active' : ''}`} 
              onClick={() => setActiveTab('chat')}
            >
              Chat
            </div>
            <div 
              className={`tab ${activeTab === 'participants' ? 'active' : ''}`} 
              onClick={() => setActiveTab('participants')}
            >
              Participants
            </div>
          </div>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="chat-modal-body">
          {activeTab === 'chat' && (
            <div className="chat-panel">
              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="no-messages">No messages yet</div>
                ) : (
                  messages.map((msg, index) => {
                    const isCurrentUser = msg.sender === user.name;
                    return (
                      <div 
                        key={index} 
                        className={`message ${isCurrentUser ? 'current-user-message' : (msg.role === 'teacher' ? 'teacher-message' : 'student-message')}`}
                      >
                        <div className="message-header">
                          {msg.sender}
                          <span className="message-time">
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <div className="message-content">{msg.text}</div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              <form className="chat-input-container" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="send-button">Send</button>
              </form>
            </div>
          )}
          
          {activeTab === 'participants' && (
            <div className="participants-panel">
              {participants.length === 0 ? (
                <div className="no-participants">No participants yet</div>
              ) : (
                <>
                  <div className="participants-header">
                    <div className="participant-name-header">Name</div>
                    {user.role === 'teacher' && <div className="participant-action-header">Action</div>}
                  </div>
                  <div className="participants-list">
                    {participants
                      .filter(participant => participant.role !== 'teacher') // Filter out the teacher from the list
                      .map((participant) => (
                        <div key={participant.id} className="participant-item">
                          <div className="participant-info">
                            <span className="participant-name">{participant.name}</span>
                          </div>
                          {user.role === 'teacher' && (
                            <button 
                              className="kick-out-btn"
                              onClick={() => handleRemoveStudent(participant.id)}
                            >
                              Kick out
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
