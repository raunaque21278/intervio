import { useEffect, useState } from 'react';
import socket from '../socket';
import '../styles/StudentDashboard.css';
import '../styles/PollResults.css';
import ChatModal from './ChatModal';

const StudentDashboard = ({ user, onKickout }) => {
  const [currentPoll, setCurrentPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [results, setResults] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [pollEnded, setPollEnded] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  useEffect(() => {
    // Listen for new questions
    socket.on('new_question', (data) => {
      setCurrentPoll(data);
      setSelectedOption(null);
      setHasAnswered(false);
      setPollEnded(false);
      
      // Calculate time left
      const endTime = data.startTime + (data.timeLimit * 1000);
      const currentTime = Date.now();
      const initialTimeLeft = Math.max(0, Math.floor((endTime - currentTime) / 1000));
      setTimeLeft(initialTimeLeft);
    });
    
    // Listen for new chat messages and set notification
    socket.on('new_message', () => {
      if (!isChatOpen) {
        setHasNewMessages(true);
      }
    });

    // Listen for answer submission acknowledgement
    socket.on('answer_submitted', () => {
      setHasAnswered(true);
    });

    // Listen for live results
    socket.on('live_results', (data) => {
      setResults(data.results);
    });

    // Listen for poll ended
    socket.on('poll_ended', (data) => {
      setResults(data.results);
      setPollEnded(true);
      setTimeLeft(0);
    });
    
    // Listen for kicked_out event
    socket.on('kicked_out', () => {
      // Handle kick out by returning to the welcome page
      if (onKickout) {
        onKickout();
      } else {
        // Fallback if onKickout is not provided
        alert("You have been removed from the class by the teacher");
        window.location.href = "/";
      }
    });

    return () => {
      socket.off('new_question');
      socket.off('answer_submitted');
      socket.off('poll_ended');
      socket.off('new_message');
      socket.off('kicked_out');
    };
  }, [isChatOpen, onKickout]);

  // Timer effect
  useEffect(() => {
    if (!currentPoll || timeLeft <= 0 || hasAnswered || pollEnded) return;

    const timerId = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerId);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [currentPoll, timeLeft, hasAnswered, pollEnded]);

  const handleSubmitAnswer = () => {
    if (selectedOption === null || !currentPoll) return;
    const answer = currentPoll.options[selectedOption];
    console.log('Submitting answer:', answer);
    socket.emit('submit_answer', { answer });
    socket.once('answer_submitted', (data) => {
      console.log('Answer submitted acknowledged:', data);
    });
  };
  
  const renderTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (studentName.trim()) {
      socket.emit("register_student", studentName.trim());
      socket.once("registration_success", (userData) => {
        setIsRegistered(true);
      });
    }
  };

  return (
    <div className="student-container">
      <div className="student-header">
        <div className="welcome-badge">Live Polling</div>
      </div>

      {!isRegistered ? (
        <div className="registration-container">
          <h2 className="get-started-title">Let's Get Started</h2>
          <p className="get-started-subtitle">
            If you're a student, you'll be able to <span className="highlight">submit your answers</span>, participate in live
            polls, and see how your responses compare with your classmates.
          </p>
          
          <form onSubmit={handleNameSubmit}>
            <div className="name-input-group">
              <label htmlFor="studentName">Enter your Name</label>
              <input
                id="studentName"
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Rahul Bajaj"
                required
              />
            </div>
            <button type="submit" className="continue-btn">Continue</button>
          </form>
        </div>
      ) : !currentPoll ? (
        <div className="waiting-container">
          <div className="intervue-poll-badge-center">Intervue Poll</div>
          <div className="loading-spinner"></div>
          <h2 className="waiting-title">Wait for the teacher to ask questions..</h2>
        </div>
      ) : hasAnswered || pollEnded ? (
        <div>
          <div className="poll-header">
            <div>Question {currentPoll.questionNumber || 1}</div>
            <div className="timer-display">00:15</div>
          </div>
          <div className="poll-card">
            <div className="poll-question">
              <h3>{currentPoll.question}</h3>
            </div>
            
            <div className="poll-results">
              {currentPoll.options.map((option, index) => {
                const voteCount = results[option] || 0;
                const totalVotes = Object.values(results).reduce((sum, count) => sum + count, 0) || 1;
                const percentage = Math.round((voteCount / totalVotes) * 100);
                
                return (
                  <div key={index} className="result-item">
                    <div className="progress-container">
                      <div 
                        className="progress"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="result-header">
                      <div className="result-option">
                        <span className="option-circle">{index + 1}</span>
                        <span className={percentage >= 50 ? 'option-text-white' : 'option-text-black'}>
                          {option}
                        </span>
                      </div>
                      <div className="result-percentage">
                        <span className={percentage > 80 ? 'result-percentage-white' : 'result-percentage-black'}>
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="poll-header">
            <div>Question {currentPoll.questionNumber || 1}</div>
            <div className="timer-display">{renderTime(timeLeft)}</div>
          </div>
          <div className="poll-card">
            <div className="poll-question">
              <h3>{currentPoll.question}</h3>
            </div>
            
            <div className="options-container">
              {currentPoll.options.map((option, index) => (
                <div 
                  key={option + '-' + index} 
                  className={`option ${selectedOption === index ? 'selected' : ''}`}
                  onClick={() => setSelectedOption(index)}
                >
                  <span className="option-circle">{index + 1}</span>
                  <span className="option-text">{option}</span>
                  {selectedOption === index && <span className="selected-indicator">✓</span>}
                </div>
              ))}
            </div>
            
            <button 
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null}
              className="submit-btn"
            >
              Submit Answer
            </button>
          </div>
        </div>
      )}
      
      <div 
        className="chat-button" 
        onClick={() => {
          setIsChatOpen(true);
          setHasNewMessages(false);
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6-.097 1.016-.417 2.13-.771 2.966-.079.186.074.394.273.362 2.256-.37 3.597-.938 4.18-1.234A9.06 9.06 0 0 0 8 15z"/>
        </svg>
        {hasNewMessages && <span className="notification-badge"></span>}
      </div>
      
      <ChatModal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        user={{...user, name: studentName}}
      />
    </div>
  );
};

export default StudentDashboard;
