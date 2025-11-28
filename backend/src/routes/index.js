const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const leaveRoutes = require('./leaveRoutes');

/**
 * Health Check Route
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart HR API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * Seed Database Route (TEMPORARY - remove after use)
 */
router.get('/seed', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const Company = require('../models/Company');
    const Department = require('../models/Department');
    const Designation = require('../models/Designation');
    const Employee = require('../models/Employee');
    const Shift = require('../models/Shift');

    const existingEmployees = await Employee.countDocuments();
    if (existingEmployees > 0) {
      return res.json({ success: true, message: 'Already seeded', count: existingEmployees });
    }

    const company = await Company.create({
      name: 'Acme Corporation', code: 'ACME', industry: 'Technology',
      email: 'info@acmecorp.com', phone: '+1-234-567-8900',
      address: { street: '123 Tech St', city: 'San Francisco', state: 'CA', country: 'USA', zipCode: '94102' },
      isActive: true, subscriptionPlan: 'PREMIUM', maxEmployees: 1000,
    });

    const depts = await Department.insertMany([
      { name: 'Engineering', code: 'ENG', company: company._id, isActive: true },
      { name: 'HR', code: 'HR', company: company._id, isActive: true },
    ]);

    const desigs = await Designation.insertMany([
      { title: 'Admin', code: 'ADMIN', company: company._id, level: 1, isActive: true },
      { title: 'Engineer', code: 'ENG', company: company._id, level: 3, isActive: true },
    ]);

    const shift = await Shift.create({
      name: 'General', code: 'GEN', company: company._id, type: 'FIXED',
      startTime: '09:00', endTime: '18:00', graceMinutes: 15,
      halfDayHours: 4, fullDayHours: 8, breakMinutes: 60, weeklyOffs: [0, 6], isActive: true,
    });

    const pwd = await bcrypt.hash('password123', 10);

    await Employee.insertMany([
      {
        email: 'admin@acme.com', password: pwd, employeeId: 'ACME001',
        firstName: 'Admin', lastName: 'User', dateOfBirth: new Date('1985-01-15'),
        gender: 'MALE', phone: '+1-234-567-8901', role: 'COMPANY_ADMIN', status: 'ACTIVE',
        company: company._id, department: depts[1]._id, designation: desigs[0]._id,
        dateOfJoining: new Date('2020-01-01'), employmentType: 'FULL_TIME',
        shift: shift._id, workLocation: 'OFFICE', isActive: true,
      },
      {
        email: 'john@acme.com', password: pwd, employeeId: 'ACME002',
        firstName: 'John', lastName: 'Doe', dateOfBirth: new Date('1992-03-25'),
        gender: 'MALE', phone: '+1-234-567-8902', role: 'EMPLOYEE', status: 'ACTIVE',
        company: company._id, department: depts[0]._id, designation: desigs[1]._id,
        dateOfJoining: new Date('2021-01-15'), employmentType: 'FULL_TIME',
        shift: shift._id, workLocation: 'OFFICE', isActive: true,
      },
    ]);

    res.json({
      success: true, message: 'Database seeded!',
      logins: [
        { email: 'admin@acme.com', password: 'password123' },
        { email: 'john@acme.com', password: 'password123' },
      ],
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Add Manager Route (one-time use)
 */
router.get('/add-manager', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const Employee = require('../models/Employee');
    const Company = require('../models/Company');
    const Department = require('../models/Department');
    const Designation = require('../models/Designation');
    const Shift = require('../models/Shift');

    const existing = await Employee.findOne({ email: 'manager@acme.com' });
    if (existing) {
      return res.json({ success: true, message: 'Manager already exists' });
    }

    const company = await Company.findOne({ code: 'ACME' });
    const dept = await Department.findOne({ code: 'ENG' });
    const shift = await Shift.findOne({ code: 'GEN' });

    const mgrDesig = await Designation.create({
      title: 'Manager', code: 'MGR', company: company._id, level: 2, isActive: true
    });

    const pwd = await bcrypt.hash('password123', 10);

    await Employee.create({
      email: 'manager@acme.com', password: pwd, employeeId: 'ACME003',
      firstName: 'Bob', lastName: 'Smith', dateOfBirth: new Date('1987-08-10'),
      gender: 'MALE', phone: '+1-234-567-8903', role: 'MANAGER', status: 'ACTIVE',
      company: company._id, department: dept._id, designation: mgrDesig._id,
      dateOfJoining: new Date('2020-06-01'), employmentType: 'FULL_TIME',
      shift: shift._id, workLocation: 'OFFICE', isActive: true,
    });

    res.json({
      success: true, message: 'Manager added!',
      login: { email: 'manager@acme.com', password: 'password123' },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * API Version Info
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart HR API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      attendance: '/api/v1/attendance',
      leaves: '/api/v1/leaves',
      health: '/api/v1/health',
      seed: '/api/v1/seed',
    },
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);

/**
 * 404 Handler
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
  });
});

module.exports = router;
