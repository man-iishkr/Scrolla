// backend/controllers/feedController.js - Enhanced for Indian Audience
const newsService = require('../services/news/newsService');
const User = require('../models/user');

exports.getMainFeed = async (req, res) => {
  try {
    const { category = 'all', page = 1 } = req.query;
    const user = req.user;
    const language = user?.language || 'en';

    console.log(`Main Feed Request: category=${category}, lang=${language}, page=${page}`);

    let result;
    
    if (category === 'all') {
      // Get diverse mix from India (main focus)
      result = await newsService.getTopHeadlines({
        country: 'in',
        category: null,
        language,
        pageSize: 50,
        page: parseInt(page)
      });
    } else {
      // Category-specific news from India
      result = await newsService.getTopHeadlines({
        country: 'in',
        category,
        language,
        pageSize: 50,
        page: parseInt(page)
      });
    }

    console.log(`✓ Returning ${result.articles.length} articles for main feed`);

    res.json({
      articles: result.articles,
      totalResults: result.totalResults,
      page: parseInt(page)
    });
  } catch (error) {
    console.error('Main Feed Error:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
};

exports.getNationalNews = async (req, res) => {
  try {
    const user = req.user;
    const { page = 1 } = req.query;
    const language = user?.language || 'en';

    console.log(`National News Request: lang=${language}, page=${page}`);

    // Get trending India news from all sources
    const result = await newsService.getTrendingIndiaNews(language, 50, parseInt(page));

    console.log(`✓ Returning ${result.articles.length} national articles`);

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

    console.log(`International News Request: lang=${language}, page=${page}`);

    const result = await newsService.getInternationalNews(language, 50, parseInt(page));

    console.log(`✓ Returning ${result.articles.length} international articles`);

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
    const city = user?.location?.city;

    if (!state) {
      return res.status(400).json({ 
        error: 'Location not available. Please enable location access.' 
      });
    }

    const language = user?.language || 'en';
    const { page = 1 } = req.query;
    
    console.log(`Regional News Request: ${city}, ${state}, lang=${language}`);

    const result = await newsService.getRegionalNews(
      state, 
      city, 
      language, 
      50, 
      parseInt(page)
    );

    console.log(`✓ Returning ${result.articles.length} regional articles`);

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
    const language = user?.language || 'en';

    if (!user || user.isGuest) {
      return res.status(401).json({ 
        error: 'Please login to access personalized feed' 
      });
    }

    console.log(`For You Feed Request: user=${user.name}, lang=${language}`);

    // Get user's reading preferences
    const topCategories = user.preferences.readingHistory
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.category);

    if (topCategories.length === 0) {
      console.log('No reading history, returning main feed');
      return exports.getMainFeed(req, res);
    }

    console.log(`Top categories: ${topCategories.join(', ')}`);

    // Fetch articles from preferred categories
    const results = await Promise.allSettled(
      topCategories.map(category =>
        newsService.getTopHeadlines({
          country: 'in',
          language,
          category,
          pageSize: 20
        })
      )
    );

    let articles = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        articles.push(...result.value.articles);
        console.log(`✓ Category ${topCategories[index]}: ${result.value.articles.length} articles`);
      }
    });

    // Remove duplicates
    const uniqueArticles = newsService.removeDuplicates(articles);
    
    // Sort by date
    uniqueArticles.sort((a, b) => 
      new Date(b.publishedAt) - new Date(a.publishedAt)
    );

    console.log(`✓ Returning ${uniqueArticles.length} personalized articles`);

    res.json({ 
      articles: uniqueArticles.slice(0, 50),
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

    console.log(`✓ Tracked click: ${user.name} → ${category}`);

    res.json({ message: 'Click tracked successfully' });
  } catch (error) {
    console.error('Track Click Error:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
};