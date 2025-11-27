const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxLength: 100,
    },
    code: {
      type: String,
      required: [true, 'Company code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxLength: 20,
    },
    logo: {
      type: String,
      default: null,
    },
    industry: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    settings: {
      allowedIPs: [String],
      geoFence: {
        latitude: Number,
        longitude: Number,
        radius: Number, // in meters
      },
      attendanceRules: {
        graceMinutes: { type: Number, default: 15 },
        lateMarkThreshold: { type: Number, default: 15 },
        halfDayHours: { type: Number, default: 4 },
        fullDayHours: { type: Number, default: 8 },
        maxWFHPerMonth: { type: Number, default: 10 },
      },
      leaveRules: {
        maxCarryForward: { type: Number, default: 5 },
        leaveAccrual: { type: Boolean, default: false },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    subscriptionPlan: {
      type: String,
      enum: ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'],
      default: 'FREE',
    },
    subscriptionExpiry: {
      type: Date,
    },
    maxEmployees: {
      type: Number,
      default: 50,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
companySchema.index({ code: 1 });
companySchema.index({ name: 1 });
companySchema.index({ isActive: 1 });

module.exports = mongoose.model('Company', companySchema);
