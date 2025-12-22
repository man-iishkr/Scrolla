const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    content: String,
    url: { type: String, unique: true },
    image: String,
    source: String,
    category: String,
    publishedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("Article", articleSchema);
