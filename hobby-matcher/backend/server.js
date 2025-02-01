const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173", // Vite's default port
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));

// Socket.io
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('leave-room', (roomId) => {
        socket.leave(roomId);
        // Notify other participants that user has left
        socket.to(roomId).emit('user-disconnected', socket.id);
    });

    socket.on('send-message', (data) => {
        socket.to(data.roomId).emit('receive-message', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });

    // Handle call initiation
    socket.on('initiate-call', ({ roomId, targetUserId }) => {
        console.log(`Call initiated to ${targetUserId} in room ${roomId}`);
        socket.to(targetUserId).emit('incoming-call', {
            roomId,
            callerId: socket.id
        });
    });

    // Handle call acceptance
    socket.on('accept-call', ({ roomId, callerId }) => {
        socket.to(callerId).emit('call-accepted', {
            roomId,
            accepterId: socket.id
        });
    });

    // Handle call rejection
    socket.on('reject-call', ({ roomId, callerId }) => {
        socket.to(callerId).emit('call-rejected', {
            roomId,
            rejecterId: socket.id
        });
    });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    httpServer.close(() => process.exit(1));
});