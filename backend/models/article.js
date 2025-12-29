const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  articleId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  content: String,
  url: {
    type: String,
    required: true
  },
  urlToImage: String,
  publishedAt: Date,
  source: {
    id: String,
    name: String
  },
  author: String,
  category: String,
  country: String,
  language: String,
  sentiment: String,
  engagementScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

articleSchema.index({ publishedAt: -1 });
articleSchema.index({ category: 1 });
articleSchema.index({ country: 1 });

module.exports = mongoose.model('Article', articleSchema);