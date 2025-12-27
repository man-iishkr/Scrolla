const axios = require('axios');

class AIService {
  constructor() {
    this.deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    this.deepseekBase = 'https://api.deepseek.com/v1';
  }

  async generateSummary(articleText, title) {
    try {
      const prompt = `Summarize the following news article in 30-50 words. Focus on the key facts and main points:\n\nTitle: ${title}\n\nArticle: ${articleText}`;

      const response = await axios.post(
        `${this.deepseekBase}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that creates concise news summaries.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 100,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${this.deepseekApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('DeepSeek Summary Error:', error.response?.data || error.message);
      throw new Error('Failed to generate summary');
    }
  }

  async askAI(question, articleContext) {
    try {
      const prompt = `Based on this news article context, answer the following question:\n\nArticle Context: ${articleContext}\n\nQuestion: ${question}\n\nProvide a clear, factual answer in 2-3 sentences.`;

      const response = await axios.post(
        `${this.deepseekBase}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are a helpful news assistant that answers questions about news articles accurately and concisely.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 200,
          temperature: 0.5
        },
        {
          headers: {
            'Authorization': `Bearer ${this.deepseekApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('DeepSeek AskAI Error:', error.response?.data || error.message);
      throw new Error('Failed to get AI response');
    }
  }

  async chat(messages) {
    try {
      const response = await axios.post(
        `${this.deepseekBase}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are a helpful news assistant.' },
            ...messages
          ],
          max_tokens: 300,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.deepseekApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('DeepSeek Chat Error:', error.response?.data || error.message);
      throw new Error('Failed to chat with AI');
    }
  }
}

module.exports = new AIService();