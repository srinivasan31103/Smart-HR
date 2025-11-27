const mongoose = require('mongoose');
const { LEAVE_STATUS } = require('../config/constants');

const approvalStageSchema = new mongoose.Schema(
  {
    level: {
      type: Number,
      required: true,
    },
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    approverRole: {
      type: String, // MANAGER, HR, ADMIN
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    comments: {
      type: String,
      trim: true,
    },
    actionAt: {
      type: Date,
    },
  },
  { _id: true }
);

const leaveRequestSchema = new mongoose.Schema(
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
    leaveType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: true,
    },
    fromDate: {
      type: Date,
      required: [true, 'From date is required'],
    },
    toDate: {
      type: Date,
      required: [true, 'To date is required'],
    },
    isHalfDay: {
      type: Boolean,
      default: false,
    },
    halfDayPeriod: {
      type: String,
      enum: ['FIRST_HALF', 'SECOND_HALF', null],
      default: null,
    },
    totalDays: {
      type: Number,
      required: true,
      min: 0.5,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      maxLength: 500,
    },
    status: {
      type: String,
      enum: Object.values(LEAVE_STATUS),
      default: LEAVE_STATUS.PENDING,
    },
    approvalChain: [approvalStageSchema],
    currentApprovalLevel: {
      type: Number,
      default: 1,
    },
    finalApprover: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    finalApprovedAt: {
      type: Date,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: Date,
      },
    ],
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
leaveRequestSchema.index({ employee: 1, status: 1 });
leaveRequestSchema.index({ company: 1, status: 1, fromDate: -1 });
leaveRequestSchema.index({ leaveType: 1, status: 1 });
leaveRequestSchema.index({ fromDate: 1, toDate: 1 });
leaveRequestSchema.index({ 'approvalChain.approver': 1, 'approvalChain.status': 1 });

// Validate date range
leaveRequestSchema.pre('save', function (next) {
  if (this.fromDate > this.toDate) {
    next(new Error('From date cannot be after to date'));
  }
  next();
});

// Method to calculate business days (excluding weekends)
leaveRequestSchema.methods.calculateBusinessDays = function (weeklyOffs = [0, 6]) {
  let count = 0;
  const currentDate = new Date(this.fromDate);
  const endDate = new Date(this.toDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (!weeklyOffs.includes(dayOfWeek)) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (this.isHalfDay) {
    return count - 0.5;
  }

  return count;
};

// Method to check if dates overlap with another leave
leaveRequestSchema.methods.checkOverlap = function (otherFromDate, otherToDate) {
  return (
    (this.fromDate <= otherToDate && this.toDate >= otherFromDate) ||
    (otherFromDate <= this.toDate && otherToDate >= this.fromDate)
  );
};

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
