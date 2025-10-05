const express = require('express');
const adminController = require('../controllers/adminController');
const { restrictToAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'server/temp-uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'test-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.'));
    }
  }
});

const router = express.Router();

// Restrict all routes to admin
router.use(restrictToAdmin);

// User management routes
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUser);
router.patch('/users/:id', adminController.updateUser);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);

// ML model management routes
router.post('/models', adminController.createModel);
router.get('/models', adminController.getAllModels);
router.get('/models/:id', adminController.getModel);
router.patch('/models/:id', adminController.updateModel);
router.delete('/models/:id', adminController.deleteModel);
router.post('/models/test-analysis', upload.single('image'), adminController.testModelAnalysis);
router.post('/models/sync', adminController.syncModels);

// Dashboard statistics
router.get('/stats', adminController.getDashboardStats);

module.exports = router; 