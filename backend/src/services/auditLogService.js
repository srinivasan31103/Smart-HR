const { AuditLog } = require('../models');
const { AUDIT_ACTIONS, AUDIT_MODULES } = require('../config/constants');

/**
 * Audit Log Service
 *
 * Centralized service for logging all critical actions in the system
 */

class AuditLogService {
  /**
   * Create an audit log entry
   * @param {Object} options
   * @param {string} options.module - Module name (e.g., 'EMPLOYEE', 'LEAVE')
   * @param {string} options.action - Action performed (e.g., 'CREATE', 'UPDATE')
   * @param {string} options.performedBy - Employee ID who performed the action
   * @param {string} options.companyId - Company ID
   * @param {string} options.targetEntity - Target entity type
   * @param {string} options.targetId - Target entity ID
   * @param {Object} options.changes - Before/after changes
   * @param {Object} options.metadata - Request metadata (IP, user agent, etc.)
   * @param {string} options.description - Human-readable description
   */
  async log(options) {
    try {
      const {
        module,
        action,
        performedBy,
        companyId,
        targetEntity,
        targetId,
        changes = {},
        metadata = {},
        description,
      } = options;

      const auditLog = await AuditLog.create({
        module,
        action,
        performedBy,
        company: companyId,
        targetEntity,
        targetId,
        changes,
        metadata,
        description,
      });

      return auditLog;
    } catch (error) {
      console.error('Audit log creation error:', error);
      // Don't throw - audit log failures shouldn't break the main operation
      return null;
    }
  }

  /**
   * Log authentication events
   */
  async logAuth(action, employeeId, companyId, metadata = {}) {
    return await this.log({
      module: AUDIT_MODULES.AUTH,
      action,
      performedBy: employeeId,
      companyId,
      metadata,
      description: `User ${action.toLowerCase()}`,
    });
  }

  /**
   * Log employee management events
   */
  async logEmployee(action, performedBy, companyId, targetId, changes = {}, metadata = {}) {
    return await this.log({
      module: AUDIT_MODULES.EMPLOYEE,
      action,
      performedBy,
      companyId,
      targetEntity: 'Employee',
      targetId,
      changes,
      metadata,
      description: `Employee ${action.toLowerCase()}`,
    });
  }

  /**
   * Log attendance events
   */
  async logAttendance(action, performedBy, companyId, targetId, changes = {}, metadata = {}) {
    return await this.log({
      module: AUDIT_MODULES.ATTENDANCE,
      action,
      performedBy,
      companyId,
      targetEntity: 'Attendance',
      targetId,
      changes,
      metadata,
      description: `Attendance ${action.toLowerCase()}`,
    });
  }

  /**
   * Log leave events
   */
  async logLeave(action, performedBy, companyId, targetId, changes = {}, metadata = {}) {
    return await this.log({
      module: AUDIT_MODULES.LEAVE,
      action,
      performedBy,
      companyId,
      targetEntity: 'LeaveRequest',
      targetId,
      changes,
      metadata,
      description: `Leave ${action.toLowerCase()}`,
    });
  }

  /**
   * Get audit logs with filters
   */
  async getLogs(filters = {}, options = {}) {
    const {
      companyId,
      performedBy,
      module,
      action,
      targetEntity,
      targetId,
      startDate,
      endDate,
    } = filters;

    const { page = 1, limit = 50, sort = { createdAt: -1 } } = options;

    const query = {};

    if (companyId) query.company = companyId;
    if (performedBy) query.performedBy = performedBy;
    if (module) query.module = module;
    if (action) query.action = action;
    if (targetEntity) query.targetEntity = targetEntity;
    if (targetId) query.targetId = targetId;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('performedBy', 'firstName lastName email employeeId')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await AuditLog.countDocuments(query);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get entity audit trail
   */
  async getEntityAuditTrail(targetEntity, targetId) {
    const logs = await AuditLog.find({
      targetEntity,
      targetId,
    })
      .populate('performedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return logs;
  }

  /**
   * Get user activity
   */
  async getUserActivity(employeeId, options = {}) {
    const { page = 1, limit = 50, startDate, endDate } = options;

    const query = { performedBy: employeeId };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await AuditLog.countDocuments(query);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Clean up old audit logs (data retention policy)
   */
  async cleanupOldLogs(daysToKeep = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await AuditLog.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    console.log(`🗑️  Deleted ${result.deletedCount} old audit logs`);
    return result;
  }
}

module.exports = new AuditLogService();
