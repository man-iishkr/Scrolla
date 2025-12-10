const express = require("express");
const auth = require("../middleware/authMiddleware");
const User = require("../models/user");
const router = express.Router();

// All routes here require auth
router.use(auth);

// GET /api/user/saved  → get saved articles for logged-in user
router.get("/saved", async (req, res) => {
  try {
    const user = req.user; // from middleware
    res.json({ savedArticles: user.savedArticles || [] });
  } catch (err) {
    console.error("GET /api/user/saved error:", err);
    res.status(500).json({ error: "Failed to load saved articles" });
  }
});

// POST /api/user/saved  → add or remove (toggle style)
router.post("/saved", async (req, res) => {
  try {
    const user = req.user;
    const article = req.body;

    if (!article || (!article.url && !article.id)) {
      return res.status(400).json({ error: "Article must have url or id" });
    }

    const key = article.url || article.id;
    const saved = user.savedArticles || [];

    const idx = saved.findIndex((it) => (it.url || it.id) === key);

    let nowSaved;
    if (idx >= 0) {
      // if exists → remove
      saved.splice(idx, 1);
      nowSaved = false;
    } else {
      saved.push(article);
      nowSaved = true;
    }

    user.savedArticles = saved;
    await user.save();

    res.json({
      saved: nowSaved,
      savedArticles: saved
    });
  } catch (err) {
    console.error("POST /api/user/saved error:", err);
    res.status(500).json({ error: "Failed to update saved article" });
  }
});
// ---------- SIMPLE NLP HELPERS ----------
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "for", "of", "in", "on", "with",
  "is", "are", "this", "that", "to", "from", "at", "by", "as",
  "it", "its", "be", "will", "can", "into", "new", "latest",
  "breaking", "news", "update", "updates"
]);

function extractKeywords(title = "") {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w) && w.length > 2);
}

// ---------- READING HISTORY ----------

// Log that the user clicked / read an article
router.post("/reading", async (req, res) => {
  try {
    const user = req.user;
    const { url, title, category, topic, sourceLabel } = req.body;

    if (!url && !title) {
      return res
        .status(400)
        .json({ error: "Article must have at least a url or title." });
    }

    const history = user.readingHistory || [];

    // limit history length
    const MAX_HISTORY = 200;
    if (history.length >= MAX_HISTORY) {
      history.shift(); // remove oldest
    }

    history.push({
      url,
      title,
      category,
      topic,
      sourceLabel
    });

    user.readingHistory = history;
    await user.save();

    res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/user/reading error:", err);
    res.status(500).json({ error: "Failed to record reading event." });
  }
});

// Compute personalised interest profile
router.get("/profile", async (req, res) => {
  try {
    const user = req.user;
    const history = user.readingHistory || [];

    if (!history.length) {
      return res.json({
        topCategories: [],
        topKeywords: []
      });
    }

    const categoryCounts = {};
    const keywordCounts = {};

    for (const item of history) {
      const cat = item.category || "General";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      const kws = extractKeywords(item.title || "");
      for (const kw of kws) {
        keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
      }
    }

    // sort and take top N
    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);

    const topKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([kw]) => kw);

    res.json({
      topCategories,
      topKeywords
    });
  } catch (err) {
    console.error("GET /api/user/profile error:", err);
    res.status(500).json({ error: "Failed to compute user profile." });
  }
});




module.exports = router;
