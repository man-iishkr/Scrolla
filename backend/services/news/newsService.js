// backend/services/news/newsService.js - Multiple API Integration
const axios = require('axios');
const { normalizeArticle } = require('../../utils/normalizeArticle');

class NewsService {
  constructor() {
    // API Keys
    this.newsApiKey = process.env.NEWS_API_KEY;
    this.newsdataApiKey = process.env.NEWSDATA_API_KEY;
    this.gnewsApiKey = process.env.GNEWS_API_KEY;
    
    // API Endpoints
    this.newsApiBase = 'https://newsapi.org/v2';
    this.newsdataBase = 'https://newsdata.io/api/1';
    this.gnewsBase = 'https://gnews.io/api/v4';
  }

  // === NewsAPI.org ===
  async getFromNewsAPI(options = {}) {
    const {
      country = 'in',
      category = null,
      language = 'en',
      pageSize = 30,
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
      
      return response.data.articles.map(article => 
        normalizeArticle(article, 'newsapi')
      );
    } catch (error) {
      console.error('NewsAPI Error:', error.response?.data?.message || error.message);
      return [];
    }
  }

  // === NewsData.io ===
  async getFromNewsData(options = {}) {
    const {
      country = 'in',
      category = null,
      language = 'en',
      pageSize = 10
    } = options;

    try {
      const params = {
        apikey: this.newsdataApiKey,
        country,
        language,
        size: pageSize
      };

      if (category && category !== 'all') {
        params.category = category;
      }

      const response = await axios.get(`${this.newsdataBase}/news`, { params });
      
      return response.data.results?.map(article => ({
        articleId: article.article_id || article.link,
        title: article.title,
        description: article.description,
        content: article.content || article.description,
        url: article.link,
        urlToImage: article.image_url,
        publishedAt: new Date(article.pubDate),
        source: {
          id: article.source_id,
          name: article.source_id
        },
        author: article.creator?.[0] || 'Unknown',
        category: article.category?.[0]
      })) || [];
    } catch (error) {
      console.error('NewsData Error:', error.response?.data?.message || error.message);
      return [];
    }
  }

  // === GNews API ===
  async getFromGNews(options = {}) {
    const {
      country = 'in',
      category = null,
      language = 'en',
      pageSize = 10
    } = options;

    try {
      const params = {
        apikey: this.gnewsApiKey,
        country,
        lang: language,
        max: pageSize
      };

      if (category && category !== 'all') {
        params.category = category;
      }

      const response = await axios.get(`${this.gnewsBase}/top-headlines`, { params });
      
      return response.data.articles?.map(article => ({
        articleId: article.url,
        title: article.title,
        description: article.description,
        content: article.content,
        url: article.url,
        urlToImage: article.image,
        publishedAt: new Date(article.publishedAt),
        source: {
          id: article.source.name,
          name: article.source.name
        },
        author: article.source.name,
        category: category
      })) || [];
    } catch (error) {
      console.error('GNews Error:', error.response?.data?.message || error.message);
      return [];
    }
  }

  // === Combined Fetch from All APIs ===
  async getTopHeadlines(options = {}) {
    const {
      country = 'in',
      category = null,
      language = 'en',
      pageSize = 50,
      page = 1
    } = options;

    console.log(`Fetching news: country=${country}, category=${category}, lang=${language}`);

    try {
      // Fetch from all APIs in parallel
      const [newsApiArticles, newsdataArticles, gnewsArticles] = await Promise.allSettled([
        this.getFromNewsAPI({ country, category, language, pageSize: 20, page }),
        this.getFromNewsData({ country, category, language, pageSize: 15 }),
        this.getFromGNews({ country, category, language, pageSize: 15 })
      ]);

      // Combine results
      let allArticles = [];
      
      if (newsApiArticles.status === 'fulfilled') {
        allArticles.push(...newsApiArticles.value);
        console.log(`✓ NewsAPI: ${newsApiArticles.value.length} articles`);
      }
      
      if (newsdataArticles.status === 'fulfilled') {
        allArticles.push(...newsdataArticles.value);
        console.log(`✓ NewsData: ${newsdataArticles.value.length} articles`);
      }
      
      if (gnewsArticles.status === 'fulfilled') {
        allArticles.push(...gnewsArticles.value);
        console.log(`✓ GNews: ${gnewsArticles.value.length} articles`);
      }

      // Remove duplicates based on title similarity
      allArticles = this.removeDuplicates(allArticles);
      
      // Sort by date (newest first)
      allArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

      console.log(`✓ Total unique articles: ${allArticles.length}`);

      return {
        articles: allArticles.slice(0, pageSize),
        totalResults: allArticles.length
      };
    } catch (error) {
      console.error('Combined Fetch Error:', error.message);
      return {
        articles: [],
        totalResults: 0
      };
    }
  }

