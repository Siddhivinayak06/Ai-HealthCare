const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { updateProfile, getUserStats } = require('../controllers/userController');

// Profile routes
router.patch('/profile', authenticateToken, updateProfile);

// Dashboard stats
router.get('/stats', authenticateToken, getUserStats);

module.exports = router; 