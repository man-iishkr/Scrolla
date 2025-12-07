const express = require("express");
const auth = require("../middleware/authMiddleware");
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

module.exports = router;
