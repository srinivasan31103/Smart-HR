const { Attendance, Employee, Shift, Holiday } = require('../models');
const { HTTP_STATUS, AUDIT_ACTIONS, ATTENDANCE_STATUS, PUNCH_TYPE, PUNCH_SOURCE } = require('../config/constants');
const { asyncHandler, AppError } = require('../middlewares/errorMiddleware');
const faceRecognitionService = require('../services/faceRecognitionService');
const notificationService = require('../services/notificationService');
const auditLogService = require('../services/auditLogService');
const { getStartOfDay, getEndOfDay, formatDate, getDateRange } = require('../utils/dateHelper');

/**
 * @route   POST /api/v1/attendance/punch-in
 * @desc    Punch in with face recognition
 * @access  Private
 */
exports.punchIn = asyncHandler(async (req, res, next) => {
  const { faceImage, location, isWFH = false, deviceInfo } = req.body;
  const employeeId = req.userId;

  // Get employee with shift
  const employee = await Employee.findById(employeeId)
    .populate('shift')
    .populate('company', 'name');

  if (!employee) {
    return next(new AppError('Employee not found', HTTP_STATUS.NOT_FOUND));
  }

  // Check if face is registered
  if (!employee.faceData.isRegistered) {
    return next(new AppError('Face not registered. Please register your face first.', HTTP_STATUS.BAD_REQUEST));
  }

  // Verify face
  const faceVerification = await faceRecognitionService.verifyFace(employee.employeeId, faceImage);

  if (!faceVerification.matched) {
    return next(new AppError('Face verification failed. Please try again.', HTTP_STATUS.UNAUTHORIZED));
  }

  const today = getStartOfDay(new Date());

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
      company: employee.company._id,
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
  attendance.isWFH = isWFH;

  // Check if late
  if (employee.shift) {
    attendance.checkIfLate(employee.shift.startTime, employee.shift.graceMinutes);
  }

  await attendance.save();

  // Audit log
  await auditLogService.logAttendance(AUDIT_ACTIONS.PUNCH_IN, employeeId, employee.company._id, attendance._id, {
    punchInTime: now,
    isLate: attendance.isLate,
    lateByMinutes: attendance.lateByMinutes,
  }, {
    ipAddress: req.ip,
    faceConfidence: faceVerification.confidence,
  });

  // Notify manager if late
  if (attendance.isLate && employee.manager) {
    await notificationService.send({
      recipientId: employee.manager,
      companyId: employee.company._id,
      type: 'IN_APP',
      event: 'LATE_ARRIVAL',
      title: 'Late Arrival Alert',
      message: `${employee.fullName} arrived late today at ${formatDate(now, 'HH:mm')}. Late by ${attendance.lateByMinutes} minutes.`,
      relatedEntity: {
        entityType: 'Attendance',
        entityId: attendance._id,
      },
    });
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: attendance.isLate
      ? `Punched in successfully. You are late by ${attendance.lateByMinutes} minutes.`
      : 'Punched in successfully',
    data: {
      attendance,
      isLate: attendance.isLate,
      lateByMinutes: attendance.lateByMinutes,
    },
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

  // Get employee with shift
  const employee = await Employee.findById(employeeId).populate('shift');

  if (!employee) {
    return next(new AppError('Employee not found', HTTP_STATUS.NOT_FOUND));
  }

  // Verify face
  const faceVerification = await faceRecognitionService.verifyFace(employee.employeeId, faceImage);

  if (!faceVerification.matched) {
    return next(new AppError('Face verification failed. Please try again.', HTTP_STATUS.UNAUTHORIZED));
  }

  const today = getStartOfDay(new Date());

  // Find today's attendance
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
  await auditLogService.logAttendance(AUDIT_ACTIONS.PUNCH_OUT, employeeId, employee.company, attendance._id, {
    punchOutTime: now,
    totalHours: attendance.totalHours,
    isEarlyExit: attendance.isEarlyExit,
  }, {
    ipAddress: req.ip,
    faceConfidence: faceVerification.confidence,
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Punched out successfully',
    data: {
      attendance,
      totalHours: attendance.totalHours,
      isEarlyExit: attendance.isEarlyExit,
      isHalfDay: attendance.isHalfDay,
    },
  });
});

/**
 * @route   GET /api/v1/attendance/my-attendance
 * @desc    Get my attendance records
 * @access  Private
 */
exports.getMyAttendance = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, page = 1, limit = 31 } = req.query;
  const employeeId = req.userId;

  const query = { employee: employeeId };

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = getStartOfDay(new Date(startDate));
    if (endDate) query.date.$lte = getEndOfDay(new Date(endDate));
  }

  const attendance = await Attendance.find(query)
    .populate('shift', 'name startTime endTime')
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

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
 * @route   GET /api/v1/attendance/today
 * @desc    Get today's attendance status
 * @access  Private
 */
