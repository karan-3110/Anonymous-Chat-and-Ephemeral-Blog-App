// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const blogRoutes = require('./routes/blogRoutes');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const friendRoutes = require('./routes/friendRoutes');



dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());



// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// API Routes
app.use('/api/blogs', blogRoutes);        // Blog APIs
app.use('/api/auth', authRoutes);         // Auth APIs
app.use('/api/profile', profileRoutes);   // Profile (blogs + friends)
app.use('/api/friends', friendRoutes);

// Create HTTP server
const server = http.createServer(app);

// Real-time Socket Chat
const { setupSocket } = require('./socket/socketManager'); // ⬅️ Add this at the top

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

setupSocket(io); // Modularized socket logic

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
