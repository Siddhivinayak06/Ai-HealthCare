const db = require('../config/db');

// Create a new prescription
exports.createPrescription = async (req, res) => {
    try {
        const { patientId, medicationName, dosage, frequency, duration, notes } = req.body;
        const doctorId = req.user.id; // From auth middleware

        if (!patientId || !medicationName || !dosage || !frequency || !duration) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const query = `
            INSERT INTO prescriptions 
            (patient_id, doctor_id, medication_name, dosage, frequency, duration, notes) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `;

        const { rows } = await db.query(query, [
            patientId, doctorId, medicationName, dosage, frequency, duration, notes || null
        ]);

        res.status(201).json({
            message: 'Prescription created successfully',
            prescriptionId: rows[0].id
        });
    } catch (error) {
        console.error('Error creating prescription:', error);
        res.status(500).json({ error: 'Failed to create prescription' });
    }
};

// Get prescriptions for a specific patient
exports.getPatientPrescriptions = async (req, res) => {
    try {
        const { patientId } = req.params;

        const query = `
            SELECT p.*, u.name as doctor_name 
            FROM prescriptions p
            JOIN users u ON p.doctor_id = u.id
            WHERE p.patient_id = $1
            ORDER BY p.created_at DESC
        `;

        const { rows } = await db.query(query, [patientId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching patient prescriptions:', error);
        res.status(500).json({ error: 'Failed to fetch prescriptions' });
    }
};

// Get prescriptions created by the logged-in doctor
exports.getDoctorPrescriptions = async (req, res) => {
    try {
        const doctorId = req.user.id;

        const query = `
            SELECT p.*, pat.name as patient_name 
            FROM prescriptions p
            JOIN patients pat ON p.patient_id = pat.id
            WHERE p.doctor_id = $1
            ORDER BY p.created_at DESC
        `;

        const { rows } = await db.query(query, [doctorId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching doctor prescriptions:', error);
        res.status(500).json({ error: 'Failed to fetch prescriptions' });
    }
};
