const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const leaveRoutes = require('./leaveRoutes');

/**
 * API Routes Index
 *
 * Centralizes all API route registrations
 * Base path: /api/v1
 */

/**
 * Health Check Route
 * @route   GET /api/v1/health
 * @desc    API health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart HR API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * API Version Info
 * @route   GET /api/v1
 * @desc    Get API version and available endpoints
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart HR API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      attendance: '/api/v1/attendance',
      leaves: '/api/v1/leaves',
      health: '/api/v1/health',
    },
    documentation: '/api/v1/docs',
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);

// TODO: Add more routes as they are created
// router.use('/employees', employeeRoutes);
// router.use('/companies', companyRoutes);
// router.use('/departments', departmentRoutes);
// router.use('/designations', designationRoutes);
// router.use('/shifts', shiftRoutes);
// router.use('/holidays', holidayRoutes);
// router.use('/reports', reportRoutes);
// router.use('/notifications', notificationRoutes);
// router.use('/audit-logs', auditLogRoutes);

/**
 * 404 Handler for API routes
 * Must be last route
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
