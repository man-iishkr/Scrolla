const { generateSummary, askQuestion } = require("../services/ai/aiService");

/* -------- SUMMARY -------- */
exports.getSummary = async (req, res) => {
  try {
    const { title, description, url } = req.body;

    const summary = await generateSummary({
      title,
      description,
      url
    });

    res.json({ summary });
  } catch (err) {
    console.error("AI summary error:", err);
    res.status(500).json({ error: "Failed to generate summary" });
  }
};

/* -------- ASK AI -------- */
exports.askAi = async (req, res) => {
  try {
    const { question } = req.body;

    const answer = await askQuestion(question);

    res.json({ answer });
  } catch (err) {
    console.error("AI chat error:", err);
    res.status(500).json({ error: "AI failed to respond" });
  }
};
