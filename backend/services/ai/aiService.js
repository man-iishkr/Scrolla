const axios = require("axios");

/* -------- SUMMARY -------- */
exports.generateSummary = async ({ title, description }) => {
  // TEMP simple summary (replace with DeepSeek later)
  return `${title}\n\n${description || ""}`;
};

/* -------- ASK AI -------- */
exports.askQuestion = async (question) => {
  // TEMP placeholder (replace with DeepSeek later)
  return `AI response to: "${question}"`;
};
