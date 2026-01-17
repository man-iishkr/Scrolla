// backend/services/ai/aiService.js - Fixed for Gemini 2.5 Flash
const axios = require('axios');

class AIService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.geminiBase = 'https://generativelanguage.googleapis.com/v1beta';
    // Use gemini-2.5-flash instead of gemini-pro
    this.model = 'gemini-2.5-flash';
  }

  async generateSummary(articleText, title) {
    try {
      if (!this.geminiApiKey) {
        throw new Error('Gemini API key not configured');
      }

      const prompt = `TASK: Summarize the article titled "${title}".
CONSTRAINT: Your summary MUST be between 50 and 70 words.
STYLE: Use professional, objective language. No intro (e.g., "This article is about").
CONTENT: Focus on the 'Who, What, Where, and Why'.
ARTICLE TEXT: ${articleText}`;

      const response = await axios.post(
        `${this.geminiBase}/models/${this.model}:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 110,
            topP: 0.8,
            topK: 10,
            stopSequences: ["\n\n\n"]
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const summary = response.data.candidates[0].content.parts[0].text.trim();
      return summary;
    } catch (error) {
      console.error('Gemini Summary Error:', error.response?.data || error.message);
      
      // Provide fallback summary
      if (error.response?.status === 400 || error.response?.status === 404) {
        console.error('Gemini API error - check API key or model name');
      }
      
      throw new Error('Failed to generate summary');
    }
  }

  async askAI(question, articleContext) {
    try {
      if (!this.geminiApiKey) {
        throw new Error('Gemini API key not configured');
      }

      const prompt = `Based on this news article context, answer the following question. Provide a clear, factual answer in 2-3 sentences.\n\nArticle Context: ${articleContext}\n\nQuestion: ${question}\n\nAnswer:`;

      const response = await axios.post(
        `${this.geminiBase}/models/${this.model}:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 130,
            topP: 0.8,
            topK: 10,
            stopSequences: ["\n\n\n"]
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const answer = response.data.candidates[0].content.parts[0].text.trim();
      return answer;
    } catch (error) {
      console.error('Gemini AskAI Error:', error.response?.data || error.message);
      throw new Error('Failed to get AI response');
    }
  }

  // async chat(messages) {
  //   try {
  //     if (!this.geminiApiKey) {
  //       throw new Error('Gemini API key not configured');
  //     }

  //     // Convert messages to Gemini format
  //     const geminiMessages = messages.map(msg => ({
  //       parts: [{
  //         text: msg.content
  //       }]
  //     }));

  //     const response = await axios.post(
  //       `${this.geminiBase}/models/${this.model}:generateContent?key=${this.geminiApiKey}`,
  //       {
  //         contents: geminiMessages,
  //         generationConfig: {
  //           temperature: 0.3,
  //           maxOutputTokens: 150,
  //           topP: 0.9,
  //           topK: 40,
  //           stopSequences: ["\n\n\n"]
  //         }
  //       },
  //       {
  //         headers: {
  //           'Content-Type': 'application/json'
  //         }
  //       }
  //     );

  //     const reply = response.data.candidates[0].content.parts[0].text.trim();
  //     return reply;
  //   } catch (error) {
  //     console.error('Gemini Chat Error:', error.response?.data || error.message);
  //     throw new Error('Failed to chat with AI');
  //   }
  // }
  async chat(messages) {
  try {
    if (!this.geminiApiKey) throw new Error('Gemini API key not configured');

    // Gemini expects an array of objects with 'role' and 'parts'
    // roles must be 'user' or 'model'
    const geminiMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user', 
      parts: [{ text: msg.content }]
    }));

    const response = await axios.post(
      `${this.geminiBase}/models/${this.model}:generateContent?key=${this.geminiApiKey}`,
      {
        contents: geminiMessages,
        generationConfig: {
          temperature: 0.7, // Higher for chat to allow more natural flow
          maxOutputTokens: 500, // INCREASE THIS so responses aren't cut off
          topP: 0.9,
          topK: 40
        }
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    // Safeguard for empty or blocked responses
    if (!response.data.candidates || !response.data.candidates[0].content) {
        return "I'm sorry, I couldn't generate a response for that.";
    }

    return response.data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error('Gemini Chat Error:', error.response?.data || error.message);
    throw new Error('Failed to chat with AI');
  }
}
}

module.exports = new AIService();