exports.getTodayAttendance = asyncHandler(async (req, res, next) => {
  const employeeId = req.userId;
  const today = getStartOfDay(new Date());

  const attendance = await Attendance.findOne({
    employee: employeeId,
    date: today,
  }).populate('shift', 'name startTime endTime');

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      attendance: attendance || null,
      hasPunchedIn: !!(attendance && attendance.punchIn),
      hasPunchedOut: !!(attendance && attendance.punchOut),
    },
  });
});

/**
 * @route   GET /api/v1/attendance/team
 * @desc    Get team attendance (for managers)
 * @access  Private (Manager/Admin)
 */
exports.getTeamAttendance = asyncHandler(async (req, res, next) => {
  const { date, departmentId, status } = req.query;
  const managerId = req.userId;

  const targetDate = date ? getStartOfDay(new Date(date)) : getStartOfDay(new Date());

  // Build query for team members
  const employeeQuery = { manager: managerId };
  if (departmentId) employeeQuery.department = departmentId;

  const teamMembers = await Employee.find(employeeQuery).select('_id');
  const teamMemberIds = teamMembers.map(emp => emp._id);

  // Get attendance records
  const attendanceQuery = {
    employee: { $in: teamMemberIds },
    date: targetDate,
  };

  if (status) attendanceQuery.status = status;

  const attendance = await Attendance.find(attendanceQuery)
    .populate('employee', 'employeeId firstName lastName profilePicture')
    .populate('shift', 'name startTime endTime')
    .sort({ 'employee.firstName': 1 });

  // Get team members who haven't marked attendance
  const markedEmployeeIds = attendance.map(att => att.employee._id.toString());
  const absentEmployees = await Employee.find({
    _id: { $in: teamMemberIds.filter(id => !markedEmployeeIds.includes(id.toString())) },
  }).select('employeeId firstName lastName profilePicture');

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      date: targetDate,
      attendance,
      absentEmployees,
      summary: {
        total: teamMemberIds.length,
        present: attendance.filter(a => [ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.WFH].includes(a.status)).length,
        absent: absentEmployees.length,
        onLeave: attendance.filter(a => a.status === ATTENDANCE_STATUS.ON_LEAVE).length,
        late: attendance.filter(a => a.isLate).length,
      },
    },
  });
});

/**
 * @route   POST /api/v1/attendance/manual
 * @desc    Create manual attendance entry (HR/Admin only)
 * @access  Private (HR/Admin)
 */
exports.createManualAttendance = asyncHandler(async (req, res, next) => {
  const { employeeId, date, punchInTime, punchOutTime, reason, isWFH = false } = req.body;

  // Check if attendance already exists
  const existingAttendance = await Attendance.findOne({
    employee: employeeId,
    date: getStartOfDay(new Date(date)),
  });

  if (existingAttendance) {
    return next(new AppError('Attendance record already exists for this date', HTTP_STATUS.CONFLICT));
  }

  // Get employee
  const employee = await Employee.findById(employeeId).populate('shift');
  if (!employee) {
    return next(new AppError('Employee not found', HTTP_STATUS.NOT_FOUND));
  }

  // Create attendance record
  const attendanceDate = getStartOfDay(new Date(date));
  const punchIn = new Date(attendanceDate);
  const [inHours, inMinutes] = punchInTime.split(':');
  punchIn.setHours(parseInt(inHours), parseInt(inMinutes), 0, 0);

  const attendance = new Attendance({
    employee: employeeId,
    company: employee.company,
    date: attendanceDate,
    shift: employee.shift?._id,
    punchIn,
    status: isWFH ? ATTENDANCE_STATUS.WFH : ATTENDANCE_STATUS.PRESENT,
    isWFH,
    isManualEntry: true,
    manualEntryBy: req.userId,
    manualEntryReason: reason,
    manualEntryAt: new Date(),
  });

  attendance.punches.push({
    type: PUNCH_TYPE.IN,
    time: punchIn,
    source: PUNCH_SOURCE.MANUAL,
    ipAddress: req.ip,
  });

  // Handle punch out if provided
  if (punchOutTime) {
    const punchOut = new Date(attendanceDate);
    const [outHours, outMinutes] = punchOutTime.split(':');
    punchOut.setHours(parseInt(outHours), parseInt(outMinutes), 0, 0);

    attendance.punchOut = punchOut;
    attendance.punches.push({
      type: PUNCH_TYPE.OUT,
      time: punchOut,
      source: PUNCH_SOURCE.MANUAL,
      ipAddress: req.ip,
    });

    attendance.calculateTotalHours();
  }

  // Check if late/early exit
  if (employee.shift) {
    attendance.checkIfLate(employee.shift.startTime, employee.shift.graceMinutes);
    if (punchOutTime) {
      attendance.checkIfEarlyExit(employee.shift.endTime);
      attendance.checkIfHalfDay(employee.shift.halfDayHours);
    }
  }

  await attendance.save();

  // Audit log
  await auditLogService.logAttendance(AUDIT_ACTIONS.CREATE, req.userId, req.companyId, attendance._id, {
    employeeId,
    date: attendanceDate,
    isManual: true,
    reason,
  }, {
    ipAddress: req.ip,
  });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Manual attendance created successfully',
    data: { attendance },
  });
});

