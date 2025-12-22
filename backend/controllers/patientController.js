const { db } = require('../db');
const { patients, healthRecords } = require('../db/schema');
const { eq, or, ilike, and, desc } = require('drizzle-orm');

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private
const getPatients = async (req, res) => {
    try {
        const { query } = req.query;
        let whereClause;

        if (req.user.role === 'patient') {
            whereClause = eq(patients.userId, req.user.id);
        } else {
            whereClause = eq(patients.userId, req.user.id);
        }

        if (query) {
            whereClause = and(
                whereClause,
                or(
                    ilike(patients.firstName, `%${query}%`),
                    ilike(patients.lastName, `%${query}%`),
                    ilike(patients.email, `%${query}%`)
                )
            );
        }

        let selectQuery = db.select().from(patients).where(whereClause).orderBy(desc(patients.createdAt));

        if (query) {
            selectQuery = selectQuery.limit(20);
        }

        const result = await selectQuery;
        res.json(result);
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
        const result = await db.select().from(patients).where(
            and(
                eq(patients.id, req.params.id),
                eq(patients.userId, req.user.id)
            )
        );

        if (result.length === 0) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        res.json(result[0]);
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
        const {
            firstName, lastName, dateOfBirth, gender, email, phone,
            address, emergencyContactName, emergencyContactPhone,
            bloodType, allergies, medicalConditions, userId
        } = req.body;

        if (req.user.role === 'patient') {
            const existingPatient = await db.select().from(patients).where(eq(patients.userId, req.user.id));
            if (existingPatient.length > 0) {
                return res.status(400).json({ message: 'Patient profile already exists' });
            }
            if (userId && userId !== req.user.id) {
                return res.status(403).json({ message: 'Patients can only create their own profile' });
            }
        }

        const existing = await db.select().from(patients).where(eq(patients.userId, req.user.id));
        if (existing.length > 0) {
            return res.status(400).json({ message: 'You already have a patient profile.' });
        }

        const result = await db.insert(patients).values({
            userId: req.user.id,
            firstName,
            lastName,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            gender,
            email,
            phone,
            address,
            emergencyContactName,
            emergencyContactPhone,
            bloodType,
            allergies,
            medicalConditions
        }).returning();

        res.status(201).json(result[0]);
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

        const result = await db.update(patients).set({
            firstName,
            lastName,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            gender,
            email,
            phone,
            address,
            emergencyContactName,
            emergencyContactPhone,
            bloodType,
            allergies,
            medicalConditions,
            updatedAt: new Date()
        }).where(
            and(
                eq(patients.id, req.params.id),
                eq(patients.userId, req.user.id)
            )
        ).returning();

        if (result.length === 0) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        res.json(result[0]);
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
        const result = await db.delete(patients).where(
            and(
                eq(patients.id, req.params.id),
                eq(patients.userId, req.user.id)
            )
        ).returning({ id: patients.id });

        if (result.length === 0) {
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

        const patientCheck = await db.select().from(patients).where(
            and(
                eq(patients.id, patientId),
                eq(patients.userId, req.user.id)
            )
        );
        if (patientCheck.length === 0) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const result = await db.insert(healthRecords).values({
            patientId,
            recordedBy: req.user.id,
            weightKg,
            heightCm,
            bloodPressureSystolic,
            bloodPressureDiastolic,
            heartRate,
            temperatureCelsius,
            oxygenSaturation,
            bloodSugar,
            cholesterolTotal,
            cholesterolHdl,
            cholesterolLdl,
            smokingStatus,
            alcoholConsumption,
            exerciseFrequency,
            notes
        }).returning();

        res.status(201).json(result[0]);
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

        const patientCheck = await db.select().from(patients).where(
            and(
                eq(patients.id, patientId),
                eq(patients.userId, req.user.id)
            )
        );
        if (patientCheck.length === 0) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const result = await db.select().from(healthRecords).where(eq(healthRecords.patientId, patientId)).orderBy(desc(healthRecords.recordDate));
        res.json(result);
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
