// Socket.io configuration
import { io } from 'socket.io-client';

// Create a singleton socket instance
// Use environment variable in production or fallback to localhost in development
// const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://intervio.onrender.com' 
const socket = io(BACKEND_URL);

// Export the socket instance
export default socket;
