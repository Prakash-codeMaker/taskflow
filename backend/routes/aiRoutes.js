const express = require('express');
const {
  suggestTasks, generateSubtasks, parseNaturalLanguage,
  getCoaching, prioritizeTasks,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { createLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
router.use(protect);

// 30 AI requests per hour per user — Groq free tier is generous
const aiLimiter = createLimiter(
  60 * 60 * 1000, 30,
  'AI rate limit reached. Try again in an hour.'
);
router.use(aiLimiter);

router.get('/suggest',    suggestTasks);
router.post('/subtasks',  generateSubtasks);
router.post('/parse',     parseNaturalLanguage);
router.get('/coaching',   getCoaching);
router.get('/prioritize', prioritizeTasks);

module.exports = router;
