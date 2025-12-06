// backend/models/Article.js
const mongoose = require("mongoose");

const ArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    summary: { type: String, required: true },
    category: { type: String, default: "General" },
    topic: { type: String }, // optional finer-grain topic, e.g. "AI agents"
    sourcesCount: { type: Number, default: 0 },
    sourceLabel: { type: String },
    imageUrl: { type: String },
    url: { type: String }, // link to original article (for later)
    publishedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true // adds createdAt, updatedAt
  }
);

const Article = mongoose.model("Article", ArticleSchema);

module.exports = Article;
