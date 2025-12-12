const db = require('../config/db');

// Internal helper for logging from other controllers
const logActivityInternal = async (userId, action, actionType, details = {}) => {
    try {
        await db.query(
            'INSERT INTO activity_log (user_id, action, action_type, details) VALUES ($1, $2, $3, $4)',
            [userId, action, actionType, JSON.stringify(details)]
        );
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
    const limit = req.query.limit || 20;
    try {
        const result = await db.query(
            'SELECT * FROM activity_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
            [req.user.id, limit]
        );
        res.json(result.rows);
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
