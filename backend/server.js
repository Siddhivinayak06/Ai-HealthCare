const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Multer setup for in-memory or memory storage
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/activity', require('./routes/activityRoutes'));
app.use('/api/analyses', require('./routes/analysisRoutes'));
app.use('/api/predict', require('./routes/predictRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));


// Health Check
app.get('/', (req, res) => {
  res.send('AI Healthcare Backend is running');
});

// Proxy to ML Service for JSON data
app.post('/api/predict', async (req, res) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error calling ML service:', error.message);
    res.status(500).json({ error: 'Failed to get prediction from ML service' });
  }
});

// Proxy for Image Upload
app.post('/api/predict/image', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const formData = new FormData();
    formData.append('file', req.file.buffer, req.file.originalname);

    const response = await axios.post(`${ML_SERVICE_URL}/predict/image`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error calling ML service (image):', error.message);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

// Proxy for Risk Prediction
app.post('/api/predict/risk', async (req, res) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict/risk`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error calling ML service (risk):', error.message);
    res.status(500).json({ error: 'Failed to calculate risk' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
});
