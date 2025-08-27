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
        <div className="intervue-poll-badge">Intervue Poll</div>
        
        <h1 className="welcome-title">Welcome to the Live Polling System</h1>
        <p className="welcome-subtitle">Please select the role that best describes you to begin using the live polling system</p>
        
        <div className="role-cards-container">
          <div 
            className={`role-card ${selectedRole === 'student' ? 'selected' : ''}`} 
            onClick={() => handleRoleSelect('student')}
          >
            <h2>I'm a Student</h2>
            <p>Lorem ipsum is simply dummy text of the printing and typesetting industry</p>
          </div>
          
          <div 
            className={`role-card ${selectedRole === 'teacher' ? 'selected' : ''}`} 
            onClick={() => handleRoleSelect('teacher')}
          >
            <h2>I'm a Teacher</h2>
            <p>Submit answers and view live poll results in real-time.</p>
          </div>
        </div>
        
        <div className="button-container">
          <button 
            className="continue-btn"
            onClick={handleContinue}
            disabled={!selectedRole}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
