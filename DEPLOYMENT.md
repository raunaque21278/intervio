# Deployment Guide for Live Polling System

## Project Structure
```
- backend/           # Node.js Express server with Socket.IO
- frontend/          # React frontend application
```

## Backend Deployment (Render)

1. Create a new Web Service on Render
2. Link your GitHub repository
3. Configure the service with these settings:
   - **Name**: live-polling-backend (or your preferred name)
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node index.js`
   - **Environment Variables**:
     - `PORT`: 5000

## Frontend Deployment (Render)

1. Create a new Static Site on Render
2. Link your GitHub repository
3. Configure the service with these settings:
   - **Name**: live-polling-frontend (or your preferred name)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`
   - **Environment Variables**:
     - `REACT_APP_BACKEND_URL`: URL of your deployed backend (e.g., https://live-polling-backend.onrender.com)

## Important Configuration

1. Before deploying, make sure your frontend's `package.json` has a build script:
```json
"scripts": {
  "start": "react-scripts start",
  "build": "react-scripts build",
  "test": "react-scripts test",
  "eject": "react-scripts eject"
}
```

2. Ensure CORS is properly configured in your backend:
```javascript
const io = new Server(server, {
  cors: {
    origin: "*", // In production, specify your frontend domain
    methods: ["GET", "POST"]
  }
});
```

## Post-Deployment Steps

1. Test the application by navigating to your frontend URL
2. Verify that socket connections work properly
3. Ensure student registration and teacher dashboard function correctly
4. Verify that the participant list shows correctly and the remove function works

## Troubleshooting

- If WebSocket connections fail, ensure that Render is properly configured to support WebSockets
- Check browser console for any connection errors
- Verify that environment variables are correctly set
