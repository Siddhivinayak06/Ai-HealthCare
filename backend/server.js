const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { pool } = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));


// Health Check
app.get('/', (req, res) => {
  res.send('AI Healthcare Backend is running');
});

// Test database connection
pool.query('SELECT NOW()')
  .then(() => console.log('Connected to Database at:', new Date().toISOString()))
  .catch(err => console.error('Database connection error:', err));

app.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
});
