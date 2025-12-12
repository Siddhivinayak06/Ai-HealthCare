const express = require('express');
const router = express.Router();
const { getStats, getAnalytics, getConditions } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/stats', protect, getStats);
router.get('/analytics', protect, getAnalytics);
router.get('/conditions', protect, getConditions);

module.exports = router;
