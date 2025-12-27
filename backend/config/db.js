// backend/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if MONGODB_URI exists
    if (!process.env.MONGODB_URI) {
      console.error('✗ MONGODB_URI is not defined in environment variables');
      console.log('Please create a .env file in the backend directory with:');
      console.log('MONGODB_URI=mongodb://localhost:27017/news-platform');
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('✗ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;