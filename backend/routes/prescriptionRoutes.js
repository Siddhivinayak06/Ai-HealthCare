const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { protect } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

router.post('/', prescriptionController.createPrescription);
router.get('/patient/:patientId', prescriptionController.getPatientPrescriptions);
router.get('/doctor/me', prescriptionController.getDoctorPrescriptions);

module.exports = router;
