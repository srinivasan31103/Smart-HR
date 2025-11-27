const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { validate, punchInSchema, manualAttendanceSchema, mongoIdSchema } = require('../middlewares/validationMiddleware');
const { apiLimiter } = require('../middlewares/rateLimitMiddleware');
const Joi = require('joi');

/**
 * Attendance Routes
 * Base path: /api/v1/attendance
 */

/**
 * @route   POST /api/v1/attendance/punch-in
 * @desc    Punch in with face recognition
 * @access  Private
 */
router.post(
  '/punch-in',
  authenticate,
  apiLimiter,
  validate(punchInSchema),
  attendanceController.punchIn
);

/**
 * @route   POST /api/v1/attendance/punch-out
 * @desc    Punch out with face recognition
 * @access  Private
 */
router.post(
  '/punch-out',
  authenticate,
  apiLimiter,
  validate(punchInSchema),
  attendanceController.punchOut
);

/**
 * @route   GET /api/v1/attendance/today
 * @desc    Get today's attendance status
 * @access  Private
 */
router.get('/today', authenticate, attendanceController.getTodayAttendance);

/**
 * @route   GET /api/v1/attendance/my-attendance
 * @desc    Get my attendance records
 * @access  Private
 */
router.get(
  '/my-attendance',
  authenticate,
  validate({
    query: Joi.object({
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().optional(),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(31),
    }),
  }),
  attendanceController.getMyAttendance
);

/**
 * @route   GET /api/v1/attendance/summary
 * @desc    Get attendance summary for date range
 * @access  Private
 */
router.get(
  '/summary',
  authenticate,
  validate({
    query: Joi.object({
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().optional(),
      employeeId: mongoIdSchema.optional(),
    }),
  }),
  attendanceController.getAttendanceSummary
);

/**
 * @route   GET /api/v1/attendance/team
 * @desc    Get team attendance (for managers)
 * @access  Private (Manager/Admin)
 */
router.get(
  '/team',
  authenticate,
  requireRole(['MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
  validate({
    query: Joi.object({
      date: Joi.date().iso().optional(),
      departmentId: mongoIdSchema.optional(),
      status: Joi.string()
        .valid('PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'WFH', 'HOLIDAY', 'WEEKEND')
        .optional(),
    }),
  }),
  attendanceController.getTeamAttendance
);

/**
 * @route   POST /api/v1/attendance/manual
 * @desc    Create manual attendance entry
 * @access  Private (HR/Admin)
 */
router.post(
  '/manual',
  authenticate,
  requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN']),
  validate(manualAttendanceSchema),
  attendanceController.createManualAttendance
);

/**
 * @route   PUT /api/v1/attendance/:id
 * @desc    Update attendance record
 * @access  Private (HR/Admin)
 */
router.put(
  '/:id',
  authenticate,
  requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN']),
  validate({
    params: Joi.object({
      id: mongoIdSchema.required(),
    }),
    body: Joi.object({
      status: Joi.string()
        .valid('PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'WFH', 'HOLIDAY', 'WEEKEND')
        .optional(),
      remarks: Joi.string().trim().max(500).optional(),
      punchInTime: Joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .optional(),
      punchOutTime: Joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .optional(),
    }),
  }),
  attendanceController.updateAttendance
);

/**
 * @route   DELETE /api/v1/attendance/:id
 * @desc    Delete attendance record
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  validate({
    params: Joi.object({
      id: mongoIdSchema.required(),
    }),
  }),
  attendanceController.deleteAttendance
);

module.exports = router;
