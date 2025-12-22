const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    preferences: [String],
    readingStats: Object,
    savedArticles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Article" }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
