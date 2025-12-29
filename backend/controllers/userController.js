const User = require('../models/user');

exports.saveArticle = async (req, res) => {
  try {
    const user = req.user;
    const article = req.body;

    if (user.isGuest) {
      return res.status(401).json({ error: 'Please login to save articles' });
    }

    // Check if already saved
    const alreadySaved = user.savedArticles.some(
      saved => saved.articleId === article.articleId
    );

    if (alreadySaved) {
      return res.status(400).json({ error: 'Article already saved' });
    }

    user.savedArticles.push({
      articleId: article.articleId,
      title: article.title,
      description: article.description,
      url: article.url,
      urlToImage: article.urlToImage,
      publishedAt: article.publishedAt,
      source: article.source?.name,
      category: article.category
    });

    await user.save();

    res.json({ message: 'Article saved successfully', savedArticles: user.savedArticles });
  } catch (error) {
    console.error('Save Article Error:', error);
    res.status(500).json({ error: 'Failed to save article' });
  }
};

exports.unsaveArticle = async (req, res) => {
  try {
    const user = req.user;
    const { articleId } = req.params;

    user.savedArticles = user.savedArticles.filter(
      article => article.articleId !== articleId
    );

    await user.save();

    res.json({ message: 'Article removed successfully', savedArticles: user.savedArticles });
  } catch (error) {
    console.error('Unsave Article Error:', error);
    res.status(500).json({ error: 'Failed to remove article' });
  }
};

exports.getSavedArticles = async (req, res) => {
  try {
    const user = req.user;

    if (user.isGuest) {
      return res.status(401).json({ error: 'Please login to view saved articles' });
    }

    res.json({ savedArticles: user.savedArticles });
  } catch (error) {
    console.error('Get Saved Articles Error:', error);
    res.status(500).json({ error: 'Failed to fetch saved articles' });
  }
};

exports.updateLanguage = async (req, res) => {
  try {
    const user = req.user;
    const { language } = req.body;

    if (!['en', 'hi'].includes(language)) {
      return res.status(400).json({ error: 'Invalid language' });
    }

    user.language = language;
    await user.save();

    res.json({ message: 'Language updated successfully', language });
  } catch (error) {
    console.error('Update Language Error:', error);
    res.status(500).json({ error: 'Failed to update language' });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const user = req.user;
    const { country, state, city, lat, lon } = req.body;

    user.location = {
      country: country || user.location.country,
      state: state || user.location.state,
      city: city || user.location.city,
      lat: lat || user.location.lat,
      lon: lon || user.location.lon
    };

    await user.save();

    res.json({ message: 'Location updated successfully', location: user.location });
  } catch (error) {
    console.error('Update Location Error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
};