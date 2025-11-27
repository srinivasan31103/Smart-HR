const jwt = require('jsonwebtoken');
const { Employee } = require('../models');
const { HTTP_STATUS, AUDIT_ACTIONS } = require('../config/constants');
const { asyncHandler, AppError } = require('../middlewares/errorMiddleware');
const auditLogService = require('../services/auditLogService');

/**
 * Generate JWT tokens
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
  });

  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  });

  return { accessToken, refreshToken };
};

/**
 * Set token cookies
 */
const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Access token cookie (short-lived)
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  // Refresh token cookie (long-lived)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user with password
  const user = await Employee.findOne({ email })
    .select('+password +loginAttempts +lockUntil')
    .populate('company', 'name code')
    .populate('department', 'name')
    .populate('designation', 'title');

  if (!user) {
    return next(new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED));
  }

  // Check if account is locked
  if (user.isLocked) {
    return next(
      new AppError(
        'Account is temporarily locked due to multiple failed login attempts. Please try again later.',
        HTTP_STATUS.UNAUTHORIZED
      )
    );
  }

  // Check if account is active
  if (!user.isActive || user.status !== 'ACTIVE') {
    return next(new AppError('Your account is inactive. Please contact HR.', HTTP_STATUS.UNAUTHORIZED));
  }

  // Verify password
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    // Increment login attempts
    await user.incLoginAttempts();

    return next(new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED));
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Update user
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Set HTTP-only cookies
  setTokenCookies(res, accessToken, refreshToken);

  // Audit log
  await auditLogService.logAuth(AUDIT_ACTIONS.LOGIN, user._id, user.company._id, {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Send response (exclude sensitive data)
  const userResponse = {
    id: user._id,
    employeeId: user.employeeId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    role: user.role,
    profilePicture: user.profilePicture,
    company: user.company,
    department: user.department,
    designation: user.designation,
  };

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Login successful',
    data: {
      user: userResponse,
      accessToken, // Also send in response body for non-cookie clients
    },
  });
});

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public (requires refresh token)
 */
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    return next(new AppError('Refresh token not provided', HTTP_STATUS.UNAUTHORIZED));
  }

  // Verify refresh token
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  // Find user
  const user = await Employee.findById(decoded.id).select('+refreshToken');

  if (!user || user.refreshToken !== refreshToken) {
    return next(new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED));
  }

  // Generate new tokens
  const tokens = generateTokens(user._id);

  // Update refresh token
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });

  // Set new cookies
  setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken: tokens.accessToken,
    },
  });
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res, next) => {
  // Clear refresh token from database
  await Employee.findByIdAndUpdate(req.userId, {
    $unset: { refreshToken: 1 },
  });

  // Clear cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  // Audit log
  await auditLogService.logAuth(AUDIT_ACTIONS.LOGOUT, req.userId, req.companyId, {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Logout successful',
  });
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await Employee.findById(req.userId)
    .populate('company', 'name code logo')
    .populate('department', 'name code')
    .populate('designation', 'title code')
    .populate('manager', 'firstName lastName email employeeId')
    .populate('shift', 'name startTime endTime');

  if (!user) {
    return next(new AppError('User not found', HTTP_STATUS.NOT_FOUND));
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { user },
  });
});

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Change password
 * @access  Private
 */
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await Employee.findById(req.userId).select('+password');

  // Verify current password
  const isPasswordCorrect = await user.comparePassword(currentPassword);

  if (!isPasswordCorrect) {
    return next(new AppError('Current password is incorrect', HTTP_STATUS.UNAUTHORIZED));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Clear all refresh tokens (force re-login)
  user.refreshToken = undefined;
  await user.save({ validateBeforeSave: false });

  // Audit log
  await auditLogService.logAuth(AUDIT_ACTIONS.UPDATE, req.userId, req.companyId, {
    ipAddress: req.ip,
    description: 'Password changed',
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Password changed successfully. Please log in again.',
  });
});

module.exports = exports;
