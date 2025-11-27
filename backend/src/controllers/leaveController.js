const { LeaveRequest, LeaveType, Employee, Holiday, Attendance } = require('../models');
const { HTTP_STATUS, AUDIT_ACTIONS, LEAVE_STATUS, ATTENDANCE_STATUS, NOTIFICATION_EVENTS } = require('../config/constants');
const { asyncHandler, AppError } = require('../middlewares/errorMiddleware');
const leaveBalanceService = require('../services/leaveBalanceService');
const notificationService = require('../services/notificationService');
const auditLogService = require('../services/auditLogService');
const { getStartOfDay, getEndOfDay, formatDate, getBusinessDays } = require('../utils/dateHelper');

/**
 * @route   POST /api/v1/leaves/apply
 * @desc    Apply for leave
 * @access  Private
 */
exports.applyLeave = asyncHandler(async (req, res, next) => {
  const { leaveTypeId, fromDate, toDate, isHalfDay = false, halfDayPeriod, reason } = req.body;
  const employeeId = req.userId;

  // Get employee with manager
  const employee = await Employee.findById(employeeId)
    .populate('manager', 'firstName lastName email')
    .populate('company', 'name');

  if (!employee) {
    return next(new AppError('Employee not found', HTTP_STATUS.NOT_FOUND));
  }

  // Get leave type
  const leaveType = await LeaveType.findById(leaveTypeId);
  if (!leaveType) {
    return next(new AppError('Leave type not found', HTTP_STATUS.NOT_FOUND));
  }

  if (!leaveType.isActive) {
    return next(new AppError('This leave type is not active', HTTP_STATUS.BAD_REQUEST));
  }

  // Validate dates
  const from = getStartOfDay(new Date(fromDate));
  const to = getEndOfDay(new Date(toDate));
  const today = getStartOfDay(new Date());

  if (from < today) {
    return next(new AppError('Cannot apply for leave in the past', HTTP_STATUS.BAD_REQUEST));
  }

  // Calculate leave days
  let totalDays = getBusinessDays(from, to);
  if (isHalfDay) {
    totalDays = 0.5;
  }

  // Check if employee has sufficient leave balance
  const hasSufficient = await leaveBalanceService.hasSufficientBalance(employeeId, leaveTypeId, totalDays);
  if (!hasSufficient) {
    return next(new AppError('Insufficient leave balance', HTTP_STATUS.BAD_REQUEST));
  }

  // Check for overlapping leave requests
  const overlappingLeave = await LeaveRequest.findOne({
    employee: employeeId,
    status: { $in: [LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED] },
    $or: [
      { fromDate: { $lte: to }, toDate: { $gte: from } },
    ],
  });

  if (overlappingLeave) {
    return next(new AppError('You already have a leave request for these dates', HTTP_STATUS.CONFLICT));
  }

  // Check for holidays in the date range
  const holidays = await Holiday.find({
    company: employee.company._id,
    date: { $gte: from, $lte: to },
    isActive: true,
  });

  if (holidays.length > 0 && !isHalfDay) {
    // Note: Could warn user about holidays or auto-adjust
    console.log(`Note: ${holidays.length} holiday(s) found in leave period`);
  }

  // Build approval chain
  const approvalChain = [];

  // Level 1: Direct Manager (if exists)
  if (employee.manager) {
    approvalChain.push({
      level: 1,
      approver: employee.manager._id,
      approverRole: 'MANAGER',
      status: 'PENDING',
    });
  }

  // Level 2: HR/Admin (for leaves > certain days or specific leave types)
  // This can be enhanced based on company policies
  if (totalDays > 3 || leaveType.requiresApproval) {
    approvalChain.push({
      level: approvalChain.length + 1,
      approver: employee.company._id, // Placeholder - would need HR role lookup
      approverRole: 'HR',
      status: 'PENDING',
    });
  }

  // Create leave request
  const leaveRequest = await LeaveRequest.create({
    employee: employeeId,
    company: employee.company._id,
    leaveType: leaveTypeId,
    fromDate: from,
    toDate: to,
    isHalfDay,
    halfDayPeriod: isHalfDay ? halfDayPeriod : null,
    totalDays,
    reason,
    status: LEAVE_STATUS.PENDING,
    approvalChain,
    currentApprovalLevel: 1,
  });

  // Audit log
  await auditLogService.logLeave(AUDIT_ACTIONS.CREATE, employeeId, employee.company._id, leaveRequest._id, {
    leaveType: leaveType.name,
    fromDate: from,
    toDate: to,
    totalDays,
  }, {
    ipAddress: req.ip,
  });

  // Notify approvers
  if (employee.manager) {
    await notificationService.send({
      recipientId: employee.manager._id,
      companyId: employee.company._id,
      type: 'IN_APP',
      event: NOTIFICATION_EVENTS.LEAVE_APPLIED,
      title: 'New Leave Application',
      message: `${employee.fullName} has applied for ${leaveType.name} from ${formatDate(from)} to ${formatDate(to)}.`,
      relatedEntity: {
        entityType: 'LeaveRequest',
        entityId: leaveRequest._id,
      },
    });
  }

  // Populate response
  const populatedLeave = await LeaveRequest.findById(leaveRequest._id)
    .populate('leaveType', 'name code color')
    .populate('approvalChain.approver', 'firstName lastName email');

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Leave application submitted successfully',
    data: { leaveRequest: populatedLeave },
  });
});

