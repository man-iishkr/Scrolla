const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feedController');
const { optionalAuth, authMiddleware } = require('../middleware/authMiddleware');

router.get('/main', optionalAuth, feedController.getMainFeed);
router.get('/national', optionalAuth, feedController.getNationalNews);
router.get('/international', optionalAuth, feedController.getInternationalNews);
router.get('/regional', authMiddleware, feedController.getRegionalNews);
router.get('/for-you', authMiddleware, feedController.getForYouFeed);
router.post('/track-click', authMiddleware, feedController.trackArticleClick);

module.exports = router;