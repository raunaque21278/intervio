import { useEffect, useState } from 'react';
import './App.css';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import WelcomePage from './components/WelcomePage';
import socket from './socket';

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // "teacher" or "student"

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

  return (
    <div className="App">
      {!role ? (
        <WelcomePage onRegister={handleRegister} />
      ) : role === "teacher" ? (
        <TeacherDashboard user={user} />
      ) : (
        <StudentDashboard user={user} />
      )}
    </div>
  );
}

export default App;
