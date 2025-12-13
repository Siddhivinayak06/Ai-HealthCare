const express = require('express');
const router = express.Router();
const {
    getStats,
    getAnalytics,
    getConditions,
    getPredictionStats,
    getRiskDistribution,
    getModelAccuracy,
    getPatientPredictions
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/stats', protect, getStats);
router.get('/analytics', protect, getAnalytics);
router.get('/conditions', protect, getConditions);
router.get('/prediction-stats', protect, getPredictionStats);
router.get('/risk-distribution', protect, getRiskDistribution);
router.get('/model-accuracy', protect, getModelAccuracy);
router.get('/patient-predictions', protect, getPatientPredictions);

module.exports = router;