/**
 * @route   GET /api/v1/leaves/my-leaves
 * @desc    Get my leave requests
 * @access  Private
 */
exports.getMyLeaves = asyncHandler(async (req, res, next) => {
  const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
  const employeeId = req.userId;

  const query = { employee: employeeId };

  if (status) {
    query.status = status;
  }

  if (startDate || endDate) {
    query.fromDate = {};
    if (startDate) query.fromDate.$gte = new Date(startDate);
    if (endDate) query.fromDate.$lte = new Date(endDate);
  }

  const leaves = await LeaveRequest.find(query)
    .populate('leaveType', 'name code color')
    .populate('approvalChain.approver', 'firstName lastName email')
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
 * @route   GET /api/v1/leaves/:id
 * @desc    Get leave request by ID
 * @access  Private
 */
exports.getLeaveById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const leave = await LeaveRequest.findById(id)
    .populate('employee', 'employeeId firstName lastName email profilePicture')
    .populate('leaveType', 'name code color')
    .populate('approvalChain.approver', 'firstName lastName email')
    .populate('finalApprover', 'firstName lastName email')
    .populate('rejectedBy', 'firstName lastName email');

  if (!leave) {
    return next(new AppError('Leave request not found', HTTP_STATUS.NOT_FOUND));
  }

  // Check access: employee themselves, their manager, or admin
  const hasAccess =
    leave.employee._id.toString() === req.userId.toString() ||
    leave.approvalChain.some(a => a.approver._id.toString() === req.userId.toString()) ||
    ['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(req.userRole);

  if (!hasAccess) {
    return next(new AppError('You do not have access to this leave request', HTTP_STATUS.FORBIDDEN));
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { leave },
  });
});

/**
 * @route   GET /api/v1/leaves/pending-approvals
 * @desc    Get leaves pending my approval
 * @access  Private (Manager/HR/Admin)
 */
exports.getPendingApprovals = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const approverId = req.userId;

  const leaves = await LeaveRequest.find({
    'approvalChain.approver': approverId,
    'approvalChain.status': 'PENDING',
    status: LEAVE_STATUS.PENDING,
  })
    .populate('employee', 'employeeId firstName lastName email profilePicture')
    .populate('leaveType', 'name code color')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await LeaveRequest.countDocuments({
    'approvalChain.approver': approverId,
    'approvalChain.status': 'PENDING',
    status: LEAVE_STATUS.PENDING,
  });

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
 * @route   POST /api/v1/leaves/:id/approve
 * @desc    Approve leave request
 * @access  Private (Manager/HR/Admin)
 */
