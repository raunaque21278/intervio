import { useState } from 'react';
import '../styles/WelcomePage.css';

const WelcomePage = ({ onRegister }) => {
  const [selectedRole, setSelectedRole] = useState(null);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole === 'teacher') {
      onRegister("Teacher", "teacher");
    } else if (selectedRole === 'student') {
      onRegister(null, "student");
    }
  };

  return (
    <div className="welcome-container">
      <div className="welcome-card">
        <div className="welcome-badge">Live Polling</div>
        <h1 className="welcome-title">Welcome to the Live Polling System</h1>
        <p className="welcome-subtitle">Please select the role that best describes you to begin using the live polling system.</p>
        
        <div className="button-container">
          <div 
            className={`role-button ${selectedRole === 'student' ? 'selected' : ''}`} 
            onClick={() => handleRoleSelect('student')}
          >
            <h2>I'm a Student</h2>
            <p>Enter here to submit answers for the polling and get instant results.</p>
          </div>
          <div 
            className={`role-button ${selectedRole === 'teacher' ? 'selected' : ''}`} 
            onClick={() => handleRoleSelect('teacher')}
          >
            <h2>I'm a Teacher</h2>
            <p>Submit questions and view results.</p>
          </div>
        </div>
        
        <button 
          className={`continue-btn ${!selectedRole ? 'disabled' : ''}`} 
          onClick={handleContinue}
          disabled={!selectedRole}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default WelcomePage;
