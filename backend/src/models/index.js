// Central export point for all models
module.exports = {
  Company: require('./Company'),
  Department: require('./Department'),
  Designation: require('./Designation'),
  Employee: require('./Employee'),
  Shift: require('./Shift'),
  Attendance: require('./Attendance'),
  LeaveType: require('./LeaveType'),
  LeaveRequest: require('./LeaveRequest'),
  Holiday: require('./Holiday'),
  AuditLog: require('./AuditLog'),
  Notification: require('./Notification'),
};
