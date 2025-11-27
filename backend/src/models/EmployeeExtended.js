const mongoose = require('mongoose');

/**
 * Extended Employee Schema with Advanced Fields
 * This extends the basic Employee model with comprehensive HR data
 */

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  relationship: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  address: String,
  isPrimary: { type: Boolean, default: false },
}, { _id: false });

const familyMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  relationship: { type: String, required: true }, // SPOUSE, FATHER, MOTHER, SON, DAUGHTER, etc.
  dateOfBirth: Date,
  occupation: String,
  isDependent: { type: Boolean, default: false },
  isNominee: { type: Boolean, default: false },
}, { _id: false });

const educationSchema = new mongoose.Schema({
  degree: { type: String, required: true },
  institution: { type: String, required: true },
  fieldOfStudy: String,
  startYear: Number,
  endYear: Number,
  percentage: Number,
  grade: String,
  isHighestQualification: { type: Boolean, default: false },
}, { _id: false });

const experienceSchema = new mongoose.Schema({
  company: { type: String, required: true },
  designation: String,
  startDate: Date,
  endDate: Date,
  currentlyWorking: { type: Boolean, default: false },
  responsibilities: String,
  leavingReason: String,
}, { _id: false });

const documentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['AADHAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE', 'DEGREE', 'EXPERIENCE_LETTER',
           'RELIEVING_LETTER', 'SALARY_SLIP', 'BANK_STATEMENT', 'OFFER_LETTER', 'OTHER']
  },
  documentNumber: String,
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileSize: Number, // bytes
  mimeType: String,
  uploadedDate: { type: Date, default: Date.now },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  expiryDate: Date,
  status: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'],
    default: 'PENDING'
  },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  verifiedDate: Date,
  rejectionReason: String,
  remarks: String,
}, { timestamps: true });

const skillSchema = new mongoose.Schema({
  skillName: { type: String, required: true },
  category: {
    type: String,
    enum: ['TECHNICAL', 'SOFT_SKILL', 'DOMAIN', 'LANGUAGE', 'TOOL', 'OTHER'],
    default: 'TECHNICAL'
  },
  level: {
    type: String,
    enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'],
    default: 'INTERMEDIATE'
  },
  yearsOfExperience: Number,
  lastUsed: Date,
  isCertified: { type: Boolean, default: false },
  certificationDetails: String,
}, { _id: false });

const onboardingTaskSchema = new mongoose.Schema({
  task: { type: String, required: true },
  description: String,
  category: {
    type: String,
    enum: ['DOCUMENTATION', 'IT_SETUP', 'TRAINING', 'COMPLIANCE', 'ORIENTATION', 'OTHER'],
    default: 'OTHER'
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  dueDate: Date,
  completed: { type: Boolean, default: false },
  completedDate: Date,
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  remarks: String,
}, { _id: false });

const bankDetailsSchema = new mongoose.Schema({
  bankName: String,
  accountNumber: String,
  ifscCode: String,
  branchName: String,
  accountHolderName: String,
  accountType: {
    type: String,
    enum: ['SAVINGS', 'CURRENT', 'SALARY'],
    default: 'SAVINGS'
  },
  isPrimary: { type: Boolean, default: true },
}, { _id: false });

const employeeExtendedSchema = new mongoose.Schema({
  // Reference to base employee (if using composition pattern)
  // baseEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },

  // Personal Information (Extended)
  middleName: String,
  gender: {
    type: String,
    enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'],
  },
  maritalStatus: {
    type: String,
    enum: ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED'],
  },
  nationality: { type: String, default: 'Indian' },
  religion: String,
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },

  // Contact Information (Extended)
  personalEmail: {
    type: String,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  alternatePhone: String,
  permanentAddress: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    country: { type: String, default: 'India' },
    pincode: String,
  },
  currentAddress: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    country: { type: String, default: 'India' },
    pincode: String,
    sameAsPermanent: { type: Boolean, default: false },
  },

  // Emergency Contacts
  emergencyContacts: [emergencyContactSchema],

  // Family Information
  familyMembers: [familyMemberSchema],

  // Education
  education: [educationSchema],
  highestQualification: String,

  // Work Experience (previous employers)
  previousExperience: [experienceSchema],
  totalExperienceYears: { type: Number, default: 0 },

  // Employment Details (Extended)
  employmentType: {
    type: String,
    enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'CONSULTANT', 'TEMPORARY'],
    default: 'FULL_TIME'
  },
  probationPeriodMonths: { type: Number, default: 6 },
  probationEndDate: Date,
  confirmationDate: Date,
  isConfirmed: { type: Boolean, default: false },
  noticePeriodDays: { type: Number, default: 30 },
  previousEmployer: String,

  // Reporting Structure
  reportingManager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  functionalManager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },

  // Bank & Statutory Details
  bankDetails: [bankDetailsSchema],
  panNumber: { type: String, uppercase: true },
  aadharNumber: String,
  pfNumber: String,
  esiNumber: String,
  uanNumber: String,

  // Documents
  documents: [documentSchema],

  // Skills
  skills: [skillSchema],

  // Onboarding
  onboardingStatus: {
    type: String,
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
    default: 'NOT_STARTED'
  },
  onboardingStartDate: Date,
  onboardingCompletionDate: Date,
  onboardingTasks: [onboardingTaskSchema],
  buddy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }, // Onboarding buddy

  // Offboarding
  exitDate: Date,
  exitReason: {
    type: String,
    enum: ['RESIGNATION', 'TERMINATION', 'RETIREMENT', 'END_OF_CONTRACT', 'OTHER'],
  },
  exitRemarks: String,
  rehireEligible: { type: Boolean, default: true },
  finalSettlementDate: Date,
  clearanceStatus: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
  },

  // Additional Metadata
  profilePhotoUrl: String,
  linkedinUrl: String,
  githubUrl: String,
  portfolioUrl: String,

  // System Fields
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
employeeExtendedSchema.index({ panNumber: 1 }, { sparse: true });
employeeExtendedSchema.index({ aadharNumber: 1 }, { sparse: true });
employeeExtendedSchema.index({ employmentType: 1 });
employeeExtendedSchema.index({ onboardingStatus: 1 });
employeeExtendedSchema.index({ exitDate: 1 }, { sparse: true });

