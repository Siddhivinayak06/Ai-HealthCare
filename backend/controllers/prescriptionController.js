const { db } = require('../db');
const { prescriptions, users, patients } = require('../db/schema');
const { eq, desc } = require('drizzle-orm');

// Create a new prescription
exports.createPrescription = async (req, res) => {
    try {
        const { patientId, medicationName, dosage, frequency, duration, notes } = req.body;
        const doctorId = req.user.id; // From auth middleware

        if (!patientId || !medicationName || !dosage || !frequency || !duration) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await db.insert(prescriptions).values({
            patientId,
            doctorId,
            medicationName,
            dosage,
            frequency,
            duration,
            notes: notes || null
        }).returning({ id: prescriptions.id });

        res.status(201).json({
            message: 'Prescription created successfully',
            prescriptionId: result[0].id
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

        const result = await db.select({
            id: prescriptions.id,
            patientId: prescriptions.patientId,
            doctorId: prescriptions.doctorId,
            medicationName: prescriptions.medicationName,
            dosage: prescriptions.dosage,
            frequency: prescriptions.frequency,
            duration: prescriptions.duration,
            notes: prescriptions.notes,
            createdAt: prescriptions.createdAt,
            doctor_name: users.name
        })
            .from(prescriptions)
            .join(users, eq(prescriptions.doctorId, users.id))
            .where(eq(prescriptions.patientId, patientId))
            .orderBy(desc(prescriptions.createdAt));

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching patient prescriptions:', error);
        res.status(500).json({ error: 'Failed to fetch prescriptions' });
    }
};

// Get prescriptions created by the logged-in doctor
exports.getDoctorPrescriptions = async (req, res) => {
    try {
        const doctorId = req.user.id;

        const result = await db.select({
            id: prescriptions.id,
            patientId: prescriptions.patientId,
            doctorId: prescriptions.doctorId,
            medicationName: prescriptions.medicationName,
            dosage: prescriptions.dosage,
            frequency: prescriptions.frequency,
            duration: prescriptions.duration,
            notes: prescriptions.notes,
            createdAt: prescriptions.createdAt,
            patient_name: patients.firstName // Using firstName as a fallback for name
        })
            .from(prescriptions)
            .join(patients, eq(prescriptions.patientId, patients.id))
            .where(eq(prescriptions.doctorId, doctorId))
            .orderBy(desc(prescriptions.createdAt));

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching doctor prescriptions:', error);
        res.status(500).json({ error: 'Failed to fetch prescriptions' });
    }
};
