const mongoose = require('mongoose');

/**
 * Payslip Model
 * Monthly salary slip for employees
 */

const earningLineSchema = new mongoose.Schema({
  component: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  isProrated: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const deductionLineSchema = new mongoose.Schema({
  component: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

const payslipSchema = new mongoose.Schema({
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
  salaryStructure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalaryStructure',
  },

  // Period
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
    required: true,
  },
  payPeriodStart: Date,
  payPeriodEnd: Date,

  // Attendance Data
  workingDays: {
    type: Number,
    required: true,
  },
  presentDays: Number,
  absentDays: Number,
  paidLeaveDays: Number,
  unpaidLeaveDays: Number,
  weekendDays: Number,
  holidayDays: Number,
  paidDays: Number, // present + paidLeave

  // Earnings
  earnings: [earningLineSchema],
  grossSalary: {
    type: Number,
    required: true,
  },

  // Deductions
  deductions: [deductionLineSchema],
  totalDeductions: {
    type: Number,
    required: true,
    default: 0,
  },

  // Net Salary
  netSalary: {
    type: Number,
    required: true,
  },

  // Additional
  overtime: {
    hours: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
  },
  bonus: {
    type: Number,
    default: 0,
  },
  reimbursements: {
    type: Number,
    default: 0,
  },

  // Loan Deductions
  loanDeductions: [{
    loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
    amount: Number,
  }],

  // Tax Details
  taxDeducted: {
    type: Number,
    default: 0,
  },
  pfDeducted: {
    type: Number,
    default: 0,
  },
  esiDeducted: {
    type: Number,
    default: 0,
  },

  // Year-to-Date (YTD)
  ytd: {
    grossSalary: Number,
    deductions: Number,
    netSalary: Number,
    taxDeducted: Number,
  },

  // Status
  status: {
    type: String,
    enum: ['DRAFT', 'GENERATED', 'APPROVED', 'SENT', 'VIEWED', 'PAID'],
    default: 'DRAFT',
  },

  // Dates
  generatedDate: Date,
  approvedDate: Date,
  sentDate: Date,
  viewedDate: Date,
  paymentDate: Date,

  // Approval
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },

  // Payment
  paymentMode: {
    type: String,
    enum: ['BANK_TRANSFER', 'CHEQUE', 'CASH', 'UPI'],
  },
  paymentReference: String,

  // Notes
  remarks: String,
  internalNotes: String,

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },

}, {
  timestamps: true,
});

// Compound indexes
payslipSchema.index({ employee: 1, year: -1, month: -1 }, { unique: true });
payslipSchema.index({ company: 1, year: 1, month: 1 });
payslipSchema.index({ status: 1 });
payslipSchema.index({ paymentDate: 1 });

// Virtual for period display
payslipSchema.virtual('periodDisplay').get(function() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[this.month - 1]} ${this.year}`;
});

// Method to calculate net salary
payslipSchema.methods.calculateNetSalary = function() {
  const totalEarnings = this.earnings.reduce((sum, e) => sum + e.amount, 0);
  const totalDeductions = this.deductions.reduce((sum, d) => sum + d.amount, 0);

  this.grossSalary = totalEarnings + (this.bonus || 0) + (this.overtime?.amount || 0) + (this.reimbursements || 0);
  this.totalDeductions = totalDeductions;
  this.netSalary = this.grossSalary - this.totalDeductions;

  return this.netSalary;
};

// Method to mark as sent
payslipSchema.methods.markAsSent = function() {
  this.status = 'SENT';
  this.sentDate = new Date();
  return this.save();
};

// Method to mark as viewed
payslipSchema.methods.markAsViewed = function() {
  if (this.status === 'SENT') {
    this.status = 'VIEWED';
    this.viewedDate = new Date();
    return this.save();
  }
};

// Static method to generate payslip for employee
payslipSchema.statics.generateForEmployee = async function(employeeId, month, year) {
  // This would be implemented in the controller with business logic
  // Here we just create the structure
  const payslip = new this({
    employee: employeeId,
    month,
    year,
    status: 'DRAFT',
    generatedDate: new Date(),
  });

  return payslip;
};

// Static method to get payslip for period
payslipSchema.statics.getForPeriod = async function(employeeId, month, year) {
  return this.findOne({
    employee: employeeId,
    month,
    year,
  });
};

const Payslip = mongoose.model('Payslip', payslipSchema);

module.exports = Payslip;
