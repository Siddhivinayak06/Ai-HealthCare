const { db } = require('../db');
const { userSettings } = require('../db/schema');
const { eq } = require('drizzle-orm');

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
    try {
        const result = await db.select().from(userSettings).where(eq(userSettings.userId, req.user.id));

        if (result.length === 0) {
            // Create default settings if not exists
            const newSettings = await db.insert(userSettings).values({
                userId: req.user.id
            }).returning();
            return res.json(newSettings[0]);
        }

        res.json(result[0]);
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
        const result = await db.insert(userSettings).values({
            userId: req.user.id,
            notificationsEnabled,
            emailAlerts,
            darkMode,
            language,
            timezone,
            defaultScanType
        }).onConflictDoUpdate({
            target: userSettings.userId,
            set: {
                notificationsEnabled: notificationsEnabled !== undefined ? notificationsEnabled : undefined,
                emailAlerts: emailAlerts !== undefined ? emailAlerts : undefined,
                darkMode: darkMode !== undefined ? darkMode : undefined,
                language: language || undefined,
                timezone: timezone || undefined,
                defaultScanType: defaultScanType || undefined,
                updatedAt: new Date()
            }
        }).returning();

        res.json(result[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getSettings,
    updateSettings
};
