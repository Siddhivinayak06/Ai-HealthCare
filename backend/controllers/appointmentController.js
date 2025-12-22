const { db } = require('../db');
const { appointments, patients, users } = require('../db/schema');
const { eq, and, gte, lte, asc, sql: drizzleSql } = require('drizzle-orm');

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
    try {
        const userId = req.user.id;
        const { start, end } = req.query;

        let whereClause;

        if (req.user.role === 'patient') {
            const patientSubquery = db.select({ id: patients.id }).from(patients).where(eq(patients.userId, userId));
            whereClause = eq(appointments.patientId, patientSubquery);
        } else {
            whereClause = eq(appointments.userId, userId);
        }

        if (start && end) {
            whereClause = and(
                whereClause,
                gte(appointments.startTime, new Date(start)),
                lte(appointments.endTime, new Date(end))
            );
        }

        const result = await db.select({
            id: appointments.id,
            userId: appointments.userId,
            patientId: appointments.patientId,
            title: appointments.title,
            startTime: appointments.startTime,
            endTime: appointments.endTime,
            status: appointments.status,
            type: appointments.type,
            notes: appointments.notes,
            firstName: patients.firstName,
            lastName: patients.lastName
        })
            .from(appointments)
            .leftJoin(patients, eq(appointments.patientId, patients.id))
            .where(whereClause)
            .orderBy(asc(appointments.startTime));

        res.json(result);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private
const createAppointment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { patient_id, title, start_time, end_time, type, notes, doctor_id } = req.body;

        let hostId = userId;

        if (req.user.role === 'patient') {
            if (!doctor_id) {
                return res.status(400).json({ message: 'Please select a doctor' });
            }
            const docCheck = await db.select({ id: users.id }).from(users).where(and(eq(users.id, doctor_id), eq(users.role, 'doctor')));
            if (docCheck.length === 0) {
                return res.status(404).json({ message: 'Selected doctor not found' });
            }
            hostId = doctor_id;
        }

        let finalPatientId = patient_id;

        if (req.user.role === 'patient') {
            const p = await db.select({ id: patients.id }).from(patients).where(eq(patients.userId, userId));
            if (p.length === 0) {
                return res.status(404).json({ message: 'Patient profile not found. Please create one first.' });
            }
            finalPatientId = p[0].id;
        }

        if (!finalPatientId || !start_time || !end_time || !title) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check for conflicts
        const conflictResult = await db.select().from(appointments).where(
            and(
                eq(appointments.userId, hostId),
                lte(appointments.startTime, new Date(end_time)),
                gte(appointments.endTime, new Date(start_time))
            )
        );

        if (conflictResult.length > 0) {
            return res.status(409).json({ message: 'This slot is not available' });
        }

        const result = await db.insert(appointments).values({
            userId: hostId,
            patientId: finalPatientId,
            title,
            startTime: new Date(start_time),
            endTime: new Date(end_time),
            type: type || 'checkup',
            notes
        }).returning();

        res.status(201).json(result[0]);
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { title, start_time, end_time, status, type, notes } = req.body;

        const check = await db.select().from(appointments).where(and(eq(appointments.id, id), eq(appointments.userId, userId)));
        if (check.length === 0) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (start_time && end_time) {
            const conflictResult = await db.select().from(appointments).where(
                and(
                    eq(appointments.userId, userId),
                    drizzleSql`${appointments.id} != ${id}`,
                    lte(appointments.startTime, new Date(end_time)),
                    gte(appointments.endTime, new Date(start_time))
                )
            );

            if (conflictResult.length > 0) {
                return res.status(409).json({ message: 'Appointment slot conflicts with an existing appointment' });
            }
        }

        const result = await db.update(appointments).set({
            title,
            startTime: start_time ? new Date(start_time) : undefined,
            endTime: end_time ? new Date(end_time) : undefined,
            status,
            type,
            notes,
            updatedAt: new Date()
        }).where(and(eq(appointments.id, id), eq(appointments.userId, userId))).returning();

        res.json(result[0]);
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
const deleteAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await db.delete(appointments).where(and(eq(appointments.id, id), eq(appointments.userId, userId))).returning({ id: appointments.id });

        if (result.length === 0) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        res.json({ message: 'Appointment removed' });
    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment
};
