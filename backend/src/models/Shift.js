const mongoose = require('mongoose');
const { SHIFT_TYPES } = require('../config/constants');

const shiftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Shift name is required'],
      trim: true,
      maxLength: 50,
    },
    code: {
      type: String,
      required: [true, 'Shift code is required'],
      uppercase: true,
      trim: true,
      maxLength: 20,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(SHIFT_TYPES),
      default: SHIFT_TYPES.FIXED,
    },
    startTime: {
      type: String, // Format: "HH:MM" (24-hour)
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String, // Format: "HH:MM" (24-hour)
      required: [true, 'End time is required'],
    },
    graceMinutes: {
      type: Number,
      default: 15,
    },
    lateMarkThreshold: {
      type: Number,
      default: 15,
    },
    halfDayHours: {
      type: Number,
      default: 4,
    },
    fullDayHours: {
      type: Number,
      default: 8,
    },
    breakMinutes: {
      type: Number,
      default: 60,
    },
    weeklyOffs: {
      type: [Number], // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      default: [0], // Sunday by default
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index
shiftSchema.index({ code: 1, company: 1 }, { unique: true });
shiftSchema.index({ company: 1, isActive: 1 });

module.exports = mongoose.model('Shift', shiftSchema);
