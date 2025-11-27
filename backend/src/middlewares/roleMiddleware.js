const { ROLES, HTTP_STATUS } = require('../config/constants');

/**
 * Role-based Access Control Middleware
 *
 * Restricts access to routes based on user roles
 */

/**
 * Check if user has required role
 * @param  {...string} allowedRoles - Roles allowed to access the route
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to perform this action.',
      });
    }

    next();
  };
};

/**
 * Check if user is accessing their own resource
 * @param {string} paramName - Name of the param containing employee ID
 */
const authorizeOwnerOrAdmin = (paramName = 'employeeId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const targetEmployeeId = req.params[paramName] || req.body[paramName];

    // Admins can access any resource
    const isAdmin = [ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN].includes(req.user.role);

    // User can access their own resource
    const isOwner = targetEmployeeId && targetEmployeeId.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You can only access your own resources.',
      });
    }

    next();
  };
};

/**
 * Check if user is a manager of the target employee
 */
const authorizeManager = async (req, res, next) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  // Admins can access
  const isAdmin = [ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN].includes(req.user.role);
  if (isAdmin) return next();

  // Check if user is a manager
  if (req.user.role !== ROLES.MANAGER) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Manager access required.',
    });
  }

  // TODO: Add logic to verify if the manager is responsible for the target employee
  // This would require checking if the target employee's manager field matches req.user._id

  next();
};

/**
 * Check if user belongs to the same company
 */
const authorizeSameCompany = (req, res, next) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  // Super admin can access all companies
  if (req.user.role === ROLES.SUPER_ADMIN) {
    return next();
  }

  const targetCompanyId = req.params.companyId || req.body.companyId || req.query.companyId;

  if (targetCompanyId && targetCompanyId.toString() !== req.companyId.toString()) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Access denied. Company mismatch.',
    });
  }

  next();
};

module.exports = {
  authorize,
  requireRole: authorize, // Alias for backward compatibility
  authorizeOwnerOrAdmin,
  authorizeManager,
  authorizeSameCompany,
};
