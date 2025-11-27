const mongoose = require('mongoose');
const { HOLIDAY_TYPES } = require('../config/constants');

const holidaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Holiday name is required'],
      trim: true,
      maxLength: 100,
    },
    date: {
      type: Date,
      required: [true, 'Holiday date is required'],
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(HOLIDAY_TYPES),
      default: HOLIDAY_TYPES.COMPANY,
    },
    description: {
      type: String,
      trim: true,
    },
    isOptional: {
      type: Boolean,
      default: false,
    },
    applicableTo: {
      type: [String],
      enum: ['ALL', 'DEPARTMENT', 'LOCATION'],
      default: ['ALL'],
    },
    departments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
holidaySchema.index({ company: 1, date: 1 });
holidaySchema.index({ date: 1, isActive: 1 });
holidaySchema.index({ company: 1, type: 1, date: 1 });

module.exports = mongoose.model('Holiday', holidaySchema);
