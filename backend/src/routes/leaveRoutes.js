const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { validate, applyLeaveSchema, approveRejectLeaveSchema, mongoIdSchema } = require('../middlewares/validationMiddleware');
const { apiLimiter } = require('../middlewares/rateLimitMiddleware');
const Joi = require('joi');

/**
 * Leave Routes
 * Base path: /api/v1/leaves
 */

/**
 * @route   GET /api/v1/leaves/types
 * @desc    Get available leave types
 * @access  Private
 */
router.get('/types', authenticate, leaveController.getLeaveTypes);

/**
 * @route   GET /api/v1/leaves/balance
 * @desc    Get leave balance
 * @access  Private
 */
router.get(
  '/balance',
  authenticate,
  validate({
    query: Joi.object({
      employeeId: mongoIdSchema.optional(),
    }),
  }),
  leaveController.getLeaveBalance
);

/**
 * @route   POST /api/v1/leaves/apply
 * @desc    Apply for leave
 * @access  Private
 */
router.post('/apply', authenticate, apiLimiter, validate(applyLeaveSchema), leaveController.applyLeave);

/**
 * @route   GET /api/v1/leaves/my-leaves
 * @desc    Get my leave requests
 * @access  Private
 */
router.get(
  '/my-leaves',
  authenticate,
  validate({
    query: Joi.object({
      status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED').optional(),
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().optional(),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
    }),
  }),
  leaveController.getMyLeaves
);

/**
 * @route   GET /api/v1/leaves/pending-approvals
 * @desc    Get leaves pending my approval
 * @access  Private (Manager/HR/Admin)
 */
router.get(
  '/pending-approvals',
  authenticate,
  requireRole(['MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
  validate({
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
    }),
  }),
  leaveController.getPendingApprovals
);

/**
 * @route   GET /api/v1/leaves/team-calendar
 * @desc    Get team leave calendar
 * @access  Private (Manager/Admin)
 */
router.get(
  '/team-calendar',
  authenticate,
  requireRole(['MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
  validate({
    query: Joi.object({
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().optional(),
      departmentId: mongoIdSchema.optional(),
    }),
  }),
  leaveController.getTeamLeaveCalendar
);

/**
 * @route   GET /api/v1/leaves/:id
 * @desc    Get leave request by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  validate({
    params: Joi.object({
      id: mongoIdSchema.required(),
    }),
  }),
  leaveController.getLeaveById
);

/**
 * @route   POST /api/v1/leaves/:id/approve
 * @desc    Approve leave request
 * @access  Private (Manager/HR/Admin)
 */
router.post(
  '/:id/approve',
  authenticate,
  requireRole(['MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
  validate({
    params: Joi.object({
      id: mongoIdSchema.required(),
    }),
    body: Joi.object({
      comments: Joi.string().trim().max(500).optional(),
    }),
  }),
  leaveController.approveLeave
);

/**
 * @route   POST /api/v1/leaves/:id/reject
 * @desc    Reject leave request
 * @access  Private (Manager/HR/Admin)
 */
router.post(
  '/:id/reject',
  authenticate,
  requireRole(['MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN']),
  validate({
    params: Joi.object({
      id: mongoIdSchema.required(),
    }),
    body: Joi.object({
      comments: Joi.string().trim().max(500).required(),
    }),
  }),
  leaveController.rejectLeave
);

/**
 * @route   POST /api/v1/leaves/:id/cancel
 * @desc    Cancel leave request
 * @access  Private
 */
router.post(
  '/:id/cancel',
  authenticate,
  validate({
    params: Joi.object({
      id: mongoIdSchema.required(),
    }),
    body: Joi.object({
      reason: Joi.string().trim().max(500).optional(),
    }),
  }),
  leaveController.cancelLeave
);

module.exports = router;
