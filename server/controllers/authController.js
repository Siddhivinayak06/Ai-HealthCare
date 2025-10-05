const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate JWT token
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with that email already exists',
      });
    }

    // Only allow admin role if specified in the request and manually set by another admin
    // For initial admin setup, you would need to manually update the database
    const userRole = req.user && req.user.role === 'admin' ? role : 'user';

    // Create new user
    const newUser = await User.create({
      name,
      email,
      password,
      role: userRole,
    });

    // Remove password from response
    newUser.password = undefined;

    // Generate token
    const token = generateToken(newUser._id, newUser.role);

    res.status(201).json({
      status: 'success',
      token,
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password',
      });
    }

    // Find user by email and include the password field
    const user = await User.findOne({ email }).select('+password');

    // Check if user exists and password is correct
    if (!user || !(await user.isPasswordCorrect(password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    // Check if user is active
    if (!user.active) {
      return res.status(401).json({
        status: 'error',
        message: 'Your account is inactive. Please contact support.',
      });
    }

    // Update last login timestamp
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Remove password from response
    user.password = undefined;

    // Generate token with role
    const token = generateToken(user._id, user.role);

    // Log the user data being sent back
    console.log('Login successful - User data:', {
      id: user._id,
      email: user.email,
      role: user.role,
      roleType: typeof user.role
    });

    res.status(200).json({
      status: 'success',
      token,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Get current user profile
 * @route GET /api/auth/me
 * @access Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      status: 'success',
      user,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Update user profile
 * @route PATCH /api/auth/update-profile
 * @access Private
 */
exports.updateProfile = async (req, res) => {
  try {
    // Disallow password updates through this route
    if (req.body.password) {
      return res.status(400).json({
        status: 'error',
        message: 'This route is not for password updates. Please use /update-password.',
      });
    }

    // Disallow role updates through this route
    if (req.body.role) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot update your role.',
      });
    }

    // Fields allowed to be updated
    const filteredBody = {
      name: req.body.name,
      email: req.body.email,
      profilePicture: req.body.profilePicture,
      specialization: req.body.specialization,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      contactNumber: req.body.contactNumber,
      address: req.body.address,
    };

    // Filter out undefined values
    Object.keys(filteredBody).forEach((key) => {
      if (filteredBody[key] === undefined) {
        delete filteredBody[key];
      }
    });

    // Update user
    const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Update password
 * @route PATCH /api/auth/update-password
 * @access Private
 */
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Check if both passwords are provided
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide current password and new password',
      });
    }

    // Get user with password field
    const user = await User.findById(req.user._id).select('+password');

    // Check if current password is correct
    if (!(await user.isPasswordCorrect(currentPassword))) {
      return res.status(401).json({
        status: 'error',
        message: 'Your current password is incorrect',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate new token
    const token = generateToken(user._id, user.role);

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      status: 'success',
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Register an admin user with a special admin code
 * @route POST /api/auth/admin-register
 * @access Public (but requires admin code)
 */
exports.adminRegister = async (req, res) => {
  try {
    console.log('Admin registration attempt:', req.body);
    const { name, email, password, adminCode } = req.body;

    // Verify the admin code
    const correctAdminCode = process.env.ADMIN_REGISTRATION_CODE || 'admin-secret-code-123';
    console.log('Admin code check:', { provided: adminCode, expected: correctAdminCode });
    
    if (!adminCode || adminCode !== correctAdminCode) {
      console.log('Admin code verification failed');
      return res.status(403).json({
        status: 'error',
        message: 'Invalid admin registration code',
      });
    }

    console.log('Admin code verified successfully');

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists with email:', email);
      return res.status(400).json({
        status: 'error',
        message: 'User with that email already exists',
      });
    }

    // Create new admin user
    console.log('Creating new admin user with role: admin');
    const newUser = await User.create({
      name,
      email,
      password,
      role: 'admin', // Directly set admin role when admin code is correct
    });

    // Remove password from response
    newUser.password = undefined;
    console.log('New admin user created:', { id: newUser._id, email: newUser.email, role: newUser.role });

    // Generate token
    const token = generateToken(newUser._id, newUser.role);

    res.status(201).json({
      status: 'success',
      token,
      user: newUser,
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
}; 