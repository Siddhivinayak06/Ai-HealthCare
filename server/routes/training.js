const express = require('express');
const trainingController = require('../controllers/trainingController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(authenticateToken);

// Training job routes
router.get('/jobs', trainingController.getAllJobs);
router.post('/jobs', trainingController.createJob);
router.get('/jobs/:id', trainingController.getJob);
router.patch('/jobs/:id/cancel', trainingController.cancelJob);
router.delete('/jobs/:id', trainingController.deleteJob);

module.exports = router; 