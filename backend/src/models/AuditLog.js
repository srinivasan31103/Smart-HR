const mongoose = require('mongoose');
const { AUDIT_ACTIONS, AUDIT_MODULES } = require('../config/constants');

const auditLogSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      enum: Object.values(AUDIT_MODULES),
      required: true,
    },
    action: {
      type: String,
      enum: Object.values(AUDIT_ACTIONS),
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    targetEntity: {
      type: String, // Model name (e.g., 'Employee', 'LeaveRequest')
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId, // ID of the affected document
    },
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
      location: {
        latitude: Number,
        longitude: Number,
      },
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
auditLogSchema.index({ company: 1, createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ targetEntity: 1, targetId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
