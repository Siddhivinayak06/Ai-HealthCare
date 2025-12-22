const { db } = require('../db');
const { reports, patients, users } = require('../db/schema');
const { eq, and, desc } = require('drizzle-orm');
const { logActivityInternal } = require('./activityController');

// @desc    Get all reports
// @route   GET /api/reports
// @access  Private
const getReports = async (req, res) => {
    try {
        let result;

        if (req.user.role === 'patient') {
            // Find patient record first
            const patientCheck = await db.select({ id: patients.id }).from(patients).where(eq(patients.userId, req.user.id));
            if (patientCheck.length === 0) {
                return res.json([]); // No patient profile, no reports
            }
            const patientId = patientCheck[0].id;

            // Get reports assigned to this patient
            result = await db.select({
                id: reports.id,
                userId: reports.userId,
                patientId: reports.patientId,
                title: reports.title,
                reportType: reports.reportType,
                content: reports.content,
                fileSize: reports.fileSize,
                status: reports.status,
                createdAt: reports.createdAt,
                firstName: patients.firstName,
                lastName: patients.lastName,
                doctorName: users.name
            })
                .from(reports)
                .leftJoin(patients, eq(reports.patientId, patients.id))
                .leftJoin(users, eq(reports.userId, users.id))
                .where(eq(reports.patientId, patientId))
                .orderBy(desc(reports.createdAt));
        } else {
            // Doctors see reports they created
            result = await db.select({
                id: reports.id,
                userId: reports.userId,
                patientId: reports.patientId,
                title: reports.title,
                reportType: reports.reportType,
                content: reports.content,
                fileSize: reports.fileSize,
                status: reports.status,
                createdAt: reports.createdAt,
                firstName: patients.firstName,
                lastName: patients.lastName
            })
                .from(reports)
                .leftJoin(patients, eq(reports.patientId, patients.id))
                .where(eq(reports.userId, req.user.id))
                .orderBy(desc(reports.createdAt));
        }

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create report
// @route   POST /api/reports
// @access  Private (Doctors Only)
const createReport = async (req, res) => {
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only doctors can generate reports.' });
    }

    try {
        const { patientId, title, reportType, content } = req.body;

        const contentSize = JSON.stringify(content).length;
        const fileSize = contentSize > 1024 * 1024
            ? `${(contentSize / (1024 * 1024)).toFixed(1)} MB`
            : `${(contentSize / 1024).toFixed(0)} KB`;

        const result = await db.insert(reports).values({
            userId: req.user.id,
            patientId: patientId || null,
            title,
            reportType,
            content,
            fileSize,
            status: 'ready'
        }).returning();

        const newReport = result[0];

        await logActivityInternal(req.user.id, "Report generated", "report", {
            reportId: newReport.id,
            reportType,
            title
        });

        res.status(201).json(newReport);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private (Doctors Only)
const deleteReport = async (req, res) => {
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to delete reports.' });
    }

    try {
        const result = await db.delete(reports).where(
            and(
                eq(reports.id, req.params.id),
                eq(reports.userId, req.user.id)
            )
        ).returning({ id: reports.id });

        if (result.length === 0) {
            return res.status(404).json({ message: 'Report not found' });
        }

        await logActivityInternal(req.user.id, "Report deleted", "report", { reportId: req.params.id });

        res.json({ message: 'Report removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getReports,
    createReport,
    deleteReport
};
