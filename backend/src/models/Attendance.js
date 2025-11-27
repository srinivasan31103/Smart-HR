const mongoose = require('mongoose');
const { ATTENDANCE_STATUS, PUNCH_TYPE, PUNCH_SOURCE } = require('../config/constants');

const punchRecordSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(PUNCH_TYPE),
      required: true,
    },
    time: {
      type: Date,
      required: true,
    },
    source: {
      type: String,
      enum: Object.values(PUNCH_SOURCE),
      default: PUNCH_SOURCE.FACE,
    },
    ipAddress: String,
    location: {
      latitude: Number,
      longitude: Number,
    },
    faceConfidence: {
      type: Number, // 0-100
      min: 0,
      max: 100,
    },
    deviceInfo: {
      userAgent: String,
      browser: String,
      os: String,
    },
  },
  { _id: true }
);

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
    },
    status: {
      type: String,
      enum: Object.values(ATTENDANCE_STATUS),
      default: ATTENDANCE_STATUS.ABSENT,
    },
    punches: [punchRecordSchema],
    punchIn: {
      type: Date,
    },
    punchOut: {
      type: Date,
    },
    totalHours: {
      type: Number,
      default: 0,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    lateByMinutes: {
      type: Number,
      default: 0,
    },
    isEarlyExit: {
      type: Boolean,
      default: false,
    },
    earlyExitByMinutes: {
      type: Number,
      default: 0,
    },
    isWFH: {
      type: Boolean,
      default: false,
    },
    isHalfDay: {
      type: Boolean,
      default: false,
    },
    remarks: {
      type: String,
      trim: true,
    },
    // Manual correction fields
    isManualEntry: {
      type: Boolean,
      default: false,
    },
    manualEntryBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    manualEntryReason: {
      type: String,
      trim: true,
    },
    manualEntryAt: {
      type: Date,
    },
    // Leave reference (if on leave)
    leaveRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveRequest',
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index - one attendance record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ company: 1, date: 1 });
attendanceSchema.index({ employee: 1, date: -1 }); // For recent records
attendanceSchema.index({ status: 1, date: 1 });
attendanceSchema.index({ isLate: 1, date: 1 });

// Method to calculate total hours
attendanceSchema.methods.calculateTotalHours = function () {
  if (this.punchIn && this.punchOut) {
    const diff = this.punchOut - this.punchIn;
    this.totalHours = parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
  }
  return this.totalHours;
};

// Method to determine if late
attendanceSchema.methods.checkIfLate = function (shiftStartTime, graceMinutes = 15) {
  if (!this.punchIn || !shiftStartTime) return false;

  const [hours, minutes] = shiftStartTime.split(':').map(Number);
  const shiftStart = new Date(this.date);
  shiftStart.setHours(hours, minutes, 0, 0);

  const graceEnd = new Date(shiftStart.getTime() + graceMinutes * 60000);

  if (this.punchIn > graceEnd) {
    this.isLate = true;
    this.lateByMinutes = Math.floor((this.punchIn - shiftStart) / 60000);
  } else {
    this.isLate = false;
    this.lateByMinutes = 0;
  }

  return this.isLate;
};

// Method to determine if early exit
attendanceSchema.methods.checkIfEarlyExit = function (shiftEndTime) {
  if (!this.punchOut || !shiftEndTime) return false;

  const [hours, minutes] = shiftEndTime.split(':').map(Number);
  const shiftEnd = new Date(this.date);
  shiftEnd.setHours(hours, minutes, 0, 0);

  if (this.punchOut < shiftEnd) {
    this.isEarlyExit = true;
    this.earlyExitByMinutes = Math.floor((shiftEnd - this.punchOut) / 60000);
  } else {
    this.isEarlyExit = false;
    this.earlyExitByMinutes = 0;
  }

  return this.isEarlyExit;
};

// Method to determine if half day
attendanceSchema.methods.checkIfHalfDay = function (halfDayThreshold = 4) {
  this.calculateTotalHours();

  if (this.totalHours > 0 && this.totalHours < halfDayThreshold) {
    this.isHalfDay = true;
    this.status = ATTENDANCE_STATUS.HALF_DAY;
  } else {
    this.isHalfDay = false;
  }

  return this.isHalfDay;
};

module.exports = mongoose.model('Attendance', attendanceSchema);
