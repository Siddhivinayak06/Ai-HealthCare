const db = require('../config/db');

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
    try {
        const userId = req.user.id;
        const { start, end } = req.query;

        // Base query
        let query = `
            SELECT a.*, p.first_name, p.last_name 
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            WHERE 1=1
        `;
        const params = [];

        if (req.user.role === 'patient') {
            // Patients see appointments linked to their patient profile
            query += ` AND a.patient_id = (SELECT id FROM patients WHERE user_id = $${params.length + 1})`;
            params.push(userId);
        } else {
            // Doctors see appointments they created
            query += ` AND a.user_id = $${params.length + 1}`;
            params.push(userId);
        }

        // Filter by date range if provided
        if (start && end) {
            query += ` AND a.start_time >= $2 AND a.end_time <= $3`;
            params.push(start, end);
        }

        query += ` ORDER BY a.start_time ASC`;

        console.log('Get Appointments Query:', query);
        console.log('Get Appointments Params:', params);

        const result = await db.query(query, params);
        console.log('Get Appointments Result Count:', result.rows.length);

        res.json(result.rows);
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

        let hostId = userId; // The user hosting/owning the appointment (Doctor)

        // If patient is booking, the host is the selected doctor
        if (req.user.role === 'patient') {
            if (!doctor_id) {
                return res.status(400).json({ message: 'Please select a doctor' });
            }
            // Verify doctor exists
            const docCheck = await db.query('SELECT id FROM users WHERE id = $1 AND role = $2', [doctor_id, 'doctor']);
            if (docCheck.rows.length === 0) {
                return res.status(404).json({ message: 'Selected doctor not found' });
            }
            hostId = doctor_id;
        }

        let finalPatientId = patient_id;

        if (req.user.role === 'patient') {
            const p = await db.query('SELECT id FROM patients WHERE user_id = $1', [userId]);
            if (p.rows.length === 0) {
                return res.status(404).json({ message: 'Patient profile not found. Please create one first.' });
            }
            finalPatientId = p.rows[0].id;
        }

        if (!finalPatientId || !start_time || !end_time || !title) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check for conflicts for the HOST (Doctor)
        const conflictQuery = `
            SELECT * FROM appointments 
            WHERE user_id = $1 
            AND start_time < $2 
            AND end_time > $3
        `;
        const conflictResult = await db.query(conflictQuery, [hostId, end_time, start_time]);

        if (conflictResult.rows.length > 0) {
            return res.status(409).json({ message: 'This slot is not available' });
        }

        const query = `
            INSERT INTO appointments (user_id, patient_id, title, start_time, end_time, type, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [hostId, finalPatientId, title, start_time, end_time, type || 'checkup', notes];

        const result = await db.query(query, values);
        res.status(201).json(result.rows[0]);
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

        // Check ownership
        const check = await db.query('SELECT * FROM appointments WHERE id = $1 AND user_id = $2', [id, userId]);
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Check for conflicts (excluding current appointment)
        if (start_time && end_time) {
            const conflictQuery = `
                SELECT * FROM appointments 
                WHERE user_id = $1 
                AND id != $2
                AND start_time < $3 
                AND end_time > $4
            `;
            const conflictResult = await db.query(conflictQuery, [userId, id, end_time, start_time]);

            if (conflictResult.rows.length > 0) {
                return res.status(409).json({ message: 'Appointment slot conflicts with an existing appointment' });
            }
        }

        const query = `
            UPDATE appointments 
            SET title = COALESCE($1, title),
                start_time = COALESCE($2, start_time),
                end_time = COALESCE($3, end_time),
                status = COALESCE($4, status),
                type = COALESCE($5, type),
                notes = COALESCE($6, notes),
                updated_at = NOW()
            WHERE id = $7 AND user_id = $8
            RETURNING *
        `;

        const values = [title, start_time, end_time, status, type, notes, id, userId];
        const result = await db.query(query, values);

        res.json(result.rows[0]);
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

        const result = await db.query('DELETE FROM appointments WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);

        if (result.rows.length === 0) {
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
