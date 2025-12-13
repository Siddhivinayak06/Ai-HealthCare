const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, updateProfile, changePassword, getDoctors } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);
router.get('/doctors', protect, getDoctors);

module.exports = router;
