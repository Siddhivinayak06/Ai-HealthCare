const express = require('express');
const router = express.Router();
const { getActivity, logActivity } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getActivity);
router.post('/', protect, logActivity);

module.exports = router;