exports.approveLeave = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { comments } = req.body;
  const approverId = req.userId;

  const leave = await LeaveRequest.findById(id)
    .populate('employee', 'firstName lastName email')
    .populate('leaveType', 'name code');

  if (!leave) {
    return next(new AppError('Leave request not found', HTTP_STATUS.NOT_FOUND));
  }

  if (leave.status !== LEAVE_STATUS.PENDING) {
    return next(new AppError('Leave request is not pending', HTTP_STATUS.BAD_REQUEST));
  }

  // Find current approval stage
  const currentStage = leave.approvalChain.find(
    stage => stage.level === leave.currentApprovalLevel && stage.approver.toString() === approverId.toString()
  );

  if (!currentStage) {
    return next(new AppError('You are not authorized to approve this leave', HTTP_STATUS.FORBIDDEN));
  }

  if (currentStage.status !== 'PENDING') {
    return next(new AppError('This approval stage is already processed', HTTP_STATUS.BAD_REQUEST));
  }

  // Update approval stage
  currentStage.status = 'APPROVED';
  currentStage.comments = comments;
  currentStage.actionAt = new Date();

  // Check if there are more approval stages
  const nextLevel = leave.currentApprovalLevel + 1;
  const nextStage = leave.approvalChain.find(stage => stage.level === nextLevel);

  if (nextStage) {
    // Move to next approval level
    leave.currentApprovalLevel = nextLevel;
  } else {
    // All approvals complete - approve the leave
    leave.status = LEAVE_STATUS.APPROVED;
    leave.finalApprover = approverId;
    leave.finalApprovedAt = new Date();

    // Deduct leave balance
    await leaveBalanceService.deductLeaveBalance(
      leave.employee._id,
      leave.leaveType._id,
      leave.totalDays
    );

    // Create attendance records for leave days
    await createLeaveAttendanceRecords(leave);

    // Notify employee
    await notificationService.send({
      recipientId: leave.employee._id,
      companyId: leave.company,
      type: 'IN_APP',
      event: NOTIFICATION_EVENTS.LEAVE_APPROVED,
      title: 'Leave Approved',
      message: `Your ${leave.leaveType.name} from ${formatDate(leave.fromDate)} to ${formatDate(leave.toDate)} has been approved.`,
      relatedEntity: {
        entityType: 'LeaveRequest',
        entityId: leave._id,
      },
    });
  }

  await leave.save();

  // Audit log
  await auditLogService.logLeave(AUDIT_ACTIONS.APPROVE, approverId, req.companyId, leave._id, {
    approvalLevel: leave.currentApprovalLevel - 1,
    finalStatus: leave.status,
  }, {
    ipAddress: req.ip,
    comments,
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: leave.status === LEAVE_STATUS.APPROVED
      ? 'Leave approved successfully'
      : 'Leave moved to next approval stage',
    data: { leave },
  });
});

/**
 * @route   POST /api/v1/leaves/:id/reject
 * @desc    Reject leave request
 * @access  Private (Manager/HR/Admin)
 */
exports.rejectLeave = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { comments } = req.body;
  const approverId = req.userId;

  const leave = await LeaveRequest.findById(id)
    .populate('employee', 'firstName lastName email')
    .populate('leaveType', 'name code');

  if (!leave) {
    return next(new AppError('Leave request not found', HTTP_STATUS.NOT_FOUND));
  }

  if (leave.status !== LEAVE_STATUS.PENDING) {
    return next(new AppError('Leave request is not pending', HTTP_STATUS.BAD_REQUEST));
  }

  // Find current approval stage
  const currentStage = leave.approvalChain.find(
    stage => stage.level === leave.currentApprovalLevel && stage.approver.toString() === approverId.toString()
  );

  if (!currentStage) {
    return next(new AppError('You are not authorized to reject this leave', HTTP_STATUS.FORBIDDEN));
  }

  // Update approval stage and leave status
  currentStage.status = 'REJECTED';
  currentStage.comments = comments;
  currentStage.actionAt = new Date();

  leave.status = LEAVE_STATUS.REJECTED;
  leave.rejectedBy = approverId;
  leave.rejectedAt = new Date();
  leave.rejectionReason = comments;

  await leave.save();

  // Notify employee
  await notificationService.send({
    recipientId: leave.employee._id,
    companyId: leave.company,
    type: 'IN_APP',
    event: NOTIFICATION_EVENTS.LEAVE_REJECTED,
    title: 'Leave Rejected',
    message: `Your ${leave.leaveType.name} from ${formatDate(leave.fromDate)} to ${formatDate(leave.toDate)} has been rejected. ${comments ? 'Reason: ' + comments : ''}`,
    relatedEntity: {
      entityType: 'LeaveRequest',
      entityId: leave._id,
    },
  });

  // Audit log
  await auditLogService.logLeave(AUDIT_ACTIONS.REJECT, approverId, req.companyId, leave._id, {
    reason: comments,
  }, {
    ipAddress: req.ip,
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Leave rejected successfully',
    data: { leave },
  });
});

/**
 * @route   POST /api/v1/leaves/:id/cancel
 * @desc    Cancel leave request
 * @access  Private
 */
