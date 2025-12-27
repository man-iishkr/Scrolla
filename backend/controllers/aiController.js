const aiService = require('../services/ai/aiService');

exports.generateSummary = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const summary = await aiService.generateSummary(content, title);

    res.json({ summary });
  } catch (error) {
    console.error('Summary Error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
};

exports.askAI = async (req, res) => {
  try {
    const { question, articleContext } = req.body;

    if (!question || !articleContext) {
      return res.status(400).json({ error: 'Question and article context are required' });
    }

    const answer = await aiService.askAI(question, articleContext);

    res.json({ answer });
  } catch (error) {
    console.error('AskAI Error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
};

exports.chat = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const response = await aiService.chat(messages);

    res.json({ response });
  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({ error: 'Failed to chat with AI' });
  }
};