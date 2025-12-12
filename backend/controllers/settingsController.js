const db = require('../config/db');

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM user_settings WHERE user_id = $1', [req.user.id]);

        if (result.rows.length === 0) {
            // Create default settings if not exists
            const newSettings = await db.query(
                'INSERT INTO user_settings (user_id) VALUES ($1) RETURNING *',
                [req.user.id]
            );
            return res.json(newSettings.rows[0]);
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update user settings
// @route   PUT /api/settings
// @access  Private
const updateSettings = async (req, res) => {
    const { notificationsEnabled, emailAlerts, darkMode, language, timezone, defaultScanType } = req.body;

    try {
        const query = `
            INSERT INTO user_settings (user_id, notifications_enabled, email_alerts, dark_mode, language, timezone, default_scan_type)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (user_id) DO UPDATE SET
                notifications_enabled = COALESCE($2, user_settings.notifications_enabled),
                email_alerts = COALESCE($3, user_settings.email_alerts),
                dark_mode = COALESCE($4, user_settings.dark_mode),
                language = COALESCE($5, user_settings.language),
                timezone = COALESCE($6, user_settings.timezone),
                default_scan_type = COALESCE($7, user_settings.default_scan_type),
                updated_at = NOW()
            RETURNING *
        `;

        const values = [
            req.user.id,
            notificationsEnabled,
            emailAlerts,
            darkMode,
            language,
            timezone,
            defaultScanType
        ];

        const result = await db.query(query, values);
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getSettings,
    updateSettings
};
