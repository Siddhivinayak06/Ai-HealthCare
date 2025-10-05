const express = require('express');
const datasetController = require('../controllers/datasetController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(authenticateToken);

// Dataset routes
router.get('/', datasetController.getAllDatasets);
router.post('/', datasetController.createDataset);
router.get('/:id', datasetController.getDataset);
router.patch('/:id', datasetController.updateDataset);
router.delete('/:id', datasetController.deleteDataset);

// Image upload routes
router.post('/:id/images', datasetController.uploadImages, datasetController.addImages);

module.exports = router; 