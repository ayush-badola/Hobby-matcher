const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { createServer } = require('http');
const { Server } = require('socket.io');
const User = require('./models/User');
const waitingUsers = new Set();

// Load correct env file
dotenv.config({
    path: process.env.NODE_ENV === 'production'
        ? '.env.production'
        : '.env'
});

// Connect to database
connectDB();

const app = express();
const httpServer = createServer(app);

// Update CORS for both development and production
const allowedOrigins = [
    'http://localhost:5173',  // development
    'https://hobby-matcher-9-a0oh.onrender.com',  // you'll add this later
    'http://192.168.29.253:5173',
    'https://hobby-matcher-frontend-wapg.onrender.com',
    'https://hobby-matcher-frontend.onrender.com',
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());

// Basic route to test deployment
app.get('/', (req, res) => {
    res.json({ message: 'Hobby Matcher API is running' });
});

// Wake-up route
app.get('/api/wake-up', (req, res) => {
    res.json({ status: 'Server is awake' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));

const connectedUsers = new Map();

// Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: 'https://hobby-matcher-frontend.onrender.com',
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Socket.io
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('register-user', async (userId) => {
        try {
            // Update user's online status in database
            await User.findByIdAndUpdate(userId, { isOnline: true });

            // Broadcast online status to all clients
            io.emit('user-status-change', { userId, isOnline: true });

            socket.userId = userId;
        } catch (error) {
            console.error('Error updating online status:', error);
        }
    });

    socket.on('disconnect', async () => {
        if (socket.userId) {
            try {
                // Update user's online status in database
                await User.findByIdAndUpdate(socket.userId, { isOnline: false });

                // Broadcast offline status to all clients
                io.emit('user-status-change', { userId: socket.userId, isOnline: false });
            } catch (error) {
                console.error('Error updating offline status:', error);
            }
        }
        console.log('User disconnected:', socket.id);

        // Remove from waiting queue
        waitingUsers.forEach(user => {
            if (user.socketId === socket.id) {
                waitingUsers.delete(user);
            }
        });
    });

    // Handle WebRTC signaling
    socket.on('offer', ({ offer, roomId }) => {
        console.log('Relaying offer in room:', roomId);
        socket.to(roomId).emit('offer', { offer, from: socket.id });
    });

    socket.on('answer', ({ answer, roomId }) => {
        console.log('Relaying answer in room:', roomId);
        socket.to(roomId).emit('answer', { answer, from: socket.id });
    });

    socket.on('ice-candidate', ({ candidate, roomId }) => {
        console.log('Relaying ICE candidate for room:', roomId);
        socket.to(roomId).emit('ice-candidate', { candidate, from: socket.id });
    });

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

    socket.on('end-call', ({ roomId }) => {
        console.log('Call ended in room:', roomId);
        // Notify everyone in the room except sender
        socket.to(roomId).emit('call-ended');
        // Leave the room
        socket.leave(roomId);
    });

    // Handle call initiation
    socket.on('initiate-call', ({ targetUserId, roomId }) => {
        console.log('Call initiated:', { targetUserId, roomId });
        const targetSocketId = connectedUsers.get(targetUserId);

        if (targetSocketId) {
            io.to(targetSocketId).emit('incoming-call', {
                roomId,
                callerId: socket.userId
            });
        } else {
            socket.emit('call-failed', { message: 'User is not online' });
        }
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

    socket.on('join-random-queue', (userData) => {
        console.log('User joined random queue:', userData.username);

        // Check if there's someone waiting
        const waitingUser = Array.from(waitingUsers)[0];
        if (waitingUser && waitingUser.userId !== userData.userId) {
            // Create a room ID
            const roomId = `random-${Date.now()}`;

            // Remove waiting user from queue
            waitingUsers.delete(waitingUser);

            // Notify both users about the match
            io.to(waitingUser.socketId).emit('random-match-found', {
                roomId,
                peer: { username: userData.username, id: userData.userId }
            });

            socket.emit('random-match-found', {
                roomId,
                peer: { username: waitingUser.username, id: waitingUser.userId }
            });
        } else {
            // Add user to waiting queue
            waitingUsers.add({
                socketId: socket.id,
                userId: userData.userId,
                username: userData.username
            });
            socket.emit('waiting-for-match');
        }
    });

    socket.on('leave-random-queue', (userId) => {
        // Remove user from waiting queue
        waitingUsers.forEach(user => {
            if (user.userId === userId) {
                waitingUsers.delete(user);
            }
        });
    });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    httpServer.close(() => process.exit(1));
})
