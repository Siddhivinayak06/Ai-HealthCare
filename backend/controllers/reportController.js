const db = require('../config/db');
const { logActivityInternal } = require('./activityController');

// @desc    Get all reports
// @route   GET /api/reports
// @access  Private
// @desc    Get all reports
// @route   GET /api/reports
// @access  Private
const getReports = async (req, res) => {
    try {
        let result;

        if (req.user.role === 'patient') {
            // Find patient record first
            const patientCheck = await db.query('SELECT id FROM patients WHERE user_id = $1', [req.user.id]);
            if (patientCheck.rows.length === 0) {
                return res.json([]); // No patient profile, no reports
            }
            const patientId = patientCheck.rows[0].id;

            // Get reports assigned to this patient
            result = await db.query(`
                SELECT r.*, p.first_name, p.last_name, u.name as doctor_name
                FROM reports r
                LEFT JOIN patients p ON r.patient_id = p.id
                LEFT JOIN users u ON r.user_id = u.id
                WHERE r.patient_id = $1
                ORDER BY r.created_at DESC
            `, [patientId]);
        } else {
            // Doctors see reports they created
            result = await db.query(`
                SELECT r.*, p.first_name, p.last_name
                FROM reports r
                LEFT JOIN patients p ON r.patient_id = p.id
                WHERE r.user_id = $1
                ORDER BY r.created_at DESC
            `, [req.user.id]);
        }

        res.json(result.rows);
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

        const result = await db.query(
            `INSERT INTO reports (user_id, patient_id, title, report_type, content, file_size, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'ready') RETURNING *`,
            [req.user.id, patientId || null, title, reportType, JSON.stringify(content), fileSize]
        );

        await logActivityInternal(req.user.id, "Report generated", "report", {
            reportId: result.rows[0].id,
            reportType,
            title
        });

        res.status(201).json(result.rows[0]);
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
        const result = await db.query('DELETE FROM reports WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);

        if (result.rows.length === 0) {
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
