// Socket.io configuration
import { io } from 'socket.io-client';

// Create a singleton socket instance
const socket = io('http://localhost:5000');

// Export the socket instance
export default socket;
