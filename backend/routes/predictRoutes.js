const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const axios = require('axios');

// Proxy to ML Service (running on port 8000)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

// Configure multer for memory storage
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const FormData = require('form-data');

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

// @route   POST /api/predict/image
// @desc    Get image diagnosis from ML model
// @access  Private
router.post('/image', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file uploaded' });
        }

        // Create FormData to forward the file
        const formData = new FormData();
        // Append buffer with filename and contentType
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        // Forward to ML Service using axios (better form-data support than fetch)
        // Added 5s timeout to prevent infinite loading
        const response = await axios.post(`${ML_SERVICE_URL}/predict/image`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 5000,
        });

        res.json(response.data);

    } catch (error) {
        console.error('Error proxying image to ML service:', error.message);

        // Handle Timeout and Connection Refused explicitly
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            console.error(`Failed to connect to ML Service at ${ML_SERVICE_URL}`);
            return res.status(503).json({
                message: 'ML Service Unavailable',
                details: `Could not connect to ML Service (${error.code}). Please check server logs.`
            });
        }

        if (error.response) {
            console.error('ML Service Response:', error.response.data);
            return res.status(error.response.status).json({
                message: 'ML Service Image Analysis Failed',
                details: JSON.stringify(error.response.data)
            });
        }
        res.status(500).json({
            message: 'Failed to connect to ML service for image analysis.',
            error: error.message
        });
    }
});

module.exports = router;

