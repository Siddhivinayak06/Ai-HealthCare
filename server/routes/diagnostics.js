const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const diagnosticsController = require('../controllers/diagnosticsController');
const { restrictToAdmin } = require('../middleware/auth');

const router = express.Router();

// Set up storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: userId_timestamp_originalname
    const uniqueSuffix = `${req.user._id}_${Date.now()}`;
    cb(null, `${uniqueSuffix}_${file.originalname}`);
  },
});

// File filter to only allow certain image types
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|dicom)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Configure upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  fileFilter: fileFilter,
});

// Routes
router.post('/upload', upload.array('images', 5), diagnosticsController.uploadMedicalImages);
router.post('/analyze/:recordId', diagnosticsController.analyzeMedicalImages);
router.post('/analyze-image', upload.single('image'), diagnosticsController.analyzeSingleImage);
router.get('/records', diagnosticsController.getMedicalRecords);
router.get('/records/:id', diagnosticsController.getMedicalRecord);
router.patch('/records/:id/diagnosis', diagnosticsController.updateDoctorDiagnosis);
router.delete('/records/:id', diagnosticsController.deleteMedicalRecord);
router.get('/models', diagnosticsController.getAvailableModels);

module.exports = router; 