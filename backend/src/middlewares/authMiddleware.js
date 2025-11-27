const jwt = require('jsonwebtoken');
const { Employee } = require('../models');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Authentication Middleware
 *
 * Verifies JWT token and attaches user to request
 * Supports both HTTP-only cookies and Authorization header
 */

const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check for token in cookies (preferred for security)
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    // Fallback to Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await Employee.findById(decoded.id)
      .select('+passwordChangedAt')
      .populate('company', 'name code')
      .populate('department', 'name code')
      .populate('designation', 'title code');

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User not found. Token may be invalid.',
      });
    }

    // Check if user is active
    if (!user.isActive || user.status !== 'ACTIVE') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User account is inactive.',
      });
    }

    // Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Password recently changed. Please log in again.',
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    req.companyId = user.company._id;
    req.userRole = user.role;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid token.',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Token expired. Please log in again.',
      });
    }

    console.error('Authentication error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is present but doesn't fail if not
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await Employee.findById(decoded.id);

      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
        req.companyId = user.company;
        req.userRole = user.role;
      }
    }

    next();
  } catch (error) {
    // Don't fail on error, just proceed without user
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth,
};
