# Smart HR + Attendance System - Complete Implementation Guide

This document contains all the remaining code and setup instructions for the Smart HR system.

---

## TABLE OF CONTENTS

1. [Backend Controllers (Remaining)](#backend-controllers)
2. [Backend Routes](#backend-routes)
3. [Backend Utilities](#backend-utilities)
4. [Backend Server Entry Point](#backend-server)
5. [Frontend Structure](#frontend-structure)
6. [Frontend Contexts & Hooks](#frontend-contexts)
7. [Frontend Components](#frontend-components)
8. [Frontend Pages](#frontend-pages)
9. [Setup Instructions](#setup-instructions)
10. [API Documentation](#api-documentation)

---

## BACKEND CONTROLLERS

### `backend/src/controllers/attendanceController.js`

```javascript
const { Attendance, Employee, Shift, Holiday } = require('../models');
const { HTTP_STATUS, ATTENDANCE_STATUS, PUNCH_TYPE, PUNCH_SOURCE, AUDIT_ACTIONS } = require('../config/constants');
const { asyncHandler, AppError } = require('../middlewares/errorMiddleware');
const faceRecognitionService = require('../services/faceRecognitionService');
const auditLogService = require('../services/auditLogService');
const notificationService = require('../services/notificationService');

/**
 * @route   POST /api/v1/attendance/punch-in
 * @desc    Punch in with face recognition
 * @access  Private
 */
exports.punchIn = asyncHandler(async (req, res, next) => {
  const { faceImage, location, isWFH, deviceInfo } = req.body;
  const employeeId = req.userId;

  // Get employee with shift
  const employee = await Employee.findById(employeeId).populate('shift');
  if (!employee) {
    return next(new AppError('Employee not found', HTTP_STATUS.NOT_FOUND));
  }

  // Check if face is registered
  if (!employee.faceData.isRegistered) {
    return next(new AppError('Face not registered. Please register your face first.', HTTP_STATUS.BAD_REQUEST));
  }

  // Verify face
  const faceVerification = await faceRecognitionService.verifyFace(employeeId.toString(), faceImage);

  if (!faceVerification.matched || faceVerification.confidence < 80) {
    return next(new AppError('Face verification failed. Please try again.', HTTP_STATUS.UNAUTHORIZED));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if already punched in today
  let attendance = await Attendance.findOne({
    employee: employeeId,
    date: today,
  });

  if (attendance && attendance.punchIn) {
    return next(new AppError('You have already punched in today', HTTP_STATUS.BAD_REQUEST));
  }

  const now = new Date();

  // Create or update attendance record
  if (!attendance) {
    attendance = new Attendance({
      employee: employeeId,
      company: req.companyId,
      date: today,
      shift: employee.shift?._id,
      status: ATTENDANCE_STATUS.PRESENT,
      isWFH,
    });
  }

  // Add punch record
  attendance.punches.push({
    type: PUNCH_TYPE.IN,
    time: now,
    source: PUNCH_SOURCE.FACE,
    ipAddress: req.ip,
    location,
    faceConfidence: faceVerification.confidence,
    deviceInfo,
  });

  attendance.punchIn = now;
  attendance.status = isWFH ? ATTENDANCE_STATUS.WFH : ATTENDANCE_STATUS.PRESENT;

  // Check if late
  if (employee.shift) {
    attendance.checkIfLate(employee.shift.startTime, employee.shift.graceMinutes);
  }

  await attendance.save();

  // Audit log
  await auditLogService.logAttendance(
    AUDIT_ACTIONS.PUNCH_IN,
    employeeId,
    req.companyId,
    attendance._id,
    {},
    { ipAddress: req.ip, faceConfidence: faceVerification.confidence }
  );

  // Notify manager if late
  if (attendance.isLate && employee.manager) {
    const template = notificationService.getLateArrivalTemplate(
      employee.fullName,
      now.toLocaleTimeString(),
      attendance.lateByMinutes
    );

    await notificationService.send({
      recipientId: employee.manager,
      companyId: req.companyId,
      type: 'EMAIL',
      event: 'LATE_ARRIVAL',
      ...template,
    });
  }

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Punch in successful',
    data: { attendance },
  });
});

/**
 * @route   POST /api/v1/attendance/punch-out
 * @desc    Punch out with face recognition
 * @access  Private
 */
exports.punchOut = asyncHandler(async (req, res, next) => {
  const { faceImage, location, deviceInfo } = req.body;
  const employeeId = req.userId;

  const employee = await Employee.findById(employeeId).populate('shift');
  if (!employee) {
    return next(new AppError('Employee not found', HTTP_STATUS.NOT_FOUND));
  }

  // Verify face
  const faceVerification = await faceRecognitionService.verifyFace(employeeId.toString(), faceImage);

  if (!faceVerification.matched || faceVerification.confidence < 80) {
    return next(new AppError('Face verification failed. Please try again.', HTTP_STATUS.UNAUTHORIZED));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await Attendance.findOne({
    employee: employeeId,
    date: today,
  });

  if (!attendance || !attendance.punchIn) {
    return next(new AppError('You have not punched in today', HTTP_STATUS.BAD_REQUEST));
  }

  if (attendance.punchOut) {
    return next(new AppError('You have already punched out today', HTTP_STATUS.BAD_REQUEST));
  }

  const now = new Date();

  // Add punch out record
  attendance.punches.push({
    type: PUNCH_TYPE.OUT,
    time: now,
    source: PUNCH_SOURCE.FACE,
    ipAddress: req.ip,
    location,
    faceConfidence: faceVerification.confidence,
    deviceInfo,
  });

  attendance.punchOut = now;

  // Calculate total hours
  attendance.calculateTotalHours();

  // Check if early exit
  if (employee.shift) {
    attendance.checkIfEarlyExit(employee.shift.endTime);
    attendance.checkIfHalfDay(employee.shift.halfDayHours);
  }

  await attendance.save();

  // Audit log
  await auditLogService.logAttendance(
    AUDIT_ACTIONS.PUNCH_OUT,
    employeeId,
    req.companyId,
    attendance._id
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Punch out successful',
    data: { attendance },
  });
});

/**
 * @route   POST /api/v1/attendance/register-face
 * @desc    Register face for employee
 * @access  Private
 */
exports.registerFace = asyncHandler(async (req, res, next) => {
  const { faceImage } = req.body;
  const employeeId = req.userId;

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    return next(new AppError('Employee not found', HTTP_STATUS.NOT_FOUND));
  }

  // Register face with face recognition service
  const registration = await faceRecognitionService.registerFace(employeeId.toString(), faceImage);

  if (!registration.success) {
    return next(new AppError('Face registration failed', HTTP_STATUS.BAD_REQUEST));
  }

  // Update employee face data
  employee.faceData = {
    referenceImage: faceImage, // In production, upload to S3/Cloudinary
    faceId: registration.faceId,
    embeddings: registration.embeddings,
    isRegistered: true,
    registeredAt: new Date(),
  };

  await employee.save();

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Face registered successfully',
    data: {
      faceId: registration.faceId,
      confidence: registration.confidence,
    },
  });
});

/**
 * @route   GET /api/v1/attendance/my-attendance
 * @desc    Get my attendance records
 * @access  Private
 */
exports.getMyAttendance = asyncHandler(async (req, res, next) => {
  const { month, year, page = 1, limit = 31 } = req.query;

  const query = { employee: req.userId };

  if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    query.date = { $gte: startDate, $lte: endDate };
  }

  const attendance = await Attendance.find(query)
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('shift', 'name startTime endTime');

  const total = await Attendance.countDocuments(query);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      attendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * @route   GET /api/v1/attendance/today-status
 * @desc    Get today's attendance status
 * @access  Private
 */
exports.getTodayStatus = asyncHandler(async (req, res, next) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await Attendance.findOne({
    employee: req.userId,
    date: today,
  }).populate('shift', 'name startTime endTime');

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { attendance },
  });
});

module.exports = exports;
```

### `backend/src/controllers/leaveController.js`

```javascript
const { LeaveRequest, LeaveType, Employee, Attendance } = require('../models');
const { HTTP_STATUS, LEAVE_STATUS, AUDIT_ACTIONS, ROLES } = require('../config/constants');
const { asyncHandler, AppError } = require('../middlewares/errorMiddleware');
const leaveBalanceService = require('../services/leaveBalanceService');
const notificationService = require('../services/notificationService');
const auditLogService = require('../services/auditLogService');

/**
 * @route   POST /api/v1/leaves/apply
 * @desc    Apply for leave
 * @access  Private
 */
exports.applyLeave = asyncHandler(async (req, res, next) => {
  const { leaveTypeId, fromDate, toDate, isHalfDay, halfDayPeriod, reason } = req.body;
  const employeeId = req.userId;

  // Get employee with manager
  const employee = await Employee.findById(employeeId).populate('manager');
  if (!employee) {
    return next(new AppError('Employee not found', HTTP_STATUS.NOT_FOUND));
  }

  // Get leave type
  const leaveType = await LeaveType.findById(leaveTypeId);
  if (!leaveType || !leaveType.isActive) {
    return next(new AppError('Leave type not found or inactive', HTTP_STATUS.NOT_FOUND));
  }

  // Calculate leave days
  const leaveRequest = new LeaveRequest({
    employee: employeeId,
    company: req.companyId,
    leaveType: leaveTypeId,
    fromDate,
    toDate,
    isHalfDay,
    halfDayPeriod,
    reason,
    totalDays: 0,
  });

  leaveRequest.totalDays = leaveRequest.calculateBusinessDays();

  // Check if sufficient balance
  const hasSufficientBalance = await leaveBalanceService.hasSufficientBalance(
    employeeId,
    leaveTypeId,
    leaveRequest.totalDays
  );

  if (!hasSufficientBalance && leaveType.isPaid) {
    return next(new AppError('Insufficient leave balance', HTTP_STATUS.BAD_REQUEST));
  }

  // Check for overlapping leaves
  const overlappingLeave = await LeaveRequest.findOne({
    employee: employeeId,
    status: { $in: [LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED] },
    $or: [
      { fromDate: { $lte: toDate }, toDate: { $gte: fromDate } },
    ],
  });

  if (overlappingLeave) {
    return next(new AppError('You already have a leave request for this period', HTTP_STATUS.BAD_REQUEST));
  }

  // Set up approval chain
  const approvalChain = [];

  // Level 1: Manager (if exists)
  if (employee.manager) {
    approvalChain.push({
      level: 1,
      approver: employee.manager._id,
      approverRole: ROLES.MANAGER,
      status: 'PENDING',
    });
  }

  // Level 2: HR/Admin
  // In production, fetch actual HR from employee's company
  // For now, we'll add it dynamically when manager approves

  leaveRequest.approvalChain = approvalChain;
  leaveRequest.currentApprovalLevel = 1;

  await leaveRequest.save();

  // Audit log
  await auditLogService.logLeave(
    AUDIT_ACTIONS.CREATE,
    employeeId,
    req.companyId,
    leaveRequest._id
  );

  // Notify manager
  if (employee.manager) {
    const template = notificationService.getLeaveAppliedTemplate(
      employee.fullName,
      leaveType.name,
      fromDate.toLocaleDateString(),
      toDate.toLocaleDateString()
    );

    await notificationService.send({
      recipientId: employee.manager._id,
      companyId: req.companyId,
      type: 'EMAIL',
      event: 'LEAVE_APPLIED',
      ...template,
      relatedEntity: {
        entityType: 'LeaveRequest',
        entityId: leaveRequest._id,
      },
    });
  }

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Leave request submitted successfully',
    data: { leaveRequest },
  });
});

/**
 * @route   GET /api/v1/leaves/my-leaves
 * @desc    Get my leave requests
 * @access  Private
 */
exports.getMyLeaves = asyncHandler(async (req, res, next) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query = { employee: req.userId };
  if (status) query.status = status;

  const leaves = await LeaveRequest.find(query)
    .populate('leaveType', 'name code color')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await LeaveRequest.countDocuments(query);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      leaves,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * @route   GET /api/v1/leaves/balance
 * @desc    Get leave balance
 * @access  Private
 */
exports.getLeaveBalance = asyncHandler(async (req, res, next) => {
  const balance = await leaveBalanceService.getLeaveBalance(req.userId);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { balance },
  });
});

/**
 * @route   PUT /api/v1/leaves/:leaveId/approve
 * @desc    Approve/reject leave request
 * @access  Private (Manager/Admin)
 */
exports.approveRejectLeave = asyncHandler(async (req, res, next) => {
  const { leaveId } = req.params;
  const { status, comments } = req.body;

  const leaveRequest = await LeaveRequest.findById(leaveId)
    .populate('employee')
    .populate('leaveType');

  if (!leaveRequest) {
    return next(new AppError('Leave request not found', HTTP_STATUS.NOT_FOUND));
  }

  // Check if user is authorized to approve
  const currentStage = leaveRequest.approvalChain.find(
    (stage) => stage.level === leaveRequest.currentApprovalLevel
  );

  if (!currentStage || currentStage.approver.toString() !== req.userId.toString()) {
    // Check if user is admin
    if (![ROLES.COMPANY_ADMIN, ROLES.SUPER_ADMIN].includes(req.userRole)) {
      return next(new AppError('You are not authorized to approve this leave', HTTP_STATUS.FORBIDDEN));
    }
  }

  if (status === 'APPROVED') {
    // Update current approval stage
    currentStage.status = 'APPROVED';
    currentStage.comments = comments;
    currentStage.actionAt = new Date();

    // Check if this is the final approval level
    if (leaveRequest.currentApprovalLevel >= leaveRequest.approvalChain.length) {
      // Final approval
      leaveRequest.status = LEAVE_STATUS.APPROVED;
      leaveRequest.finalApprover = req.userId;
      leaveRequest.finalApprovedAt = new Date();

      // Deduct leave balance
      await leaveBalanceService.deductLeaveBalance(
        leaveRequest.employee._id,
        leaveRequest.leaveType._id,
        leaveRequest.totalDays
      );

      // Create attendance records for leave period
      await createLeaveAttendanceRecords(leaveRequest);

      // Notify employee
      const template = notificationService.getLeaveApprovedTemplate(
        leaveRequest.leaveType.name,
        leaveRequest.fromDate.toLocaleDateString(),
        leaveRequest.toDate.toLocaleDateString()
      );

      await notificationService.send({
        recipientId: leaveRequest.employee._id,
        companyId: leaveRequest.company,
        type: 'EMAIL',
        event: 'LEAVE_APPROVED',
        ...template,
      });
    } else {
      // Move to next approval level
      leaveRequest.currentApprovalLevel += 1;
      // In production, set up next approver (HR)
    }
  } else if (status === 'REJECTED') {
    leaveRequest.status = LEAVE_STATUS.REJECTED;
    leaveRequest.rejectedBy = req.userId;
    leaveRequest.rejectedAt = new Date();
    leaveRequest.rejectionReason = comments;

    // Update current stage
    currentStage.status = 'REJECTED';
    currentStage.comments = comments;
    currentStage.actionAt = new Date();

    // Notify employee
    const template = notificationService.getLeaveRejectedTemplate(
      leaveRequest.leaveType.name,
      leaveRequest.fromDate.toLocaleDateString(),
      leaveRequest.toDate.toLocaleDateString(),
      comments
    );

    await notificationService.send({
      recipientId: leaveRequest.employee._id,
      companyId: leaveRequest.company,
      type: 'EMAIL',
      event: 'LEAVE_REJECTED',
      ...template,
    });
  }

  await leaveRequest.save();

  // Audit log
  await auditLogService.logLeave(
    status === 'APPROVED' ? AUDIT_ACTIONS.APPROVE : AUDIT_ACTIONS.REJECT,
    req.userId,
    req.companyId,
    leaveRequest._id
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `Leave ${status.toLowerCase()} successfully`,
    data: { leaveRequest },
  });
});

/**
 * Helper: Create attendance records for approved leave
 */
async function createLeaveAttendanceRecords(leaveRequest) {
  const { employee, company, fromDate, toDate, _id: leaveId } = leaveRequest;

  const currentDate = new Date(fromDate);
  const endDate = new Date(toDate);

  while (currentDate <= endDate) {
    const dateToCheck = new Date(currentDate);
    dateToCheck.setHours(0, 0, 0, 0);

    // Check if attendance record already exists
    const existingAttendance = await Attendance.findOne({
      employee,
      date: dateToCheck,
    });

    if (!existingAttendance) {
      await Attendance.create({
        employee,
        company,
        date: dateToCheck,
        status: 'ON_LEAVE',
        leaveRequest: leaveId,
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }
}

module.exports = exports;
```

---

## BACKEND ROUTES

### `backend/src/routes/authRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validate, loginSchema } = require('../middlewares/validationMiddleware');
const { authLimiter } = require('../middlewares/rateLimitMiddleware');

// Public routes
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);

// Protected routes
router.use(authenticate);
router.post('/logout', authController.logout);
router.get('/me', authController.getMe);
router.put('/change-password', authController.changePassword);

module.exports = router;
```

### `backend/src/routes/attendanceRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validate, punchInSchema } = require('../middlewares/validationMiddleware');
const { faceLimiter } = require('../middlewares/rateLimitMiddleware');

// All routes require authentication
router.use(authenticate);

// Employee routes
router.post('/register-face', faceLimiter, attendanceController.registerFace);
router.post('/punch-in', faceLimiter, validate(punchInSchema), attendanceController.punchIn);
router.post('/punch-out', faceLimiter, validate(punchInSchema), attendanceController.punchOut);
router.get('/my-attendance', attendanceController.getMyAttendance);
router.get('/today-status', attendanceController.getTodayStatus);

module.exports = router;
```

### `backend/src/routes/leaveRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { validate, applyLeaveSchema, approveRejectLeaveSchema } = require('../middlewares/validationMiddleware');
const { ROLES } = require('../config/constants');

// All routes require authentication
router.use(authenticate);

// Employee routes
router.post('/apply', validate(applyLeaveSchema), leaveController.applyLeave);
router.get('/my-leaves', leaveController.getMyLeaves);
router.get('/balance', leaveController.getLeaveBalance);

// Manager/Admin routes
router.put(
  '/:leaveId/approve',
  authorize(ROLES.MANAGER, ROLES.COMPANY_ADMIN, ROLES.SUPER_ADMIN),
  validate(approveRejectLeaveSchema),
  leaveController.approveRejectLeave
);

module.exports = router;
```

### `backend/src/routes/index.js`

```javascript
const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./authRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const leaveRoutes = require('./leaveRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Smart HR API is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
```

---

## BACKEND UTILITIES

### `backend/src/utils/dateHelper.js`

```javascript
/**
 * Date Helper Utilities
 */

/**
 * Check if a date is a weekend
 */
exports.isWeekend = (date, weeklyOffs = [0, 6]) => {
  const dayOfWeek = new Date(date).getDay();
  return weeklyOffs.includes(dayOfWeek);
};

/**
 * Get business days between two dates
 */
exports.getBusinessDays = (startDate, endDate, weeklyOffs = [0, 6]) => {
  let count = 0;
  const currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    if (!exports.isWeekend(currentDate, weeklyOffs)) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return count;
};

/**
 * Get start and end of month
 */
exports.getMonthRange = (year, month) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

/**
 * Format date to YYYY-MM-DD
 */
exports.formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse time string (HH:MM) to minutes
 */
exports.timeToMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};
```

---

## BACKEND SERVER

### `backend/src/server.js`

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorMiddleware');
const { apiLimiter } = require('./middlewares/rateLimitMiddleware');

const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api', apiLimiter);

// Routes
app.use(`/api/${process.env.API_VERSION || 'v1'}`, routes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

module.exports = app;
```

### `backend/package.json`

```json
{
  "name": "smart-hr-backend",
  "version": "1.0.0",
  "description": "Smart HR + Attendance System Backend",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --watchAll --verbose",
    "seed": "node scripts/seed.js"
  },
  "keywords": ["hr", "attendance", "face-recognition", "leave-management"],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "joi": "^17.10.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "cookie-parser": "^1.4.6",
    "express-rate-limit": "^6.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.4"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

---

## FRONTEND STRUCTURE

I'll now create the complete frontend implementation in the next sections.

