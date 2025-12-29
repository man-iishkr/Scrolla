const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'hi']
  },
  location: {
    country: { type: String, default: 'in' },
    state: String,
    city: String,
    lat: Number,
    lon: Number
  },
  preferences: {
    categories: [String],
    readingHistory: [{
      category: String,
      count: { type: Number, default: 0 }
    }]
  },
  savedArticles: [{
    articleId: String,
    title: String,
    description: String,
    url: String,
    urlToImage: String,
    publishedAt: Date,
    source: String,
    category: String,
    savedAt: { type: Date, default: Date.now }
  }],
  isGuest: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return ;
  this.password = await bcrypt.hash(this.password, 12);

});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);