const mongoose = require('mongoose');

/**
 * Salary Structure Model
 * Defines the salary components for an employee
 */

const salaryComponentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    // BASIC, HRA, DA, CONVEYANCE, MEDICAL, SPECIAL_ALLOWANCE, etc.
  },
  displayName: String,
  type: {
    type: String,
    required: true,
    enum: ['EARNING', 'DEDUCTION'],
  },
  calculationType: {
    type: String,
    required: true,
    enum: ['FIXED', 'PERCENTAGE_OF_BASIC', 'PERCENTAGE_OF_GROSS', 'PERCENTAGE_OF_CTC'],
  },
  value: {
    type: Number,
    required: true,
    min: 0,
  },
  isMonthly: {
    type: Boolean,
    default: true, // false for annual components like Bonus
  },
  isTaxable: {
    type: Boolean,
    default: true,
  },
  isStatutory: {
    type: Boolean,
    default: false, // PF, ESI are statutory
  },
  formula: String, // For complex calculations
  remarks: String,
}, { _id: false });

const salaryStructureSchema = new mongoose.Schema({
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

  effectiveFrom: {
    type: Date,
    required: true,
  },
  effectiveTo: Date,

  // Salary Breakup
  ctc: {
    type: Number,
    required: true,
    min: 0,
  },
  annualCtc: Number, // Same as CTC
  monthlyGross: Number,

  components: [salaryComponentSchema],

  // Calculated Fields
  totalEarnings: Number,
  totalDeductions: Number,
  netSalary: Number,

  // Tax Details
  taxRegime: {
    type: String,
    enum: ['OLD', 'NEW'],
    default: 'NEW',
  },
  declaredInvestments: Number,
  estimatedTax: Number,

  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'INACTIVE'],
    default: 'DRAFT',
  },

  // Approval
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  approvedDate: Date,
  approvalComments: String,

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },

  remarks: String,

}, {
  timestamps: true,
});

// Indexes
salaryStructureSchema.index({ employee: 1, effectiveFrom: -1 });
salaryStructureSchema.index({ company: 1, isActive: 1 });
salaryStructureSchema.index({ status: 1 });

// Pre-save middleware to calculate totals
salaryStructureSchema.pre('save', function(next) {
  let basic = 0;
  let gross = 0;
  let totalEarnings = 0;
  let totalDeductions = 0;

  // First pass: Calculate FIXED components and get basic
  this.components.forEach(component => {
    if (component.calculationType === 'FIXED') {
      if (component.type === 'EARNING') {
        totalEarnings += component.value;
        if (component.name === 'BASIC') {
          basic = component.value;
        }
      } else if (component.type === 'DEDUCTION') {
        totalDeductions += component.value;
      }
    }
  });

  // Second pass: Calculate percentage-based components
  this.components.forEach(component => {
    let calculatedValue = component.value;

    if (component.calculationType === 'PERCENTAGE_OF_BASIC') {
      calculatedValue = (basic * component.value) / 100;
    } else if (component.calculationType === 'PERCENTAGE_OF_GROSS') {
      calculatedValue = (gross * component.value) / 100;
    } else if (component.calculationType === 'PERCENTAGE_OF_CTC') {
      calculatedValue = (this.ctc * component.value) / 100;
    }

    if (component.calculationType !== 'FIXED') {
      if (component.type === 'EARNING') {
        totalEarnings += calculatedValue;
      } else if (component.type === 'DEDUCTION') {
        totalDeductions += calculatedValue;
      }
    }
  });

  this.totalEarnings = Math.round(totalEarnings);
  this.totalDeductions = Math.round(totalDeductions);
  this.monthlyGross = this.totalEarnings;
  this.netSalary = Math.round(this.totalEarnings - this.totalDeductions);
  this.annualCtc = this.ctc;

  next();
});

// Method to get component value
salaryStructureSchema.methods.getComponentValue = function(componentName) {
  const component = this.components.find(c => c.name === componentName);
  return component ? component.value : 0;
};

// Method to calculate actual component amount
salaryStructureSchema.methods.calculateComponentAmount = function(componentName) {
  const component = this.components.find(c => c.name === componentName);
  if (!component) return 0;

  const basic = this.getComponentValue('BASIC');
  const gross = this.monthlyGross || 0;

  switch (component.calculationType) {
    case 'FIXED':
      return component.value;
    case 'PERCENTAGE_OF_BASIC':
      return (basic * component.value) / 100;
    case 'PERCENTAGE_OF_GROSS':
      return (gross * component.value) / 100;
    case 'PERCENTAGE_OF_CTC':
      return (this.ctc * component.value) / 100 / 12; // Monthly
    default:
      return component.value;
  }
};

// Static method to get active salary structure for employee
salaryStructureSchema.statics.getActiveStructure = async function(employeeId, date = new Date()) {
  return this.findOne({
    employee: employeeId,
    isActive: true,
    effectiveFrom: { $lte: date },
    $or: [
      { effectiveTo: null },
      { effectiveTo: { $gte: date } }
    ]
  }).sort({ effectiveFrom: -1 });
};

const SalaryStructure = mongoose.model('SalaryStructure', salaryStructureSchema);

module.exports = SalaryStructure;
