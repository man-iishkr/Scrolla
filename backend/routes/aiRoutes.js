const express = require("express");
const router = express.Router();

/* Controllers */
const {
  getSummary,
  askAi
} = require("../controllers/aiController");

/* -------- AI ROUTES -------- */

/**
 * POST /api/ai/summary
 * Body: { title, description, url }
 */
router.post("/summary", getSummary);

/**
 * POST /api/ai/chat
 * Body: { question }
 */
router.post("/chat", askAi);

module.exports = router;
