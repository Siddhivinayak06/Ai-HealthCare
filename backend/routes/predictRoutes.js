const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Proxy to ML Service (running on port 8000)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

// @route   POST /api/predict/risk
// @desc    Get risk prediction from ML model
// @access  Private
router.post('/risk', protect, async (req, res) => {
    try {
        // Forward request to ML service
        const response = await fetch(`${ML_SERVICE_URL}/predict/risk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('ML Service Error:', errorText);
            return res.status(response.status).json({ message: 'ML Service Error', details: errorText });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error proxying to ML service:', error);
        res.status(500).json({
            message: 'Failed to connect to ML service. Is it running?',
            hint: 'Run python main.py in ml-modal directory'
        });
    }
});

module.exports = router;
