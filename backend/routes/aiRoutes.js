const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.post('/summary', optionalAuth, aiController.generateSummary);
router.post('/ask', optionalAuth, aiController.askAI);
router.post('/chat', optionalAuth, aiController.chat);

module.exports = router;