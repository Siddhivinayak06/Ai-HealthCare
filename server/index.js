require('dotenv').config({ path: '../config/.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const diagnosticRoutes = require('./routes/diagnostics');
const datasetRoutes = require('./routes/datasets');
const trainingRoutes = require('./routes/training');

// Import middleware
const { authenticateToken } = require('./middleware/auth');

// Import utilities
const { initModelPlaceholders } = require('./utils/ml/modelSetup');
const { initializeTrainingService } = require('./utils/ml/training');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure CORS
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
  credentials: true,
  exposedHeaders: ['Content-Disposition']
};

app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Serve static uploads directory - fix the path issue
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Serve ML models with CORS headers - fix the path issue
app.use('/ml-models', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
}, express.static(path.join(__dirname, '..', 'ml-models')));

// Add a diagnostic route to verify file paths
app.get('/debug/paths', (req, res) => {
  const uploadDirPath = path.join(__dirname, 'uploads');
  const modelsDirPath = path.join(__dirname, '..', 'ml-models');
  
  const uploadDirExists = fs.existsSync(uploadDirPath);
  const modelsDirExists = fs.existsSync(modelsDirPath);
  
  let uploadFiles = [];
  let modelDirs = [];
  
  try {
    if (uploadDirExists) {
      uploadFiles = fs.readdirSync(uploadDirPath);
    }
    
    if (modelsDirExists) {
      modelDirs = fs.readdirSync(modelsDirPath);
    }
  } catch (err) {
    console.error('Error reading directories:', err);
  }
  
  res.json({
    paths: {
      uploadDir: uploadDirPath,
      modelsDir: modelsDirPath
    },
    exists: {
      uploadDir: uploadDirExists,
      modelsDir: modelsDirExists
    },
    contents: {
      uploadFiles,
      modelDirs
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/diagnostics', authenticateToken, diagnosticRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/training', trainingRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Initialize server
const initializeServer = async () => {
  try {
    // Initialize ML models
    console.log('Setting up ML model placeholders...');
    await initModelPlaceholders();
    console.log('ML models placeholders set up successfully.');
    
    // Initialize ML training service
    await initializeTrainingService();

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error initializing server:', error);
    process.exit(1);
  }
};

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    // Initialize server components
    await initializeServer();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'An unexpected error occurred',
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Don't crash in production, just log
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

module.exports = app; // For testing purposes 