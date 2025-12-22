const { db } = require('../db');
const { activityLog } = require('../db/schema');
const { eq, desc } = require('drizzle-orm');

// Internal helper for logging from other controllers
const logActivityInternal = async (userId, action, actionType, details = {}) => {
    try {
        await db.insert(activityLog).values({
            userId,
            action,
            actionType,
            details
        });
    } catch (error) {
        console.error("Internal Activity Log Error:", error);
    }
}

// @desc    Log activity (External API)
// @route   POST /api/activity
// @access  Private
const logActivity = async (req, res) => {
    const { action, actionType, details } = req.body;
    try {
        await logActivityInternal(req.user.id, action, actionType, details);
        res.status(201).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get recent activity
// @route   GET /api/activity
// @access  Private
const getActivity = async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    try {
        const result = await db.select().from(activityLog).where(eq(activityLog.userId, req.user.id)).orderBy(desc(activityLog.createdAt)).limit(limit);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    logActivity,
    getActivity,
    logActivityInternal
};
