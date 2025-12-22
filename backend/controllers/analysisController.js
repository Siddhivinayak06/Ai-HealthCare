const { db } = require('../db');
const { imageAnalyses, riskPredictions, patients } = require('../db/schema');
const { eq, and, desc } = require('drizzle-orm');
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

        const result = await db.insert(imageAnalyses).values({
            userId: req.user.id,
            patientId: patientId || null,
            scanType,
            imageUrl: imageUrl || null,
            diagnosis,
            confidence: confidence ? confidence.toString() : null,
            severity,
            findings,
            recommendations,
            processingTime: processingTime ? processingTime.toString() : null,
            modelVersion
        }).returning();

        const newAnalysis = result[0];

        await logActivityInternal(req.user.id, "Image analysis completed", "analysis", {
            scanType,
            severity,
            analysisId: newAnalysis.id
        });

        res.status(201).json(newAnalysis);
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
        const limit = parseInt(req.query.limit) || 10;
        const result = await db.select({
            id: imageAnalyses.id,
            userId: imageAnalyses.userId,
            patientId: imageAnalyses.patientId,
            scanType: imageAnalyses.scanType,
            imageUrl: imageAnalyses.imageUrl,
            diagnosis: imageAnalyses.diagnosis,
            confidence: imageAnalyses.confidence,
            severity: imageAnalyses.severity,
            findings: imageAnalyses.findings,
            recommendations: imageAnalyses.recommendations,
            processingTime: imageAnalyses.processingTime,
            modelVersion: imageAnalyses.modelVersion,
            createdAt: imageAnalyses.createdAt,
            firstName: patients.firstName,
            lastName: patients.lastName
        })
            .from(imageAnalyses)
            .leftJoin(patients, eq(imageAnalyses.patientId, patients.id))
            .where(eq(imageAnalyses.userId, req.user.id))
            .orderBy(desc(imageAnalyses.createdAt))
            .limit(limit);

        res.json(result);
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

        await db.insert(riskPredictions).values({
            userId: req.user.id,
            patientId,
            healthRecordId: healthRecordId || null,
            condition,
            riskScore: riskScore ? riskScore.toString() : null,
            severity,
            contributingFactors,
            recommendations,
            modelVersion: 'HealthPredict v2.1'
        });

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
        const result = await db.select().from(riskPredictions).where(
            and(
                eq(riskPredictions.patientId, req.params.patientId),
                eq(riskPredictions.userId, req.user.id)
            )
        ).orderBy(desc(riskPredictions.createdAt));

        res.json(result);
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