// Virtual for full name
employeeExtendedSchema.virtual('fullName').get(function() {
  if (this.middleName) {
    return `${this.firstName} ${this.middleName} ${this.lastName}`;
  }
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age (if dateOfBirth exists in base schema)
employeeExtendedSchema.virtual('age').get(function() {
  if (this.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
  return null;
});

// Method to check if probation is active
employeeExtendedSchema.methods.isProbationActive = function() {
  if (!this.probationEndDate) return false;
  return new Date() < new Date(this.probationEndDate);
};

// Method to calculate tenure
employeeExtendedSchema.methods.getTenure = function() {
  if (!this.dateOfJoining) return { years: 0, months: 0, days: 0 };

  const joiningDate = new Date(this.dateOfJoining);
  const today = new Date();

  let years = today.getFullYear() - joiningDate.getFullYear();
  let months = today.getMonth() - joiningDate.getMonth();
  let days = today.getDate() - joiningDate.getDate();

  if (days < 0) {
    months--;
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days };
};

// Method to get primary emergency contact
employeeExtendedSchema.methods.getPrimaryEmergencyContact = function() {
  return this.emergencyContacts.find(contact => contact.isPrimary) || this.emergencyContacts[0];
};

// Method to get primary bank account
employeeExtendedSchema.methods.getPrimaryBankAccount = function() {
  return this.bankDetails.find(bank => bank.isPrimary) || this.bankDetails[0];
};

// Static method to find employees by skill
employeeExtendedSchema.statics.findBySkill = function(skillName, minLevel = 'BEGINNER') {
  const levelOrder = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
  const minLevelIndex = levelOrder.indexOf(minLevel);

  return this.find({
    'skills': {
      $elemMatch: {
        skillName: { $regex: new RegExp(skillName, 'i') },
        level: { $in: levelOrder.slice(minLevelIndex) }
      }
    },
    isActive: true
  });
};

// Pre-save middleware
employeeExtendedSchema.pre('save', function(next) {
  // Set probation end date if not set
  if (this.isNew && this.dateOfJoining && !this.probationEndDate) {
    const endDate = new Date(this.dateOfJoining);
    endDate.setMonth(endDate.getMonth() + this.probationPeriodMonths);
    this.probationEndDate = endDate;
  }

  // Sync current address with permanent if flag is set
  if (this.currentAddress && this.currentAddress.sameAsPermanent && this.permanentAddress) {
    this.currentAddress = {
      ...this.permanentAddress,
      sameAsPermanent: true
    };
  }

  next();
});

const EmployeeExtended = mongoose.model('EmployeeExtended', employeeExtendedSchema);

module.exports = EmployeeExtended;
