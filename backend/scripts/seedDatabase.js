/**
 * Smart HR Database Seed Script
 *
 * This script creates demo data including:
 * - 1 Company
 * - 3 Departments
 * - 4 Designations
 * - 2 Shifts
 * - 5 Demo Users (Super Admin, Admin, Manager, 2 Employees)
 * - 3 Leave Types
 * - 2 Holidays
 *
 * Run: node scripts/seedDatabase.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const Company = require('../src/models/Company');
const Department = require('../src/models/Department');
const Designation = require('../src/models/Designation');
const Employee = require('../src/models/Employee');
const Shift = require('../src/models/Shift');
const LeaveType = require('../src/models/LeaveType');
const Holiday = require('../src/models/Holiday');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Hash password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Clear existing data
const clearDatabase = async () => {
  console.log('🗑️  Clearing existing data...');

  await Company.deleteMany({});
  await Department.deleteMany({});
  await Designation.deleteMany({});
  await Employee.deleteMany({});
  await Shift.deleteMany({});
  await LeaveType.deleteMany({});
  await Holiday.deleteMany({});

  console.log('✅ Database cleared');
};

// Seed data
const seedData = async () => {
  try {
    await connectDB();
    await clearDatabase();

    console.log('🌱 Seeding database...\n');

    // ==================== CREATE COMPANY ====================
    console.log('📋 Creating company...');
    const company = await Company.create({
      name: 'Acme Corporation',
      code: 'ACME',
      industry: 'Technology',
      email: 'info@acmecorp.com',
      phone: '+1-234-567-8900',
      address: {
        street: '123 Tech Street',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        zipCode: '94102',
      },
      settings: {
        attendanceRules: {
          graceMinutes: 15,
          lateMarkThreshold: 15,
          halfDayHours: 4,
          fullDayHours: 8,
          maxWFHPerMonth: 10,
        },
      },
      isActive: true,
      subscriptionPlan: 'PREMIUM',
      maxEmployees: 1000,
    });
    console.log(`✅ Company created: ${company.name} (${company.code})`);

    // ==================== CREATE DEPARTMENTS ====================
    console.log('\n📁 Creating departments...');
    const departments = await Department.insertMany([
      {
        name: 'Engineering',
        code: 'ENG',
        company: company._id,
        description: 'Software Development Team',
        isActive: true,
      },
      {
        name: 'Human Resources',
        code: 'HR',
        company: company._id,
        description: 'HR and Admin Team',
        isActive: true,
      },
      {
        name: 'Sales',
        code: 'SALES',
        company: company._id,
        description: 'Sales and Marketing Team',
        isActive: true,
      },
    ]);
    console.log(`✅ Created ${departments.length} departments`);

    // ==================== CREATE DESIGNATIONS ====================
    console.log('\n👔 Creating designations...');
    const designations = await Designation.insertMany([
      {
        title: 'CEO',
        code: 'CEO',
        company: company._id,
        level: 1,
        isActive: true,
      },
      {
        title: 'HR Manager',
        code: 'HR_MGR',
        company: company._id,
        department: departments[1]._id,
        level: 2,
        isActive: true,
      },
      {
        title: 'Engineering Manager',
        code: 'ENG_MGR',
        company: company._id,
        department: departments[0]._id,
        level: 2,
        isActive: true,
      },
      {
        title: 'Software Engineer',
        code: 'SE',
        company: company._id,
        department: departments[0]._id,
        level: 3,
        isActive: true,
      },
    ]);
    console.log(`✅ Created ${designations.length} designations`);

    // ==================== CREATE SHIFTS ====================
    console.log('\n⏰ Creating shifts...');
    const shifts = await Shift.insertMany([
      {
        name: 'General Shift',
        code: 'GEN',
        company: company._id,
        type: 'FIXED',
        startTime: '09:00',
        endTime: '18:00',
        graceMinutes: 15,
        lateMarkThreshold: 15,
        halfDayHours: 4,
        fullDayHours: 8,
        breakMinutes: 60,
        weeklyOffs: [0, 6], // Sunday, Saturday
        isActive: true,
      },
      {
        name: 'Early Shift',
        code: 'EARLY',
        company: company._id,
        type: 'FIXED',
        startTime: '07:00',
        endTime: '16:00',
        graceMinutes: 10,
        lateMarkThreshold: 10,
        halfDayHours: 4,
        fullDayHours: 8,
        breakMinutes: 60,
        weeklyOffs: [0, 6],
        isActive: true,
      },
    ]);
    console.log(`✅ Created ${shifts.length} shifts`);

    // ==================== CREATE EMPLOYEES ====================
    console.log('\n👥 Creating employees...');

    // Hash passwords
    const password = await hashPassword('password123');

    const employees = await Employee.insertMany([
      // 1. Super Admin
      {
        email: 'superadmin@acme.com',
        password: password,
        employeeId: 'ACME001',
        firstName: 'Super',
        lastName: 'Admin',
        dateOfBirth: new Date('1985-01-15'),
        gender: 'MALE',
        phone: '+1-234-567-8901',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        company: company._id,
        department: departments[1]._id, // HR
        designation: designations[0]._id, // CEO
        dateOfJoining: new Date('2020-01-01'),
        employmentType: 'FULL_TIME',
        shift: shifts[0]._id,
        workLocation: 'OFFICE',
        leaveBalance: {
          [new mongoose.Types.ObjectId()]: 12, // Will set up properly with leave types
        },
        faceData: {
          isRegistered: false,
        },
        isActive: true,
      },

      // 2. Company Admin (HR Manager)
      {
        email: 'admin@acme.com',
        password: password,
        employeeId: 'ACME002',
        firstName: 'Alice',
        lastName: 'Johnson',
        dateOfBirth: new Date('1988-05-20'),
        gender: 'FEMALE',
        phone: '+1-234-567-8902',
        role: 'COMPANY_ADMIN',
        status: 'ACTIVE',
        company: company._id,
        department: departments[1]._id, // HR
        designation: designations[1]._id, // HR Manager
        dateOfJoining: new Date('2020-03-01'),
        employmentType: 'FULL_TIME',
        shift: shifts[0]._id,
        workLocation: 'OFFICE',
        leaveBalance: {},
        faceData: {
          isRegistered: false,
        },
        isActive: true,
      },

      // 3. Manager (Engineering)
      {
        email: 'manager@acme.com',
        password: password,
        employeeId: 'ACME003',
        firstName: 'Bob',
        lastName: 'Smith',
        dateOfBirth: new Date('1987-08-10'),
        gender: 'MALE',
        phone: '+1-234-567-8903',
        role: 'MANAGER',
        status: 'ACTIVE',
        company: company._id,
        department: departments[0]._id, // Engineering
        designation: designations[2]._id, // Engineering Manager
        dateOfJoining: new Date('2020-06-01'),
        employmentType: 'FULL_TIME',
        shift: shifts[0]._id,
        workLocation: 'HYBRID',
        leaveBalance: {},
        faceData: {
          isRegistered: false,
        },
        isActive: true,
      },

      // 4. Employee 1 (Software Engineer)
      {
        email: 'john@acme.com',
        password: password,
        employeeId: 'ACME004',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1992-03-25'),
        gender: 'MALE',
        phone: '+1-234-567-8904',
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        company: company._id,
        department: departments[0]._id, // Engineering
        designation: designations[3]._id, // Software Engineer
        manager: null, // Will be set to Bob Smith's ID
        dateOfJoining: new Date('2021-01-15'),
        employmentType: 'FULL_TIME',
        shift: shifts[0]._id,
        workLocation: 'OFFICE',
        leaveBalance: {},
        faceData: {
          isRegistered: false,
        },
        isActive: true,
      },

      // 5. Employee 2 (Software Engineer)
      {
        email: 'jane@acme.com',
        password: password,
        employeeId: 'ACME005',
        firstName: 'Jane',
        lastName: 'Williams',
        dateOfBirth: new Date('1993-07-14'),
        gender: 'FEMALE',
        phone: '+1-234-567-8905',
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        company: company._id,
        department: departments[0]._id, // Engineering
        designation: designations[3]._id, // Software Engineer
        manager: null, // Will be set to Bob Smith's ID
        dateOfJoining: new Date('2021-03-01'),
        employmentType: 'FULL_TIME',
        shift: shifts[0]._id,
        workLocation: 'REMOTE',
        leaveBalance: {},
        faceData: {
          isRegistered: false,
        },
        isActive: true,
      },
    ]);

    // Update manager references
    const manager = employees[2]; // Bob Smith
    await Employee.updateMany(
      { employeeId: { $in: ['ACME004', 'ACME005'] } },
      { manager: manager._id }
    );

    console.log(`✅ Created ${employees.length} employees`);

    // ==================== CREATE LEAVE TYPES ====================
    console.log('\n🏖️  Creating leave types...');
    const leaveTypes = await LeaveType.insertMany([
      {
        name: 'Casual Leave',
        code: 'CL',
        company: company._id,
        yearlyQuota: 12,
        isPaid: true,
        isCarryForward: true,
        maxCarryForward: 5,
        requiresApproval: true,
        approvalLevels: 2,
        canApplyHalfDay: true,
        minDaysNotice: 0,
        maxConsecutiveDays: 5,
        applicableFor: ['ALL'],
        color: '#4caf50',
        isActive: true,
      },
      {
        name: 'Sick Leave',
        code: 'SL',
        company: company._id,
        yearlyQuota: 10,
        isPaid: true,
        isCarryForward: false,
        maxCarryForward: 0,
        requiresApproval: true,
        approvalLevels: 1,
        canApplyHalfDay: true,
        minDaysNotice: 0,
        maxConsecutiveDays: null,
        applicableFor: ['ALL'],
        color: '#f44336',
        isActive: true,
      },
      {
        name: 'Earned Leave',
        code: 'EL',
        company: company._id,
        yearlyQuota: 15,
        isPaid: true,
        isCarryForward: true,
        maxCarryForward: 15,
        requiresApproval: true,
        approvalLevels: 2,
        canApplyHalfDay: false,
        minDaysNotice: 7,
        maxConsecutiveDays: null,
        applicableFor: ['ALL'],
        isAccrual: true,
        accrualRate: 1.25, // 1.25 days per month
        color: '#2196f3',
        isActive: true,
      },
    ]);
    console.log(`✅ Created ${leaveTypes.length} leave types`);

    // Update employee leave balances
    const leaveBalanceMap = {};
    leaveTypes.forEach(lt => {
      leaveBalanceMap[lt._id.toString()] = lt.yearlyQuota;
    });

    await Employee.updateMany(
      {},
      { leaveBalance: leaveBalanceMap }
    );
    console.log('✅ Updated employee leave balances');

    // ==================== CREATE HOLIDAYS ====================
    console.log('\n🎉 Creating holidays...');
    const currentYear = new Date().getFullYear();
    const holidays = await Holiday.insertMany([
      {
        name: 'New Year',
        date: new Date(`${currentYear}-01-01`),
        company: company._id,
        type: 'NATIONAL',
        description: 'New Year Day',
        isOptional: false,
        applicableTo: ['ALL'],
        isActive: true,
      },
      {
        name: 'Independence Day',
        date: new Date(`${currentYear}-07-04`),
        company: company._id,
        type: 'NATIONAL',
        description: 'Independence Day',
        isOptional: false,
        applicableTo: ['ALL'],
        isActive: true,
      },
    ]);
    console.log(`✅ Created ${holidays.length} holidays`);

    // ==================== SUMMARY ====================
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📊 SUMMARY:');
    console.log(`   Companies: 1`);
    console.log(`   Departments: ${departments.length}`);
    console.log(`   Designations: ${designations.length}`);
    console.log(`   Shifts: ${shifts.length}`);
    console.log(`   Employees: ${employees.length}`);
    console.log(`   Leave Types: ${leaveTypes.length}`);
    console.log(`   Holidays: ${holidays.length}`);

    console.log('\n🔐 DEMO LOGIN CREDENTIALS:');
    console.log('='.repeat(60));
    console.log('\n1️⃣  SUPER ADMIN');
    console.log('   Email:    superadmin@acme.com');
    console.log('   Password: password123');
    console.log('   Role:     Full system access');

    console.log('\n2️⃣  COMPANY ADMIN (HR Manager)');
    console.log('   Email:    admin@acme.com');
    console.log('   Password: password123');
    console.log('   Role:     HR, can manage all employees & leaves');

    console.log('\n3️⃣  MANAGER (Engineering)');
    console.log('   Email:    manager@acme.com');
    console.log('   Password: password123');
    console.log('   Role:     Can approve team leaves');

    console.log('\n4️⃣  EMPLOYEE 1');
    console.log('   Email:    john@acme.com');
    console.log('   Password: password123');
    console.log('   Role:     Regular employee');

    console.log('\n5️⃣  EMPLOYEE 2');
    console.log('   Email:    jane@acme.com');
    console.log('   Password: password123');
    console.log('   Role:     Regular employee (Remote)');

    console.log('\n' + '='.repeat(60));
    console.log('✅ You can now login at: http://localhost:3000');
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed
seedData();
