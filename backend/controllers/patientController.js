const db = require('../config/db');

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private
const getPatients = async (req, res) => {
    try {
        const { query } = req.query;
        let sql;
        const params = [req.user.id];

        if (req.user.role === 'patient') {
            // Patients only see themselves
            sql = 'SELECT * FROM patients WHERE user_id = $1';
            // Logic: Check if patient record exists for this user, if not, maybe return empty or auto-create?
            // For now, simple query.
        } else {
            // Doctors see all patients they created
            sql = 'SELECT * FROM patients WHERE user_id = $1';
        }

        if (query) {
            sql += ` AND (first_name ILIKE $2 OR last_name ILIKE $2 OR email ILIKE $2)`;
            params.push(`%${query}%`);
        }

        sql += ' ORDER BY created_at DESC';
        if (query) sql += ' LIMIT 20';

        const result = await db.query(sql, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single patient
// @route   GET /api/patients/:id
// @access  Private
const getPatient = async (req, res) => {
    try {
        let sql = 'SELECT * FROM patients WHERE id = $1';
        const params = [req.params.id];

        if (req.user.role === 'patient') {
            // Patient can only access their own patient record. 
            // BUT WAIT: The p.user_id = req.user.id for a 'patient' role means they are the "owner" of their record.
            // So the check `AND user_id = $2` is actually correct for both Doctor and Patient roles
            // IF the patient record for the 'patient' user was created with their user_id.

            // However, we want to ensure they can't access other arbitrary IDs even if they guessed them (which the user_id check prevents).
            sql += ' AND user_id = $2';
            params.push(req.user.id);
        } else {
            // Doctors can only access patients they created
            sql += ' AND user_id = $2';
            params.push(req.user.id);
        }

        const result = await db.query(sql, params);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create patient
// @route   POST /api/patients
// @access  Private
const createPatient = async (req, res) => {
    try {
        console.log("createPatient Body:", req.body);
        const {
            firstName, lastName, dateOfBirth, gender, email, phone,
            address, emergencyContactName, emergencyContactPhone,
            bloodType, allergies, medicalConditions, userId // Added userId to destructuring
        } = req.body;

        // Check if user is a patient (or 'user' role)
        if (req.user.role === 'patient' || req.user.role === 'user') {
            // Patients can only create one profile for themselves
            const existingPatient = await db.query('SELECT id FROM patients WHERE user_id = $1', [req.user.id]);
            if (existingPatient.rows.length > 0) {
                return res.status(400).json({ message: 'Patient profile already exists' });
            }
            // Ensure the patient is creating it for themselves
            if (userId && userId !== req.user.id) { // If userId is passed in body
                return res.status(403).json({ message: 'Patients can only create their own profile' });
            }
        }
        // Check if patient already has a record
        const existing = await db.query('SELECT * FROM patients WHERE user_id = $1', [req.user.id]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'You already have a patient profile.' });
        }


        const result = await db.query(
            `INSERT INTO patients (
                user_id, first_name, last_name, date_of_birth, gender, 
                email, phone, address, emergency_contact_name, emergency_contact_phone,
                blood_type, allergies, medical_conditions
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
            [
                req.user.id, firstName, lastName, dateOfBirth, gender,
                email, phone, address, emergencyContactName, emergencyContactPhone,
                bloodType, allergies, medicalConditions
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private
const updatePatient = async (req, res) => {
    try {
        const {
            firstName, lastName, dateOfBirth, gender, email, phone,
            address, emergencyContactName, emergencyContactPhone,
            bloodType, allergies, medicalConditions
        } = req.body;

        const result = await db.query(
            `UPDATE patients SET
                first_name = COALESCE($1, first_name),
                last_name = COALESCE($2, last_name),
                date_of_birth = COALESCE($3, date_of_birth),
                gender = COALESCE($4, gender),
                email = COALESCE($5, email),
                phone = COALESCE($6, phone),
                address = COALESCE($7, address),
                emergency_contact_name = COALESCE($8, emergency_contact_name),
                emergency_contact_phone = COALESCE($9, emergency_contact_phone),
                blood_type = COALESCE($10, blood_type),
                allergies = COALESCE($11, allergies),
                medical_conditions = COALESCE($12, medical_conditions),
                updated_at = NOW()
            WHERE id = $13 AND user_id = $14 RETURNING *`,
            [
                firstName, lastName, dateOfBirth, gender, email, phone,
                address, emergencyContactName, emergencyContactPhone,
                bloodType, allergies, medicalConditions,
                req.params.id, req.user.id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private
const deletePatient = async (req, res) => {
    try {
        const result = await db.query('DELETE FROM patients WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        res.json({ message: 'Patient removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add health record
// @route   POST /api/patients/:id/records
// @access  Private
const addHealthRecord = async (req, res) => {
    try {
        const patientId = req.params.id;
        const {
            weightKg, heightCm, bloodPressureSystolic, bloodPressureDiastolic,
            heartRate, temperatureCelsius, oxygenSaturation, bloodSugar,
            cholesterolTotal, cholesterolHdl, cholesterolLdl,
            smokingStatus, alcoholConsumption, exerciseFrequency, notes
        } = req.body;

        // Verify patient ownership
        const patientCheck = await db.query('SELECT id FROM patients WHERE id = $1 AND user_id = $2', [patientId, req.user.id]);
        if (patientCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const result = await db.query(
            `INSERT INTO health_records (
                patient_id, recorded_by, weight_kg, height_cm,
                blood_pressure_systolic, blood_pressure_diastolic, heart_rate,
                temperature_celsius, oxygen_saturation, blood_sugar,
                cholesterol_total, cholesterol_hdl, cholesterol_ldl,
                smoking_status, alcohol_consumption, exercise_frequency, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
            [
                patientId, req.user.id, weightKg, heightCm,
                bloodPressureSystolic, bloodPressureDiastolic, heartRate,
                temperatureCelsius, oxygenSaturation, bloodSugar,
                cholesterolTotal, cholesterolHdl, cholesterolLdl,
                smokingStatus, alcoholConsumption, exerciseFrequency, notes
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get health records
// @route   GET /api/patients/:id/records
// @access  Private
const getHealthRecords = async (req, res) => {
    try {
        const patientId = req.params.id;

        // Verify patient ownership
        const patientCheck = await db.query('SELECT id FROM patients WHERE id = $1 AND user_id = $2', [patientId, req.user.id]);
        if (patientCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const result = await db.query('SELECT * FROM health_records WHERE patient_id = $1 ORDER BY record_date DESC', [patientId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getPatients,
    getPatient,
    createPatient,
    updatePatient,
    deletePatient,
    addHealthRecord,
    getHealthRecords
};
