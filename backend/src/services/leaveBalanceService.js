const { Employee, LeaveRequest, LeaveType } = require('../models');
const { LEAVE_STATUS } = require('../config/constants');

/**
 * Leave Balance Service
 *
 * Handles leave balance calculation and management
 */

class LeaveBalanceService {
  /**
   * Initialize leave balance for a new employee
   */
  async initializeLeaveBalance(employeeId, companyId, dateOfJoining) {
    try {
      const employee = await Employee.findById(employeeId);
      if (!employee) throw new Error('Employee not found');

      // Get all active leave types for the company
      const leaveTypes = await LeaveType.find({
        company: companyId,
        isActive: true,
      });

      const leaveBalance = new Map();

      for (const leaveType of leaveTypes) {
        // Calculate pro-rated balance if employee joined mid-year
        const balance = this._calculateProRatedBalance(
          leaveType.yearlyQuota,
          dateOfJoining,
          leaveType.isAccrual,
          leaveType.accrualRate
        );

        leaveBalance.set(leaveType._id.toString(), balance);
      }

      employee.leaveBalance = leaveBalance;
      await employee.save();

      return leaveBalance;
    } catch (error) {
      console.error('Leave balance initialization error:', error);
      throw error;
    }
  }

  /**
   * Get employee leave balance
   */
  async getLeaveBalance(employeeId) {
    const employee = await Employee.findById(employeeId).populate('company');
    if (!employee) throw new Error('Employee not found');

    const leaveTypes = await LeaveType.find({
      company: employee.company._id,
      isActive: true,
    });

    const balanceData = [];

    for (const leaveType of leaveTypes) {
      const balance = employee.leaveBalance.get(leaveType._id.toString()) || 0;

      // Calculate used leaves
      const used = await this._getUsedLeaves(employeeId, leaveType._id);

      // Calculate pending leaves
      const pending = await this._getPendingLeaves(employeeId, leaveType._id);

      balanceData.push({
        leaveType: {
          id: leaveType._id,
          name: leaveType.name,
          code: leaveType.code,
          color: leaveType.color,
        },
        total: balance,
        used,
        pending,
        available: balance - used - pending,
      });
    }

    return balanceData;
  }

  /**
   * Deduct leave balance after approval
   */
  async deductLeaveBalance(employeeId, leaveTypeId, days) {
    const employee = await Employee.findById(employeeId);
    if (!employee) throw new Error('Employee not found');

    const currentBalance = employee.leaveBalance.get(leaveTypeId.toString()) || 0;
    const newBalance = currentBalance - days;

    if (newBalance < 0) {
      throw new Error('Insufficient leave balance');
    }

    employee.leaveBalance.set(leaveTypeId.toString(), newBalance);
    await employee.save();

    return newBalance;
  }

  /**
   * Restore leave balance after cancellation/rejection
   */
  async restoreLeaveBalance(employeeId, leaveTypeId, days) {
    const employee = await Employee.findById(employeeId);
    if (!employee) throw new Error('Employee not found');

    const currentBalance = employee.leaveBalance.get(leaveTypeId.toString()) || 0;
    const newBalance = currentBalance + days;

    employee.leaveBalance.set(leaveTypeId.toString(), newBalance);
    await employee.save();

    return newBalance;
  }

  /**
   * Check if employee has sufficient balance
   */
  async hasSufficientBalance(employeeId, leaveTypeId, requiredDays) {
    const employee = await Employee.findById(employeeId);
    if (!employee) throw new Error('Employee not found');

    const currentBalance = employee.leaveBalance.get(leaveTypeId.toString()) || 0;

    // Also subtract pending leave requests
    const pending = await this._getPendingLeaves(employeeId, leaveTypeId);

    const available = currentBalance - pending;

    return available >= requiredDays;
  }

  /**
   * Accrue leaves (to be run monthly via cron job)
   */
  async accrueLeaves(companyId) {
    try {
      const leaveTypes = await LeaveType.find({
        company: companyId,
        isActive: true,
        isAccrual: true,
      });

      const employees = await Employee.find({
        company: companyId,
        isActive: true,
      });

      for (const employee of employees) {
        for (const leaveType of leaveTypes) {
          const currentBalance = employee.leaveBalance.get(leaveType._id.toString()) || 0;
          const accrualAmount = leaveType.accrualRate || 0;

          // Don't exceed yearly quota
          const newBalance = Math.min(currentBalance + accrualAmount, leaveType.yearlyQuota);

          employee.leaveBalance.set(leaveType._id.toString(), newBalance);
        }

        await employee.save();
      }

      console.log(`✅ Accrued leaves for ${employees.length} employees in company ${companyId}`);
    } catch (error) {
      console.error('Leave accrual error:', error);
      throw error;
    }
  }

  /**
   * Reset yearly leave balances (to be run at year end)
   */
  async resetYearlyBalances(companyId) {
    try {
      const leaveTypes = await LeaveType.find({
        company: companyId,
        isActive: true,
      });

      const employees = await Employee.find({
        company: companyId,
        isActive: true,
      });

      for (const employee of employees) {
        for (const leaveType of leaveTypes) {
          let newBalance = leaveType.yearlyQuota;

          // Handle carry forward
          if (leaveType.isCarryForward) {
            const currentBalance = employee.leaveBalance.get(leaveType._id.toString()) || 0;
            const carryForward = Math.min(currentBalance, leaveType.maxCarryForward || 0);
            newBalance += carryForward;
          }

          employee.leaveBalance.set(leaveType._id.toString(), newBalance);
        }

        await employee.save();
      }

      console.log(`✅ Reset yearly balances for ${employees.length} employees`);
    } catch (error) {
      console.error('Yearly balance reset error:', error);
      throw error;
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  async _getUsedLeaves(employeeId, leaveTypeId) {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    const result = await LeaveRequest.aggregate([
      {
        $match: {
          employee: employeeId,
          leaveType: leaveTypeId,
          status: LEAVE_STATUS.APPROVED,
          fromDate: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalDays' },
        },
      },
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  async _getPendingLeaves(employeeId, leaveTypeId) {
    const result = await LeaveRequest.aggregate([
      {
        $match: {
          employee: employeeId,
          leaveType: leaveTypeId,
          status: LEAVE_STATUS.PENDING,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalDays' },
        },
      },
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  _calculateProRatedBalance(yearlyQuota, dateOfJoining, isAccrual, accrualRate) {
    if (isAccrual) {
      // For accrual leaves, start with 0 (will accrue monthly)
      return 0;
    }

    // For non-accrual, pro-rate based on joining month
    const joiningDate = new Date(dateOfJoining);
    const currentYear = new Date().getFullYear();
    const joiningYear = joiningDate.getFullYear();

    if (joiningYear < currentYear) {
      // Joined in previous year, give full quota
      return yearlyQuota;
    }

    // Pro-rate based on remaining months in the year
    const joiningMonth = joiningDate.getMonth();
    const remainingMonths = 12 - joiningMonth;
    const proRatedBalance = Math.floor((yearlyQuota / 12) * remainingMonths);

    return proRatedBalance;
  }
}

module.exports = new LeaveBalanceService();
