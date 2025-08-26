import { useEffect, useState } from 'react';
import socket from '../socket';
import '../styles/TeacherDashboard.css';

const TeacherDashboard = ({ user }) => {
  const [question, setQuestion] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [options, setOptions] = useState([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false }
  ]);
  const [pollActive, setPollActive] = useState(false);
  const [results, setResults] = useState({});
  const [students, setStudents] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [timeLimit, setTimeLimit] = useState(60); // Time limit in seconds - will be used for timer functionality

  useEffect(() => {
    // Listen for student updates
    socket.on('update_students', (updatedStudents) => {
      setStudents(updatedStudents);
    });

    // Listen for live results
    socket.on('live_results', (data) => {
      setResults(data.results);
    });

    // Listen for poll ended
    socket.on('poll_ended', (data) => {
      setPollActive(false);
      setResults(data.results);
    });

    return () => {
      socket.off('update_students');
      socket.off('live_results');
      socket.off('poll_ended');
    };
  }, []);

  const handleAddOption = () => {
    if (options.length < 4) {
      setOptions([...options, { text: '', isCorrect: false }]);
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index].text = value;
    setOptions(newOptions);
  };

  const handleIsCorrectChange = (index, isCorrect) => {
    const newOptions = [...options];
    newOptions[index].isCorrect = isCorrect;
    setOptions(newOptions);
  };

  // eslint-disable-next-line no-unused-vars
  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  }; // Function will be used in future enhancements for option removal

  const handleCreatePoll = () => {
    if (!question.trim()) {
      alert('Please enter a question');
      return;
    }

    const validOptions = options.filter(opt => opt.text.trim());
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    socket.emit('create_poll', {
      question,
      options: validOptions.map(opt => opt.text),
      timeLimit
    });

    setPollActive(true);
  };

  const handleEndPoll = () => {
    socket.emit('end_poll');
    setPollActive(false);
  };
  
  const handleNewQuestion = () => {
    // Reset form for a new question
    setQuestion('');
    setOptions([
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ]);
    setResults({});
    setPollActive(false);
  };

  const handleRemoveStudent = (studentId) => {
    socket.emit('remove_student', studentId);
  };

  return (
    <div className="teacher-container">
      {!pollActive ? (
        <div className="poll-creation">
          <div className="welcome-badge">Intervue Poll</div>
          
          <h2>Let's Get Started</h2>
          <p>you'll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time.</p>
          
          <div className="form-group">
            <div className="question-header">
              <label>Enter your question</label>
              <div className="time-dropdown">60 seconds <span className="dropdown-arrow">▼</span></div>
            </div>
            <textarea
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                setCharCount(e.target.value.length);
              }}
              placeholder="Enter your question here..."
              disabled={pollActive}
              rows={3}
              maxLength={150}
              className="question-textarea"
            />
            <div className="char-count">{charCount}/150</div>
          </div>

          <div className="options-section">
            <div className="options-header">
              <span>Edit Options</span>
              <span>Is It Correct?</span>
            </div>
            
            {options.map((option, index) => (
              <div key={index} className="option-row">
                <div className="option-number">{index + 1}</div>
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder="Enter option text here..."
                  disabled={pollActive}
                  className="option-input"
                />
                <div className="radio-options">
                  <label className="radio-container">
                    <input
                      type="radio"
                      name={`correct-${index}`}
                      checked={option.isCorrect}
                      onChange={() => handleIsCorrectChange(index, true)}
                    />
                    <span className="radio-label">Yes</span>
                  </label>
                  <label className="radio-container">
                    <input
                      type="radio"
                      name={`correct-${index}`}
                      checked={!option.isCorrect}
                      onChange={() => handleIsCorrectChange(index, false)}
                    />
                    <span className="radio-label">No</span>
                  </label>
                </div>
              </div>
            ))}
            
            {options.length < 4 && !pollActive && (
              <button onClick={handleAddOption} className="add-option-btn">
                + Add More option
              </button>
            )}
          </div>

          <button 
            onClick={handleCreatePoll}
            className="ask-question-btn"
            disabled={pollActive}
          >
            Ask Question
          </button>
        </div>
      ) : (
        <div className="active-poll">
          <h2>Question: {question}</h2>
          <div className="poll-results">
            {options
              .filter(opt => opt.text.trim())
              .map((option, index) => (
                <div key={index} className="result-item">
                  <span>{option.text}</span>
                  <div className="progress-bar">
                    <div 
                      className="progress"
                      style={{ 
                        width: `${results[option.text] ? 
                          (results[option.text] / students.length) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span>{results[option.text] || 0} votes</span>
                </div>
              ))}
          </div>
          <div className="poll-actions">
            <button onClick={handleEndPoll} className="end-poll-btn">
              End Poll
            </button>
            <button onClick={handleNewQuestion} className="new-question-btn">
              New Question
            </button>
          </div>
        </div>
      )}

      <div className="dashboard-actions">
        {!pollActive && (
          <button onClick={handleNewQuestion} className="new-question-btn secondary">
            New Question
          </button>
        )}
      </div>

      <div className="students-list">
        <h3>Connected Students ({students.length})</h3>
        {students.length > 0 ? (
          <ul>
            {students.map((student) => (
              <li key={student.id}>
                {student.name}
                <button 
                  onClick={() => handleRemoveStudent(student.id)}
                  className="remove-student-btn"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-students">No students connected yet</p>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
