const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/admin-register', authController.adminRegister);
router.post('/login', authController.login);

// Protected routes - require authentication
router.use(authenticateToken); // Apply middleware to all routes below this
router.get('/me', authController.getMe);
router.patch('/update-profile', authController.updateProfile);
router.patch('/update-password', authController.updatePassword);

module.exports = router; 