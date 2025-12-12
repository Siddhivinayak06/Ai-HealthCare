const db = require('../config/db');
const { logActivityInternal } = require('./activityController');

// @desc    Save image analysis
// @route   POST /api/analyses/image
// @access  Private
const saveImageAnalysis = async (req, res) => {
    try {
        const {
            patientId, scanType, imageUrl, diagnosis, confidence,
            severity, findings, recommendations, processingTime, modelVersion
        } = req.body;

        const result = await db.query(
            `INSERT INTO image_analyses (
                user_id, patient_id, scan_type, image_url, diagnosis, confidence,
                severity, findings, recommendations, processing_time, model_version
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [
                req.user.id, patientId || null, scanType, imageUrl || null,
                diagnosis, confidence, severity, JSON.stringify(findings),
                recommendations, processingTime, modelVersion
            ]
        );

        await logActivityInternal(req.user.id, "Image analysis completed", "analysis", {
            scanType,
            severity,
            analysisId: result.rows[0].id
        });

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get recent analyses
// @route   GET /api/analyses/recent
// @access  Private
const getRecentAnalyses = async (req, res) => {
    try {
        const limit = req.query.limit || 10;
        const result = await db.query(`
            SELECT ia.*, p.first_name, p.last_name 
            FROM image_analyses ia
            LEFT JOIN patients p ON ia.patient_id = p.id
            WHERE ia.user_id = $1
            ORDER BY ia.created_at DESC
            LIMIT $2
        `, [req.user.id, limit]);

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Save risk prediction
// @route   POST /api/analyses/risk
// @access  Private
const saveRiskPrediction = async (req, res) => {
    try {
        const {
            patientId, healthRecordId, condition, riskScore,
            severity, contributingFactors, recommendations
        } = req.body;

        await db.query(
            `INSERT INTO risk_predictions (
                user_id, patient_id, health_record_id, condition, risk_score,
                severity, contributing_factors, recommendations, model_version
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'HealthPredict v2.1')`,
            [
                req.user.id, patientId, healthRecordId || null,
                condition, riskScore, severity, contributingFactors, recommendations
            ]
        );

        await logActivityInternal(req.user.id, "Risk prediction generated", "prediction", {
            patientId,
            condition,
            riskScore
        });

        res.status(201).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get patient predictions
// @route   GET /api/analyses/risk/:patientId
// @access  Private
const getPatientPredictions = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM risk_predictions WHERE patient_id = $1 AND user_id = $2 ORDER BY created_at DESC',
            [req.params.patientId, req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


module.exports = {
    saveImageAnalysis,
    getRecentAnalyses,
    saveRiskPrediction,
    getPatientPredictions
};