/**
 * @route   PUT /api/v1/attendance/:id
 * @desc    Update attendance record (HR/Admin only)
 * @access  Private (HR/Admin)
 */
exports.updateAttendance = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, remarks, punchInTime, punchOutTime } = req.body;

  const attendance = await Attendance.findById(id);
  if (!attendance) {
    return next(new AppError('Attendance record not found', HTTP_STATUS.NOT_FOUND));
  }

  const changes = {};

  if (status) {
    changes.status = { from: attendance.status, to: status };
    attendance.status = status;
  }

  if (remarks) {
    attendance.remarks = remarks;
  }

  if (punchInTime) {
    const oldPunchIn = attendance.punchIn;
    const newPunchIn = new Date(attendance.date);
    const [hours, minutes] = punchInTime.split(':');
    newPunchIn.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    changes.punchIn = { from: oldPunchIn, to: newPunchIn };
    attendance.punchIn = newPunchIn;
  }

  if (punchOutTime) {
    const oldPunchOut = attendance.punchOut;
    const newPunchOut = new Date(attendance.date);
    const [hours, minutes] = punchOutTime.split(':');
    newPunchOut.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    changes.punchOut = { from: oldPunchOut, to: newPunchOut };
    attendance.punchOut = newPunchOut;
  }

  // Recalculate if times changed
  if (punchInTime || punchOutTime) {
    attendance.calculateTotalHours();
    const employee = await Employee.findById(attendance.employee).populate('shift');
    if (employee && employee.shift) {
      if (punchInTime) attendance.checkIfLate(employee.shift.startTime, employee.shift.graceMinutes);
      if (punchOutTime) attendance.checkIfEarlyExit(employee.shift.endTime);
      attendance.checkIfHalfDay(employee.shift.halfDayHours);
    }
  }

  await attendance.save();

  // Audit log
  await auditLogService.logAttendance(AUDIT_ACTIONS.UPDATE, req.userId, req.companyId, attendance._id, changes, {
    ipAddress: req.ip,
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Attendance updated successfully',
    data: { attendance },
  });
});

/**
 * @route   GET /api/v1/attendance/summary
 * @desc    Get attendance summary for date range
 * @access  Private
 */
exports.getAttendanceSummary = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, employeeId } = req.query;
  const targetEmployeeId = employeeId || req.userId;

  // Ensure non-admins can only view their own summary
  if (targetEmployeeId !== req.userId.toString() && !['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(req.userRole)) {
    return next(new AppError('You can only view your own attendance summary', HTTP_STATUS.FORBIDDEN));
  }

  const start = startDate ? new Date(startDate) : getStartOfDay(new Date(new Date().setDate(1)));
  const end = endDate ? new Date(endDate) : getEndOfDay(new Date());

  const attendance = await Attendance.find({
    employee: targetEmployeeId,
    date: { $gte: start, $lte: end },
  });

  const summary = {
    totalDays: attendance.length,
    present: attendance.filter(a => a.status === ATTENDANCE_STATUS.PRESENT).length,
    absent: 0, // Would need to calculate business days minus present days
    wfh: attendance.filter(a => a.status === ATTENDANCE_STATUS.WFH).length,
    halfDay: attendance.filter(a => a.isHalfDay).length,
    onLeave: attendance.filter(a => a.status === ATTENDANCE_STATUS.ON_LEAVE).length,
    late: attendance.filter(a => a.isLate).length,
    earlyExit: attendance.filter(a => a.isEarlyExit).length,
    totalHours: attendance.reduce((sum, a) => sum + (a.totalHours || 0), 0),
    averageHours: 0,
  };

  summary.averageHours = summary.totalDays > 0
    ? parseFloat((summary.totalHours / summary.totalDays).toFixed(2))
    : 0;

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      period: { startDate: start, endDate: end },
      summary,
    },
  });
});

/**
 * @route   DELETE /api/v1/attendance/:id
 * @desc    Delete attendance record (Admin only)
 * @access  Private (Admin)
 */
exports.deleteAttendance = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const attendance = await Attendance.findById(id);
  if (!attendance) {
    return next(new AppError('Attendance record not found', HTTP_STATUS.NOT_FOUND));
  }

  await attendance.deleteOne();

  // Audit log
  await auditLogService.logAttendance(AUDIT_ACTIONS.DELETE, req.userId, req.companyId, id, {
    employeeId: attendance.employee,
    date: attendance.date,
  }, {
    ipAddress: req.ip,
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Attendance record deleted successfully',
  });
});

module.exports = exports;
