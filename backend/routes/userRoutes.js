const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/save-article', authMiddleware, userController.saveArticle);
router.delete('/unsave-article/:articleId', authMiddleware, userController.unsaveArticle);
router.get('/saved-articles', authMiddleware, userController.getSavedArticles);
router.put('/language', authMiddleware, userController.updateLanguage);
router.put('/location', authMiddleware, userController.updateLocation);

module.exports = router;