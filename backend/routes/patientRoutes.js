const express = require('express');
const router = express.Router();
const { getPatients, getPatient, createPatient, updatePatient, deletePatient, addHealthRecord, getHealthRecords } = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getPatients);
router.post('/', protect, createPatient);
router.get('/:id', protect, getPatient);
router.put('/:id', protect, updatePatient);
router.delete('/:id', protect, deletePatient);
router.post('/:id/records', protect, addHealthRecord);
router.get('/:id/records', protect, getHealthRecords);

module.exports = router;
