const express = require('express');
const { getOverview, getCompletionTrend, getPriorityDistribution, getCategoryBreakdown, getProductivityScore } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/overview', getOverview);
router.get('/trend', getCompletionTrend);
router.get('/priority', getPriorityDistribution);
router.get('/category', getCategoryBreakdown);
router.get('/productivity', getProductivityScore);

module.exports = router;
