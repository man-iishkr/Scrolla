const axios = require('axios');
const { normalizeArticle } = require('../../utils/normalizeArticle');

class NewsService {
  constructor() {
    this.newsApiKey = process.env.NEWS_API_KEY;
    this.newsApiBase = 'https://newsapi.org/v2';
  }

  async getTopHeadlines(options = {}) {
    const {
      country = 'in',
      category = null,
      language = 'en',
      pageSize = 20,
      page = 1
    } = options;

    try {
      const params = {
        apiKey: this.newsApiKey,
        country,
        pageSize,
        page
      };

      if (category && category !== 'all') {
        params.category = category;
      }

      const response = await axios.get(`${this.newsApiBase}/top-headlines`, { params });
      
      return {
        articles: response.data.articles.map(article => normalizeArticle(article, 'newsapi')),
        totalResults: response.data.totalResults
      };
    } catch (error) {
      console.error('NewsAPI Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch news from NewsAPI');
    }
  }

  async searchNews(query, options = {}) {
    const {
      language = 'en',
      sortBy = 'publishedAt',
      pageSize = 20,
      page = 1
    } = options;

    try {
      const params = {
        apiKey: this.newsApiKey,
        q: query,
        language,
        sortBy,
        pageSize,
        page
      };

      const response = await axios.get(`${this.newsApiBase}/everything`, { params });
      
      return {
        articles: response.data.articles.map(article => normalizeArticle(article, 'newsapi')),
        totalResults: response.data.totalResults
      };
    } catch (error) {
      console.error('NewsAPI Search Error:', error.response?.data || error.message);
      throw new Error('Failed to search news');
    }
  }

  async getRegionalNews(state, language = 'en') {
    const query = `India ${state}`;
    return await this.searchNews(query, { language, pageSize: 15 });
  }

  async getInternationalNews(language = 'en') {
    try {
      const response = await this.getTopHeadlines({
        country: 'us',
        language,
        pageSize: 15
      });
      return response;
    } catch (error) {
      console.error('International News Error:', error.message);
      throw error;
    }
  }
}

module.exports = new NewsService();