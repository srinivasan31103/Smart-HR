const mongoose = require('mongoose');

const leaveTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Leave type name is required'],
      trim: true,
      maxLength: 50,
    },
    code: {
      type: String,
      required: [true, 'Leave type code is required'],
      uppercase: true,
      trim: true,
      maxLength: 20,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    yearlyQuota: {
      type: Number,
      required: [true, 'Yearly quota is required'],
      min: 0,
    },
    isPaid: {
      type: Boolean,
      default: true,
    },
    isCarryForward: {
      type: Boolean,
      default: false,
    },
    maxCarryForward: {
      type: Number,
      default: 0,
    },
    requiresApproval: {
      type: Boolean,
      default: true,
    },
    approvalLevels: {
      type: Number,
      default: 2, // Manager + HR
      min: 1,
      max: 3,
    },
    canApplyHalfDay: {
      type: Boolean,
      default: true,
    },
    minDaysNotice: {
      type: Number,
      default: 0, // Days in advance required
    },
    maxConsecutiveDays: {
      type: Number,
      default: null, // null = no limit
    },
    applicableFor: {
      type: [String],
      enum: ['ALL', 'MALE', 'FEMALE'],
      default: ['ALL'],
    },
    description: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: '#1976d2', // For calendar display
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Accrual settings (for earned leave, etc.)
    isAccrual: {
      type: Boolean,
      default: false,
    },
    accrualRate: {
      type: Number, // Leaves per month
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index
leaveTypeSchema.index({ code: 1, company: 1 }, { unique: true });
leaveTypeSchema.index({ company: 1, isActive: 1 });

module.exports = mongoose.model('LeaveType', leaveTypeSchema);
