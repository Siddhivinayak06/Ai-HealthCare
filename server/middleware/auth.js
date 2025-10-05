const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to authenticate token
 */
exports.authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      console.log('Authentication failed: No authorization header');
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No authorization header.',
      });
    }
    
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format

    if (!token) {
      console.log('Authentication failed: Token not provided in correct format');
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided or incorrect format.',
      });
    }

    console.log('Verifying token...');
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified for user ID:', decoded.id);

    // Check if user exists with that id
    console.log('Finding user with ID:', decoded.id);
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log('Authentication failed: User not found with ID:', decoded.id);
      return res.status(401).json({
        status: 'error',
        message: 'User no longer exists.',
      });
    }

    // Check if user is active
    if (!user.active) {
      console.log('Authentication failed: User account is inactive:', decoded.id);
      return res.status(401).json({
        status: 'error',
        message: 'User account is inactive. Please contact support.',
      });
    }

    console.log('Authentication successful for user:', user.email);
    
    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.name, error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. Please log in again.',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Your session has expired. Please log in again.',
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred authenticating your request.',
    });
  }
};

/**
 * Middleware to restrict access to admin only
 */
exports.restrictToAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'You do not have permission to perform this action.',
    });
  }
  next();
};

/**
 * Middleware to check if user can access a resource
 * Admins can access all resources, users can only access their own
 */
exports.checkResourceAccess = (req, res, next) => {
  const resourceId = req.params.id || req.params.userId || req.body.userId;
  
  // If no resource ID, just continue (likely admin-only route)
  if (!resourceId) {
    return next();
  }

  // Allow admin to access all resources
  if (req.user.role === 'admin') {
    return next();
  }

  // Allow users to access only their own resources
  if (req.user.id === resourceId) {
    return next();
  }

  return res.status(403).json({
    status: 'error',
    message: 'You do not have permission to access this resource.',
  });
}; 