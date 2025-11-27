const mongoose = require('mongoose');
const { NOTIFICATION_TYPES, NOTIFICATION_EVENTS } = require('../config/constants');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
    },
    event: {
      type: String,
      enum: Object.values(NOTIFICATION_EVENTS),
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED', 'READ'],
      default: 'PENDING',
    },
    sentAt: {
      type: Date,
    },
    readAt: {
      type: Date,
    },
    failureReason: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    relatedEntity: {
      entityType: String, // 'LeaveRequest', 'Attendance', etc.
      entityId: mongoose.Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ recipient: 1, status: 1, createdAt: -1 });
notificationSchema.index({ company: 1, status: 1 });
notificationSchema.index({ type: 1, status: 1 });
notificationSchema.index({ event: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
