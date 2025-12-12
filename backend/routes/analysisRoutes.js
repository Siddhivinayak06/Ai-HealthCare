const express = require('express');
const router = express.Router();
const { saveImageAnalysis, getRecentAnalyses, saveRiskPrediction, getPatientPredictions } = require('../controllers/analysisController');
const { protect } = require('../middleware/authMiddleware');

router.post('/image', protect, saveImageAnalysis);
router.get('/recent', protect, getRecentAnalyses);
router.post('/risk', protect, saveRiskPrediction);
router.get('/risk/:patientId', protect, getPatientPredictions);

module.exports = router;
