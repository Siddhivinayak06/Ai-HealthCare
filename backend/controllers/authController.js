const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { db } = require('../db');
const { users } = require('../db/schema');
const { eq } = require('drizzle-orm');
const sendEmail = require('../utils/sendEmail');

// Helper to generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { email, password, name, role } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please add all fields' });
    }

    try {
        // Check if user exists
        const userCheck = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
        if (userCheck.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const result = await db.insert(users).values({
            email: email.toLowerCase(),
            passwordHash: hashedPassword,
            name,
            role: role || 'patient'
        }).returning({
            id: users.id,
            email: users.email,
            name: users.name,
            role: users.role
        });

        const user = result[0];

        res.status(201).json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            token: generateToken(user.id),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await db.select().from(users).where(eq(users.email, email.toLowerCase()));

        if (result.length === 0) {
            console.log(`Login failed: User not found for email ${email}`);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = result[0];

        // Check password
        if (user && (await bcrypt.compare(password, user.passwordHash))) {
            res.json({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                token: generateToken(user.id),
            });
        } else {
            console.log(`Login failed: Password mismatch for ${email}`);
            res.status(400).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        // req.user is set by auth middleware
        const result = await db.select({
            id: users.id,
            email: users.email,
            name: users.name,
            role: users.role,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt
        }).from(users).where(eq(users.id, req.user.id));

        res.status(200).json(result[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    const { name, email } = req.body;

    try {
        const userResult = await db.select().from(users).where(eq(users.id, req.user.id));

        if (userResult.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userResult[0];

        // Check if email is being updated and if it's already taken
        if (email && email !== user.email) {
            const emailCheck = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
            if (emailCheck.length > 0) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        const updatedUser = await db.update(users).set({
            name: name || user.name,
            email: email ? email.toLowerCase() : user.email,
            updatedAt: new Date()
        }).where(eq(users.id, req.user.id)).returning({
            id: users.id,
            email: users.email,
            name: users.name,
            role: users.role
        });

        res.json(updatedUser[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Change user password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const userResult = await db.select().from(users).where(eq(users.id, req.user.id));
        const user = userResult[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.update(users).set({
            passwordHash: hashedPassword,
            updatedAt: new Date()
        }).where(eq(users.id, req.user.id));

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const userResult = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
        const user = userResult[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get Reset Token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash token and set to reset_password_token field
        const resetPasswordTokenToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Set expire (10 minutes)
        const resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await db.update(users).set({
            resetPasswordToken: resetPasswordTokenToken,
            resetPasswordExpires: resetPasswordExpire
        }).where(eq(users.id, user.id));

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. \n\n Please click on the following link to reset your password: \n\n ${resetUrl}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Token',
                message,
                html: `<p>You requested a password reset</p><p>Click this link to reset your password:</p><a href="${resetUrl}">${resetUrl}</a>`
            });

            res.status(200).json({ success: true, data: 'Email sent' });
        } catch (err) {
            console.error(err);
            // Clear fields if email fails
            await db.update(users).set({
                resetPasswordToken: null,
                resetPasswordExpires: null
            }).where(eq(users.id, user.id));
            return res.status(500).json({ message: 'Email could not be sent' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Reset Password
// @route   PUT /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ message: 'Invalid request' });
    }

    // Get hashed token
    const resetPasswordTokenToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    try {
        const userResult = await db.select().from(users).where(eq(users.resetPasswordToken, resetPasswordTokenToken));

        const user = userResult[0];

        if (!user || user.resetPasswordExpires < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Set new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await db.update(users).set({
            passwordHash: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null,
            updatedAt: new Date()
        }).where(eq(users.id, user.id));

        res.status(200).json({ success: true, data: 'Password updated' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all doctors
// @route   GET /api/auth/doctors
// @access  Private
const getDoctors = async (req, res) => {
    try {
        const result = await db.select({
            id: users.id,
            name: users.name,
            email: users.email
        }).from(users).where(eq(users.role, 'doctor'));

        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    getDoctors,
};
