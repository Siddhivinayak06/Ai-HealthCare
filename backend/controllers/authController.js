const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

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
        const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const result = await db.query(
            'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
            [email.toLowerCase(), hashedPassword, name, role || 'patient']
        );

        const user = result.rows[0];

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
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Check password
        if (user && (await bcrypt.compare(password, user.password_hash))) {
            res.json({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                token: generateToken(user.id),
            });
        } else {
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
        const result = await db.query('SELECT id, email, name, role, created_at FROM users WHERE id = $1', [req.user.id]);
        res.status(200).json(result.rows[0]);
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
        const user = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);

        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if email is being updated and if it's already taken
        if (email && email !== user.rows[0].email) {
            const emailCheck = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        const updatedUser = await db.query(
            'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), updated_at = NOW() WHERE id = $3 RETURNING id, email, name, role',
            [name, email ? email.toLowerCase() : null, req.user.id]
        );

        res.json(updatedUser.rows[0]);
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
        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
        const user = userResult.rows[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, req.user.id]);

        res.json({ message: 'Password updated successfully' });
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
};
