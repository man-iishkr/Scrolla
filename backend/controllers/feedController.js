// backend/controllers/feedController.js

const { fetchNews } = require("../services/news/newsService");

exports.getFeed = async (req, res) => {
  try {
    const {
      topic,
      q,
      page = 1,
      limit = 10
    } = req.query;

    const newsData = await fetchNews({
      category: topic,
      q,
      page: Number(page),
      pageSize: Number(limit)
    });

    // ✅ Correct response shape
    res.json({
      items: newsData.articles,
      totalResults: newsData.totalResults
    });

  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch news"
    });
  }console.log("CATEGORY RECEIVED:", req.query.category);

};
