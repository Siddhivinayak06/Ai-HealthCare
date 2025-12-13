const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment
} = require('../controllers/appointmentController');

router.use(protect);

router.route('/')
    .get(getAppointments)
    .post(createAppointment);

router.route('/:id')
    .put(updateAppointment)
    .delete(deleteAppointment);

module.exports = router;
