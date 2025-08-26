import { useEffect, useState } from 'react';
import socket from '../socket';
import '../styles/StudentDashboard.css';

const StudentDashboard = ({ user }) => {
  const [currentPoll, setCurrentPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [results, setResults] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [pollEnded, setPollEnded] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    // Listen for new questions
    socket.on('new_question', (data) => {
      setCurrentPoll(data);
      setSelectedOption('');
      setHasAnswered(false);
      setPollEnded(false);
      
      // Calculate time left
      const endTime = data.startTime + (data.timeLimit * 1000);
      const currentTime = Date.now();
      const initialTimeLeft = Math.max(0, Math.floor((endTime - currentTime) / 1000));
      setTimeLeft(initialTimeLeft);
    });

    // Listen for answer submission acknowledgement
    socket.on('answer_submitted', () => {
      setHasAnswered(true);
    });

    // Listen for poll ended
    socket.on('poll_ended', (data) => {
      setResults(data.results);
      setPollEnded(true);
      setTimeLeft(0);
    });

    return () => {
      socket.off('new_question');
      socket.off('answer_submitted');
      socket.off('poll_ended');
    };
  }, []);

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
    if (!selectedOption || !currentPoll) return;
    socket.emit('submit_answer', { answer: selectedOption });
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
        <div className="waiting-message">
          <div className="waiting-icon">⏳</div>
          <h2>Wait for the teacher to ask questions...</h2>
        </div>
      ) : hasAnswered || pollEnded ? (
        <div className="results-container">
          <h2>Results</h2>
          <p>{currentPoll.question}</p>
          <div className="poll-results">
            {currentPoll.options.map((option, index) => (
              <div key={index} className="result-item">
                <div className="result-option">{option}</div>
                <div className="progress-bar">
                  <div 
                    className="progress"
                    style={{ 
                      width: `${results[option] ? 
                        (results[option] / Object.keys(results).reduce((a, b) => results[b] + a, 0)) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <div className="votes-count">{results[option] || 0}</div>
                {selectedOption === option && <div className="your-vote-marker">Your vote</div>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="question-container">
          <div className="timer">{renderTime(timeLeft)}</div>
          <h2>{currentPoll.question}</h2>
          <div className="options-container">
            {currentPoll.options.map((option, index) => (
              <div 
                key={index} 
                className={`option ${selectedOption === option ? 'selected' : ''}`}
                onClick={() => setSelectedOption(option)}
              >
                {option}
              </div>
            ))}
          </div>
          <button 
            onClick={handleSubmitAnswer}
            disabled={!selectedOption}
            className="submit-btn"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
