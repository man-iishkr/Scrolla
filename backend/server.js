// backend/server.js
// Load environment variables FIRST
require('dotenv').config({ path: './backend/.env' });

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth_Routes');
const feedRoutes = require('./routes/feedRoutes');
const aiRoutes = require('./routes/aiRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/user', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    env: {
      mongoConnected: process.env.MONGODB_URI ? 'Configured' : 'Missing',
      newsApi: process.env.NEWS_API_KEY ? 'Configured' : 'Missing',
      deepseek: process.env.DEEPSEEK_API_KEY ? 'Configured' : 'Missing'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Open http://localhost:${PORT}/index.html in your browser`);
});