  // === Search News ===
  async searchNews(query, options = {}) {
    const {
      language = 'en',
      sortBy = 'publishedAt',
      pageSize = 30,
      page = 1
    } = options;

    try {
      // Only NewsAPI supports search properly
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
        articles: response.data.articles.map(article => 
          normalizeArticle(article, 'newsapi')
        ),
        totalResults: response.data.totalResults
      };
    } catch (error) {
      console.error('Search Error:', error.message);
      return {
        articles: [],
        totalResults: 0
      };
    }
  }

  // === Trending India News ===
  async getTrendingIndiaNews(language = 'en', pageSize = 50, page = 1) {
    try {
      console.log('Fetching trending India news...');
      
      // Fetch from all sources
      const result = await this.getTopHeadlines({
        country: 'in',
        category: null,
        language,
        pageSize,
        page
      });

      return result;
    } catch (error) {
      console.error('Trending News Error:', error.message);
      return {
        articles: [],
        totalResults: 0
      };
    }
  }

  // === Regional News (State/City) ===
  async getRegionalNews(state, city = null, language = 'en', pageSize = 30, page = 1) {
    try {
      const locationQuery = city ? `${city} ${state} India` : `${state} India`;
      console.log(`Fetching regional news for: ${locationQuery}`);
      
      return await this.searchNews(locationQuery, {
        language,
        sortBy: 'publishedAt',
        pageSize,
        page
      });
    } catch (error) {
      console.error('Regional News Error:', error.message);
      return {
        articles: [],
        totalResults: 0
      };
    }
  }

  // === International News ===
  async getInternationalNews(language = 'en', pageSize = 50, page = 1) {
    try {
      console.log('Fetching international news...');
      
      // Fetch from US, UK for international coverage
      const [usNews, ukNews] = await Promise.allSettled([
        this.getTopHeadlines({ country: 'us', language: 'en', pageSize: 25, page }),
        this.getTopHeadlines({ country: 'gb', language: 'en', pageSize: 25, page })
      ]);

      let articles = [];
      
      if (usNews.status === 'fulfilled') {
        articles.push(...usNews.value.articles);
      }
      
      if (ukNews.status === 'fulfilled') {
        articles.push(...ukNews.value.articles);
      }

      // Remove duplicates and sort
      articles = this.removeDuplicates(articles);
      articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

      return {
        articles: articles.slice(0, pageSize),
        totalResults: articles.length
      };
    } catch (error) {
      console.error('International News Error:', error.message);
      return {
        articles: [],
        totalResults: 0
      };
    }
  }

  // === Remove Duplicate Articles ===
  removeDuplicates(articles) {
    const seen = new Map();
    
    return articles.filter(article => {
      // Normalize title for comparison
      const normalizedTitle = article.title
        ?.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim();
      
      if (!normalizedTitle) return true;
      
      // Check for exact or very similar titles
      for (const [seenTitle, seenArticle] of seen.entries()) {
        const similarity = this.calculateSimilarity(normalizedTitle, seenTitle);
        if (similarity > 0.8) {
          // Keep the one with more content
          if ((article.description?.length || 0) > (seenArticle.description?.length || 0)) {
            seen.delete(seenTitle);
            seen.set(normalizedTitle, article);
            return true;
          }
          return false;
        }
      }
      
      seen.set(normalizedTitle, article);
      return true;
    });
  }

  // === Calculate Title Similarity ===
  calculateSimilarity(str1, str2) {
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    const intersection = words1.filter(word => words2.includes(word));
    return (2.0 * intersection.length) / (words1.length + words2.length);
  }
}

module.exports = new NewsService();