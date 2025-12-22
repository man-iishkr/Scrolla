// controllers/userController.js

exports.getSavedArticles = async (req, res) => {
  try {
    const user = req.user;
    res.json({ savedArticles: user.savedArticles || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch saved articles" });
  }
};

exports.toggleSaved = async (req, res) => {
  try {
    const user = req.user;
    const article = req.body;

    const index = user.savedArticles.findIndex(a => a.url === article.url);

    if (index >= 0) {
      user.savedArticles.splice(index, 1);
      await user.save();
      return res.json({ saved: false, savedArticles: user.savedArticles });
    }

    user.savedArticles.push(article);
    await user.save();
    res.json({ saved: true, savedArticles: user.savedArticles });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to toggle saved article" });
  }
};
