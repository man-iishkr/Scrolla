const aiService = require("../services/ai/ai.service");

// POST /api/ai/summary
exports.getSummary = async (req, res) => {
  try {
    const { title, content, url } = req.body;

    const result = await aiService.generateSummary({
      title,
      content,
      url
    });

    res.json({ summary: result });
  } catch (err) {
    console.error("AI Summary Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/ai/chat
exports.chat = async (req, res) => {
  try {
    const { title, content, question, history } = req.body;

    const result = await aiService.chatWithArticle({
      title,
      content,
      question,
      history
    });

    res.json({ answer: result });
  } catch (err) {
    console.error("AI Chat Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