exports.cancelLeave = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;
  const employeeId = req.userId;

  const leave = await LeaveRequest.findById(id)
    .populate('leaveType', 'name code');

  if (!leave) {
    return next(new AppError('Leave request not found', HTTP_STATUS.NOT_FOUND));
  }

  // Only the employee who applied can cancel
  if (leave.employee.toString() !== employeeId.toString()) {
    return next(new AppError('You can only cancel your own leave requests', HTTP_STATUS.FORBIDDEN));
  }

  // Can only cancel pending or approved leaves
  if (![LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED].includes(leave.status)) {
    return next(new AppError('This leave cannot be cancelled', HTTP_STATUS.BAD_REQUEST));
  }

  // Check if leave has already started
  const today = getStartOfDay(new Date());
  if (leave.fromDate <= today) {
    return next(new AppError('Cannot cancel leave that has already started', HTTP_STATUS.BAD_REQUEST));
  }

  const previousStatus = leave.status;

  leave.status = LEAVE_STATUS.CANCELLED;
  leave.cancelledAt = new Date();
  leave.cancellationReason = reason;

  await leave.save();

  // Restore leave balance if it was approved
  if (previousStatus === LEAVE_STATUS.APPROVED) {
    await leaveBalanceService.restoreLeaveBalance(
      leave.employee,
      leave.leaveType._id,
      leave.totalDays
    );

    // Delete attendance records
    await Attendance.deleteMany({
      leaveRequest: leave._id,
    });
  }

  // Audit log
  await auditLogService.logLeave(AUDIT_ACTIONS.CANCEL, employeeId, req.companyId, leave._id, {
    previousStatus,
    reason,
  }, {
    ipAddress: req.ip,
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Leave cancelled successfully',
    data: { leave },
  });
});

/**
 * @route   GET /api/v1/leaves/balance
 * @desc    Get leave balance
 * @access  Private
 */
exports.getLeaveBalance = asyncHandler(async (req, res, next) => {
  const { employeeId } = req.query;
  const targetEmployeeId = employeeId || req.userId;

  // Ensure non-admins can only view their own balance
  if (targetEmployeeId !== req.userId.toString() && !['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(req.userRole)) {
    return next(new AppError('You can only view your own leave balance', HTTP_STATUS.FORBIDDEN));
  }

  const balanceData = await leaveBalanceService.getLeaveBalance(targetEmployeeId);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { balance: balanceData },
  });
});

/**
 * @route   GET /api/v1/leaves/team-calendar
 * @desc    Get team leave calendar (for managers)
 * @access  Private (Manager/Admin)
 */
exports.getTeamLeaveCalendar = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, departmentId } = req.query;
  const managerId = req.userId;

  const start = startDate ? new Date(startDate) : getStartOfDay(new Date());
  const end = endDate ? new Date(endDate) : getEndOfDay(new Date(new Date().setMonth(new Date().getMonth() + 1)));

  // Get team members
  const employeeQuery = { manager: managerId };
  if (departmentId) employeeQuery.department = departmentId;

  const teamMembers = await Employee.find(employeeQuery).select('_id');
  const teamMemberIds = teamMembers.map(emp => emp._id);

  // Get approved leaves in date range
  const leaves = await LeaveRequest.find({
    employee: { $in: teamMemberIds },
    status: LEAVE_STATUS.APPROVED,
    fromDate: { $lte: end },
    toDate: { $gte: start },
  })
    .populate('employee', 'employeeId firstName lastName profilePicture')
    .populate('leaveType', 'name code color')
    .sort({ fromDate: 1 });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      period: { startDate: start, endDate: end },
      leaves,
    },
  });
});

/**
 * @route   GET /api/v1/leaves/types
 * @desc    Get available leave types
 * @access  Private
 */
exports.getLeaveTypes = asyncHandler(async (req, res, next) => {
  const companyId = req.companyId;

  const leaveTypes = await LeaveType.find({
    company: companyId,
    isActive: true,
  }).sort({ displayOrder: 1, name: 1 });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { leaveTypes },
  });
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Create attendance records for approved leave days
 */
async function createLeaveAttendanceRecords(leave) {
  const { employee, company, leaveType, fromDate, toDate, _id: leaveRequestId } = leave;

  const start = getStartOfDay(new Date(fromDate));
  const end = getEndOfDay(new Date(toDate));
  const currentDate = new Date(start);

  const attendanceRecords = [];

  while (currentDate <= end) {
    // Check if it's a weekend or holiday
    const dayOfWeek = currentDate.getDay();

    // Get employee shift to check weekly offs
    const emp = await Employee.findById(employee).populate('shift');
    const weeklyOffs = emp?.shift?.weeklyOffs || [0, 6]; // Default: Sunday & Saturday

    if (!weeklyOffs.includes(dayOfWeek)) {
      // Check for existing attendance
      const existingAttendance = await Attendance.findOne({
        employee,
        date: getStartOfDay(new Date(currentDate)),
      });

      if (!existingAttendance) {
        attendanceRecords.push({
          employee,
          company,
          date: getStartOfDay(new Date(currentDate)),
          status: ATTENDANCE_STATUS.ON_LEAVE,
          leaveRequest: leaveRequestId,
        });
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (attendanceRecords.length > 0) {
    await Attendance.insertMany(attendanceRecords);
  }
}

module.exports = exports;
