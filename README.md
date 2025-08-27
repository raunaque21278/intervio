# Intervue Poll System

A real-time polling and group chat application for teachers and students.

## Features

- Teachers can create live polls and view results instantly.
- Students can join, submit answers, and see live poll results.
- Group chat with participants list and teacher controls (kick out).
- Responsive UI for both teacher and student dashboards.

## Technologies

- React
- Express
- Socket.IO

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/raunaque21278/intervio.git
cd live-polling-system
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd backend
node index.js
```

2. Start the React development server:
```bash
cd frontend
npm start
```

3. Access the application at `http://localhost:3000`

## Usage

- Open the frontend in your browser (usually at `http://localhost:3000`).
- Choose your role (Teacher or Student) and enter your name.
- Teachers can create polls; students can answer and see results live.
- Use the chat button to open group chat and see/manage participants.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- This project was created as part of the Intervue coding assessment
