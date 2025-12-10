const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    password: {
      type: String,
      required: true
    },

    savedArticles: {
      type: Array,
      default: []
    },

    readingHistory: {
      type: [
        {
          url: String,
          title: String,
          category: String,
          topic: String,
          sourceLabel: String,
          clickedAt: { type: Date, default: Date.now }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
