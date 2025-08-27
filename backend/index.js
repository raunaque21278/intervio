const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Track question number
let currentQuestionNumber = 1;

// Store active polls and students
const activePoll = {
  question: null,
  options: [],
  answers: {},
  answeredBy: {}, // Track which students have answered
  timeLimit: 60, // Default 60 seconds
  startTime: null,
  isActive: false,
  questionNumber: currentQuestionNumber
};

const students = {};
const connectedUsers = {}; // Track all connected users including teacher

// Store chat messages
const chatMessages = [];

// Middleware
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Live Polling System Backend");
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Student registration
  socket.on("register_student", (name) => {
  students[socket.id] = { id: socket.id, name, answers: [], role: "student" };
  connectedUsers[socket.id] = { id: socket.id, name, role: "student" };
  console.log("Student registered:", name, "Socket ID:", socket.id);
  socket.emit("registration_success", { id: socket.id, name });
  io.emit("update_students", Object.values(students));
  io.emit("participants_updated", Object.values(connectedUsers));
    console.log("Student registered:", name, "Total connected users:", Object.values(connectedUsers).length);
    
    // Always send current poll if exists
    if (activePoll.question) {
      socket.emit("new_question", {
        question: activePoll.question,
        options: activePoll.options,
        timeLimit: activePoll.timeLimit,
        startTime: activePoll.startTime,
        isActive: activePoll.isActive,
        questionNumber: activePoll.questionNumber
      });
      console.log("Sent current poll to student:", name, "Active:", activePoll.isActive);
    }
  });
  
  // Teacher registration
  socket.on("register_teacher", (name) => {
    connectedUsers[socket.id] = { id: socket.id, name: name || "Teacher", role: "teacher" };
    socket.emit("registration_success", { id: socket.id, role: "teacher", name: name || "Teacher" });
    // Make sure to broadcast participants to all clients including the teacher
    io.emit("participants_updated", Object.values(connectedUsers));
    console.log("Teacher registered, participants:", Object.values(connectedUsers));
  });

  // Teacher creates a new poll
  socket.on("create_poll", ({ question, options, timeLimit = 60 }) => {
    // Reset previous poll
    activePoll.question = question;
    activePoll.options = options;
    activePoll.answers = {};
    activePoll.answeredBy = {};
    activePoll.timeLimit = timeLimit;
    activePoll.startTime = Date.now();
    activePoll.isActive = true;
    activePoll.questionNumber = currentQuestionNumber;

    // Broadcast to all students
    io.emit("new_question", {
      question,
      options,
      timeLimit,
      startTime: activePoll.startTime,
      questionNumber: currentQuestionNumber
    });

    // Set timer to end poll
    setTimeout(() => {
      if (activePoll.isActive && activePoll.question === question) {
        activePoll.isActive = false;
        io.emit("poll_ended", { 
          question, 
          results: calculateResults(),
          questionNumber: activePoll.questionNumber,
          options: activePoll.options,
          answeredBy: activePoll.answeredBy
        });
        
        // Increment question number for next poll
        currentQuestionNumber++;
      }
    }, timeLimit * 1000);
  });

  // Student submits an answer
  socket.on("submit_answer", ({ answer }) => {

    if (!activePoll.isActive) {
      console.log("Poll is not active. Answer rejected.");
      return;
    }
    if (!students[socket.id]) {
      console.log("Student not registered. Socket ID:", socket.id, "Answer rejected.");
      return;
    }

    // Save answer
    activePoll.answers[socket.id] = answer;
    activePoll.answeredBy[socket.id] = students[socket.id].name;
    students[socket.id].answers.push({ 
      question: activePoll.question, 
      answer 
    });
    console.log("Answer received from student:", students[socket.id].name, "Answer:", answer, "Socket ID:", socket.id);

    // Check if all students have answered
    const allAnswered = Object.keys(students).every(
      (id) => activePoll.answers[id]
    );

    // Send acknowledgement to the student
    socket.emit("answer_submitted", { 
      status: "success" 
    });

    // Send current results to the teacher
    io.emit("live_results", { 
      results: calculateResults(),
      answeredBy: activePoll.answeredBy,
      questionNumber: activePoll.questionNumber,
      question: activePoll.question,
      options: activePoll.options,
      isActive: true
    });
  });

  // Teacher requests to end poll early
  socket.on("end_poll", () => {
    if (activePoll.isActive) {
      activePoll.isActive = false;
      io.emit("poll_ended", { 
        question: activePoll.question, 
        results: calculateResults(),
        answeredBy: activePoll.answeredBy,
        questionNumber: activePoll.questionNumber,
        options: activePoll.options
      });
      
      // Increment question number for next poll
      currentQuestionNumber++;
    }
  });
  


  // Remove student (optional feature)
  socket.on("remove_student", (studentId) => {
    if (students[studentId]) {
      delete students[studentId];
      io.emit("update_students", Object.values(students));
    }
    
    if (connectedUsers[studentId]) {
      delete connectedUsers[studentId];
      io.emit("participants_updated", Object.values(connectedUsers));
      
      // Disconnect the removed student
      const socketToDisconnect = io.sockets.sockets.get(studentId);
      if (socketToDisconnect) {
        socketToDisconnect.emit("kicked_out");
        socketToDisconnect.disconnect(true);
      }
    }
  });

  // Disconnect event
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    // Remove from students list if it was a student
    if (students[socket.id]) {
      delete students[socket.id];
      io.emit("update_students", Object.values(students));
    }
    
    // Remove from connected users list regardless of role
    if (connectedUsers[socket.id]) {
      delete connectedUsers[socket.id];
      io.emit("participants_updated", Object.values(connectedUsers));
    }
  });
  
  // Setup chat handlers
  setupChatHandlers(socket);
});

// Helper function to calculate results
function calculateResults() {
  const results = {};
  
  activePoll.options.forEach(option => {
    results[option] = 0;
  });

  Object.values(activePoll.answers).forEach(answer => {
    if (results[answer] !== undefined) {
      results[answer]++;
    }
  });

  return results;
}

// Chat message handlers
function setupChatHandlers(socket) {
  // Send a new message
  socket.on("send_message", (message) => {
    chatMessages.push(message);
    io.emit("new_message", message);
  });

  // Get all messages
  socket.on("get_messages", () => {
    socket.emit("all_messages", chatMessages);
  });

  // Get all participants
  socket.on("get_participants", () => {
    console.log("Participants requested, sending:", Object.values(connectedUsers));
    socket.emit("participants_updated", Object.values(connectedUsers));
  });
}

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
