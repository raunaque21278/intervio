import { useEffect, useState } from 'react';
import './App.css';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import WelcomePage from './components/WelcomePage';
import KickedOut from './components/KickedOut';
import socket from './socket';

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // "teacher" or "student"
  const [kickedOut, setKickedOut] = useState(false);

  // Handle user registration
  const handleRegister = (name, selectedRole) => {
    if (selectedRole === "teacher") {
      setUser({ name, role: "teacher" });
      setRole("teacher");
    } else {
      setUser({ role: "student" });
      setRole("student");
    }
  };

  // Handle disconnect
  useEffect(() => {
    const handleBeforeUnload = () => {
      socket.disconnect();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Handle student kick out
  const handleKickout = () => {
    setKickedOut(true);
    setUser(null);
    setRole(null);
  };

  return (
    <div className="App">
      {kickedOut ? (
        <KickedOut />
      ) : !role ? (
        <WelcomePage onRegister={handleRegister} />
      ) : role === "teacher" ? (
        <TeacherDashboard user={user} />
      ) : (
        <StudentDashboard user={user} onKickout={handleKickout} />
      )}
    </div>
  );
}

export default App;
