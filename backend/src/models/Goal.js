const mongoose = require('mongoose');

/**
 * Goal Model (OKR/KPI)
 * For performance management and goal tracking
 */

const keyResultSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  targetValue: Number,
  currentValue: {
    type: Number,
    default: 0,
  },
  unit: String, // PERCENTAGE, NUMBER, CURRENCY, etc.
  completed: {
    type: Boolean,
    default: false,
  },
  completedDate: Date,
}, { _id: true, timestamps: true });

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  targetDate: Date,
  completed: {
    type: Boolean,
    default: false,
  },
  completedDate: Date,
  remarks: String,
}, { _id: true });

const goalSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },

  // Goal Details
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },

  // Goal Type
  type: {
    type: String,
    required: true,
    enum: ['INDIVIDUAL', 'TEAM', 'DEPARTMENT', 'COMPANY'],
    default: 'INDIVIDUAL',
  },
  category: {
    type: String,
    enum: ['OKR', 'KPI', 'SMART', 'PROJECT', 'DEVELOPMENT', 'OTHER'],
    default: 'OKR',
  },

  // Measurement
  measurementType: {
    type: String,
    enum: ['QUANTITATIVE', 'QUALITATIVE', 'BOOLEAN'],
    default: 'QUANTITATIVE',
  },
  targetValue: Number,
  currentValue: {
    type: Number,
    default: 0,
  },
  unit: String, // PERCENTAGE, NUMBER, CURRENCY, HOURS, etc.
  targetCriteria: String, // Description of completion criteria

  // Weightage & Priority
  weightage: {
    type: Number,
    min: 0,
    max: 100,
    default: 10,
  },
  priority: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM',
  },

  // Timeline
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  reviewFrequency: {
    type: String,
    enum: ['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY'],
    default: 'MONTHLY',
  },
  lastReviewedDate: Date,

  // Status
  status: {
    type: String,
    enum: ['DRAFT', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED', 'DEFERRED'],
    default: 'DRAFT',
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },

  // Key Results (for OKRs)
  keyResults: [keyResultSchema],

  // Milestones
  milestones: [milestoneSchema],

  // Alignment (linking goals)
  parentGoal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
  },
  alignedGoals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
  }],

  // Review Cycle
  reviewCycle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReviewCycle',
  },

  // Approval
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'COMPLETED', 'REJECTED'],
    default: 'DRAFT',
  },
  submittedDate: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  approvedDate: Date,
  rejectionReason: String,

  // Completion
  completedDate: Date,
  actualValue: Number,
  achievement: Number, // Percentage of target achieved
  completionRemarks: String,

  // Updates/Comments
  updates: [{
    date: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    progress: Number,
    currentValue: Number,
    comments: String,
  }],

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

  tags: [String],
  isArchived: {
    type: Boolean,
    default: false,
  },

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
goalSchema.index({ employee: 1, status: 1 });
goalSchema.index({ reviewCycle: 1 });
goalSchema.index({ startDate: 1, endDate: 1 });
goalSchema.index({ type: 1, category: 1 });
goalSchema.index({ parentGoal: 1 });

// Virtual for completion percentage
goalSchema.virtual('completionPercentage').get(function() {
  if (!this.targetValue || this.targetValue === 0) return 0;
  const percentage = (this.currentValue / this.targetValue) * 100;
  return Math.min(Math.round(percentage), 100);
});

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return null;
  const today = new Date();
  const end = new Date(this.endDate);
  const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  return diff;
});

// Virtual for is overdue
goalSchema.virtual('isOverdue').get(function() {
  if (this.status === 'COMPLETED') return false;
  return this.daysRemaining < 0;
});

// Pre-save middleware
goalSchema.pre('save', function(next) {
  // Auto-calculate progress from key results
  if (this.keyResults && this.keyResults.length > 0) {
    const completedKRs = this.keyResults.filter(kr => kr.completed).length;
    this.progress = Math.round((completedKRs / this.keyResults.length) * 100);
  } else if (this.targetValue && this.currentValue) {
    // Calculate from target vs current
    this.progress = Math.min(Math.round((this.currentValue / this.targetValue) * 100), 100);
  }

  // Auto-mark as completed if progress is 100%
  if (this.progress === 100 && this.status !== 'COMPLETED') {
    this.status = 'COMPLETED';
    this.completedDate = new Date();
  }

  next();
});

// Method to update progress
goalSchema.methods.updateProgress = function(newValue, comments, updatedBy) {
  this.currentValue = newValue;

  // Add to updates history
  this.updates.push({
    date: new Date(),
    updatedBy,
    progress: this.progress,
    currentValue: newValue,
    comments,
  });

  this.lastReviewedDate = new Date();
  this.updatedBy = updatedBy;

  return this.save();
};

// Method to complete goal
goalSchema.methods.complete = function(actualValue, remarks) {
  this.status = 'COMPLETED';
  this.completedDate = new Date();
  this.actualValue = actualValue || this.currentValue;

  if (this.targetValue) {
    this.achievement = Math.round((this.actualValue / this.targetValue) * 100);
  }

  this.completionRemarks = remarks;
  this.progress = 100;

  return this.save();
};

// Static method to get active goals for employee
goalSchema.statics.getActiveGoals = function(employeeId) {
  return this.find({
    employee: employeeId,
    status: { $in: ['ACTIVE', 'IN_PROGRESS'] },
    isArchived: false,
  }).sort({ priority: -1, endDate: 1 });
};

// Static method to get goals by review cycle
goalSchema.statics.getByReviewCycle = function(reviewCycleId) {
  return this.find({
    reviewCycle: reviewCycleId,
    isArchived: false,
  });
};

const Goal = mongoose.model('Goal', goalSchema);

module.exports = Goal;
