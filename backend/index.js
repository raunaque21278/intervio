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

// Store active polls and students
const activePoll = {
  question: null,
  options: [],
  answers: {},
  timeLimit: 60, // Default 60 seconds
  startTime: null,
  isActive: false
};

const students = {};

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
    students[socket.id] = { id: socket.id, name, answers: [] };
    socket.emit("registration_success", { id: socket.id, name });
    io.emit("update_students", Object.values(students));
    
    // Send current poll if exists
    if (activePoll.isActive) {
      socket.emit("new_question", {
        question: activePoll.question,
        options: activePoll.options,
        timeLimit: activePoll.timeLimit,
        startTime: activePoll.startTime
      });
    }
  });

  // Teacher creates a new poll
  socket.on("create_poll", ({ question, options, timeLimit = 60 }) => {
    // Reset previous poll
    activePoll.question = question;
    activePoll.options = options;
    activePoll.answers = {};
    activePoll.timeLimit = timeLimit;
    activePoll.startTime = Date.now();
    activePoll.isActive = true;

    // Broadcast to all students
    io.emit("new_question", {
      question,
      options,
      timeLimit,
      startTime: activePoll.startTime
    });

    // Set timer to end poll
    setTimeout(() => {
      if (activePoll.isActive && activePoll.question === question) {
        activePoll.isActive = false;
        io.emit("poll_ended", { 
          question, 
          results: calculateResults() 
        });
      }
    }, timeLimit * 1000);
  });

  // Student submits an answer
  socket.on("submit_answer", ({ answer }) => {
    if (!activePoll.isActive || !students[socket.id]) return;

    // Save answer
    activePoll.answers[socket.id] = answer;
    students[socket.id].answers.push({ 
      question: activePoll.question, 
      answer 
    });

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
      results: calculateResults() 
    });

    // If all students answered, end poll
    if (allAnswered) {
      activePoll.isActive = false;
      io.emit("poll_ended", { 
        question: activePoll.question, 
        results: calculateResults() 
      });
    }
  });

  // Teacher requests to end poll early
  socket.on("end_poll", () => {
    if (activePoll.isActive) {
      activePoll.isActive = false;
      io.emit("poll_ended", { 
        question: activePoll.question, 
        results: calculateResults() 
      });
    }
  });

  // Remove student (optional feature)
  socket.on("remove_student", (studentId) => {
    if (students[studentId]) {
      delete students[studentId];
      io.emit("update_students", Object.values(students));
    }
  });

  // Disconnect event
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    if (students[socket.id]) {
      delete students[socket.id];
      io.emit("update_students", Object.values(students));
    }
  });
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

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
