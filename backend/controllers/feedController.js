// backend/controllers/feedController.js
const newsService = require('../services/news/newsService');
const User = require('../models/user');

exports.getMainFeed = async (req, res) => {
  try {
    const { category = 'all', page = 1 } = req.query;
    const user = req.user;

    // For home/main feed, get diverse content from India and US
    let articles = [];
    
    if (category === 'all') {
      // Get mix of Indian and international news
      const [indiaNews, usNews] = await Promise.all([
        newsService.getTopHeadlines({
          country: 'in',
          language: user?.language || 'en',
          pageSize: 10,
          page: parseInt(page)
        }),
        newsService.getTopHeadlines({
          country: 'us',
          language: user?.language || 'en',
          pageSize: 10,
          page: parseInt(page)
        })
      ]);

      // Merge and shuffle articles
      articles = [...indiaNews.articles, ...usNews.articles];
      articles = shuffleArray(articles);
      
    } else {
      // Category-specific news from India
      const result = await newsService.getTopHeadlines({
        country: 'in',
        language: user?.language || 'en',
        category,
        pageSize: 20,
        page: parseInt(page)
      });
      articles = result.articles;
    }

    res.json({
      articles: articles.slice(0, 20), // Limit to 20 per page
      totalResults: articles.length,
      page: parseInt(page)
    });
  } catch (error) {
    console.error('Feed Error:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
};

exports.getNationalNews = async (req, res) => {
  try {
    const user = req.user;
    const { page = 1 } = req.query;

    const result = await newsService.getTopHeadlines({
      country: 'in',
      language: user?.language || 'en',
      category: null,
      pageSize: 20,
      page: parseInt(page)
    });

    res.json({
      articles: result.articles,
      totalResults: result.totalResults
    });
  } catch (error) {
    console.error('National News Error:', error);
    res.status(500).json({ error: 'Failed to fetch national news' });
  }
};

exports.getInternationalNews = async (req, res) => {
  try {
    const user = req.user;
    const { page = 1 } = req.query;
    const language = user?.language || 'en';

    const result = await newsService.getTopHeadlines({
      country: 'us',
      language,
      pageSize: 20,
      page: parseInt(page)
    });

    res.json({
      articles: result.articles,
      totalResults: result.totalResults
    });
  } catch (error) {
    console.error('International News Error:', error);
    res.status(500).json({ error: 'Failed to fetch international news' });
  }
};

exports.getRegionalNews = async (req, res) => {
  try {
    const user = req.user;
    const state = user?.location?.state;

    if (!state) {
      return res.status(400).json({ error: 'Location not available. Please enable location access.' });
    }

    const language = user?.language || 'en';
    const { page = 1 } = req.query;
    
    const result = await newsService.getRegionalNews(state, language);

    res.json({
      articles: result.articles,
      totalResults: result.totalResults
    });
  } catch (error) {
    console.error('Regional News Error:', error);
    res.status(500).json({ error: 'Failed to fetch regional news' });
  }
};

exports.getForYouFeed = async (req, res) => {
  try {
    const user = req.user;
    const { page = 1 } = req.query;

    if (!user || user.isGuest) {
      return res.status(401).json({ error: 'Please login to access personalized feed' });
    }

    // Get user's reading preferences
    const topCategories = user.preferences.readingHistory
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.category);

    if (topCategories.length === 0) {
      // If no history, return general feed
      return exports.getMainFeed(req, res);
    }

    // Fetch articles from preferred categories
    const articles = [];
    for (const category of topCategories) {
      const result = await newsService.getTopHeadlines({
        country: user.location.country || 'in',
        language: user.language || 'en',
        category,
        pageSize: 10
      });
      articles.push(...result.articles);
    }

    // Remove duplicates and limit
    const uniqueArticles = articles.filter((article, index, self) =>
      index === self.findIndex((a) => a.articleId === article.articleId)
    );

    res.json({ 
      articles: uniqueArticles.slice(0, 20),
      totalResults: uniqueArticles.length
    });
  } catch (error) {
    console.error('For You Feed Error:', error);
    res.status(500).json({ error: 'Failed to fetch personalized feed' });
  }
};

exports.trackArticleClick = async (req, res) => {
  try {
    const { category } = req.body;
    const user = req.user;

    if (!user || user.isGuest) {
      return res.json({ message: 'Guest user, not tracking' });
    }

    // Update reading history
    const existingCategory = user.preferences.readingHistory.find(
      item => item.category === category
    );

    if (existingCategory) {
      existingCategory.count++;
    } else {
      user.preferences.readingHistory.push({ category, count: 1 });
    }

    await user.save();

    res.json({ message: 'Click tracked successfully' });
  } catch (error) {
    console.error('Track Click Error:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
};

// Helper function to shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}