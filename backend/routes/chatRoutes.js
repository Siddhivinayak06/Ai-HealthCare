const express = require('express');
const router = express.Router();
const { handleChat } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// For now, let's allow public access or require auth?
// Implementation plan said "health assistant", implies user context might be useful but sticking to protect for consistency.
router.post('/', protect, handleChat);

module.exports = router;
