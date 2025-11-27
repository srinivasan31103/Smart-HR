const Joi = require('joi');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Generic validation middleware using Joi
 * @param {Object} schema - Joi schema object with body, params, query keys
 */
const validate = (schema) => {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false, // Return all errors, not just the first
      allowUnknown: true, // Allow unknown keys that will be ignored
      stripUnknown: false, // Don't remove unknown keys
    };

    const toValidate = {};
    if (schema.body) toValidate.body = req.body;
    if (schema.params) toValidate.params = req.params;
    if (schema.query) toValidate.query = req.query;

    const schemaToValidate = Joi.object(schema);

    const { error, value } = schemaToValidate.validate(toValidate, validationOptions);

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    // Replace req with validated values
    if (value.body) req.body = value.body;
    if (value.params) req.params = value.params;
    if (value.query) req.query = value.query;

    next();
  };
};

// ==================== COMMON VALIDATION SCHEMAS ====================

const mongoIdSchema = Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid MongoDB ObjectId');

const paginationSchema = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
};

const dateRangeSchema = {
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
};

// ==================== AUTH VALIDATION SCHEMAS ====================

const loginSchema = {
  body: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required',
    }),
  }),
};

const registerEmployeeSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().trim().required(),
    lastName: Joi.string().trim().required(),
    employeeId: Joi.string().uppercase().trim().required(),
    dateOfBirth: Joi.date().iso().optional(),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').optional(),
    phone: Joi.string().trim().optional(),
    departmentId: mongoIdSchema.required(),
    designationId: mongoIdSchema.required(),
    managerId: mongoIdSchema.optional(),
    dateOfJoining: Joi.date().iso().required(),
    shiftId: mongoIdSchema.optional(),
    role: Joi.string().valid('EMPLOYEE', 'MANAGER', 'COMPANY_ADMIN').default('EMPLOYEE'),
  }),
};

// ==================== ATTENDANCE VALIDATION SCHEMAS ====================

const punchInSchema = {
  body: Joi.object({
    faceImage: Joi.string().required().messages({
      'any.required': 'Face image is required',
    }),
    location: Joi.object({
      latitude: Joi.number().min(-90).max(90),
      longitude: Joi.number().min(-180).max(180),
    }).optional(),
    isWFH: Joi.boolean().default(false),
    deviceInfo: Joi.object({
      userAgent: Joi.string(),
      browser: Joi.string(),
      os: Joi.string(),
    }).optional(),
  }),
};

const manualAttendanceSchema = {
  body: Joi.object({
    employeeId: mongoIdSchema.required(),
    date: Joi.date().iso().required(),
    punchInTime: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .required(),
    punchOutTime: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .optional(),
    reason: Joi.string().trim().required(),
    isWFH: Joi.boolean().default(false),
  }),
};

// ==================== LEAVE VALIDATION SCHEMAS ====================

const applyLeaveSchema = {
  body: Joi.object({
    leaveTypeId: mongoIdSchema.required(),
    fromDate: Joi.date().iso().required(),
    toDate: Joi.date().iso().min(Joi.ref('fromDate')).required(),
    isHalfDay: Joi.boolean().default(false),
    halfDayPeriod: Joi.string().valid('FIRST_HALF', 'SECOND_HALF', null).optional(),
    reason: Joi.string().trim().min(10).max(500).required(),
  }),
};

const approveRejectLeaveSchema = {
  body: Joi.object({
    status: Joi.string().valid('APPROVED', 'REJECTED').required(),
    comments: Joi.string().trim().optional(),
  }),
};

// ==================== EXPORT ====================

module.exports = {
  validate,
  mongoIdSchema,
  paginationSchema,
  dateRangeSchema,
  loginSchema,
  registerEmployeeSchema,
  punchInSchema,
  manualAttendanceSchema,
  applyLeaveSchema,
  approveRejectLeaveSchema,
};
