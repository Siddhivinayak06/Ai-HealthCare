const express = require('express');
const router = express.Router();
const { getReports, createReport, deleteReport } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getReports);
router.post('/', protect, createReport);
router.delete('/:id', protect, deleteReport);

module.exports = router;
