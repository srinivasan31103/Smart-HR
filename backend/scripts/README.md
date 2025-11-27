# Database Seed Script

## Overview
This script populates your MongoDB database with demo data for testing the Smart HR system.

## What Gets Created

### 1 Company
- **Name:** Acme Corporation
- **Code:** ACME
- **Industry:** Technology
- **Location:** San Francisco, CA

### 3 Departments
- Engineering
- Human Resources
- Sales

### 4 Designations
- CEO (Level 1)
- HR Manager (Level 2)
- Engineering Manager (Level 2)
- Software Engineer (Level 3)

### 2 Shifts
- **General Shift:** 9:00 AM - 6:00 PM
- **Early Shift:** 7:00 AM - 4:00 PM

### 5 Demo Users
All users have the same password: `password123`

| Email | Role | Department | Designation | Access Level |
|-------|------|------------|-------------|--------------|
| superadmin@acme.com | SUPER_ADMIN | HR | CEO | Full system access |
| admin@acme.com | COMPANY_ADMIN | HR | HR Manager | Manage employees & leaves |
| manager@acme.com | MANAGER | Engineering | Engineering Manager | Approve team leaves |
| john@acme.com | EMPLOYEE | Engineering | Software Engineer | Regular employee |
| jane@acme.com | EMPLOYEE | Engineering | Software Engineer | Remote employee |

### 3 Leave Types
- **Casual Leave:** 12 days/year, carry forward up to 5 days
- **Sick Leave:** 10 days/year, no carry forward
- **Earned Leave:** 15 days/year, carry forward up to 15 days (accrual-based)

### 2 Holidays
- New Year (January 1)
- Independence Day (July 4)

## How to Run

### Prerequisites
1. MongoDB must be running
2. Backend dependencies must be installed (`npm install`)
3. `.env` file must be configured with `MONGODB_URI`

### Run the Seed Script

```bash
# Navigate to backend directory
cd backend

# Run the seed script
node scripts/seedDatabase.js
```

### Expected Output

```
✅ MongoDB Connected
🗑️  Clearing existing data...
✅ Database cleared
🌱 Seeding database...

📋 Creating company...
✅ Company created: Acme Corporation (ACME)

📁 Creating departments...
✅ Created 3 departments

👔 Creating designations...
✅ Created 4 designations

⏰ Creating shifts...
✅ Created 2 shifts

👥 Creating employees...
✅ Created 5 employees

🏖️  Creating leave types...
✅ Created 3 leave types
✅ Updated employee leave balances

🎉 Creating holidays...
✅ Created 2 holidays

============================================================
🎉 DATABASE SEEDED SUCCESSFULLY!
============================================================

📊 SUMMARY:
   Companies: 1
   Departments: 3
   Designations: 4
   Shifts: 2
   Employees: 5
   Leave Types: 3
   Holidays: 2

🔐 DEMO LOGIN CREDENTIALS:
============================================================

1️⃣  SUPER ADMIN
   Email:    superadmin@acme.com
   Password: password123
   Role:     Full system access

2️⃣  COMPANY ADMIN (HR Manager)
   Email:    admin@acme.com
   Password: password123
   Role:     HR, can manage all employees & leaves

3️⃣  MANAGER (Engineering)
   Email:    manager@acme.com
   Password: password123
   Role:     Can approve team leaves

4️⃣  EMPLOYEE 1
   Email:    john@acme.com
   Password: password123
   Role:     Regular employee

5️⃣  EMPLOYEE 2
   Email:    jane@acme.com
   Password: password123
   Role:     Regular employee (Remote)

============================================================
✅ You can now login at: http://localhost:3000
============================================================
```

## Important Notes

⚠️ **WARNING:** This script will **DELETE ALL EXISTING DATA** in your database before seeding new data.

- The script calls `deleteMany({})` on all collections
- Use this only for development/testing
- **NEVER run this on a production database**

## Test Different Roles

### Test as Super Admin
```
Email: superadmin@acme.com
Password: password123
```
- Can access all features
- Can manage companies, departments, employees
- Can view all attendance and leave records

### Test as Company Admin (HR)
```
Email: admin@acme.com
Password: password123
```
- Can manage all employees in the company
- Can approve/reject all leave requests
- Can view all attendance records
- Can configure leave types and holidays

### Test as Manager
```
Email: manager@acme.com
Password: password123
```
- Can approve leave requests for team members (John and Jane)
- Can view team attendance
- Limited access to company-wide data

### Test as Employee
```
Email: john@acme.com (or jane@acme.com)
Password: password123
```
- Can punch in/out with face recognition
- Can apply for leaves
- Can view own attendance and leave history
- Cannot approve leaves or access other employee data

## Customization

To customize the demo data, edit `seedDatabase.js`:

### Change Company Details
```javascript
const company = await Company.create({
  name: 'Your Company Name',
  code: 'YOUR_CODE',
  industry: 'Your Industry',
  // ... other fields
});
```

### Add More Employees
```javascript
const employees = await Employee.insertMany([
  // ... existing employees
  {
    email: 'newemp@acme.com',
    password: password,
    employeeId: 'ACME006',
    firstName: 'New',
    lastName: 'Employee',
    // ... other fields
  }
]);
```

### Change Default Password
```javascript
// Change this line
const password = await hashPassword('your_new_password');
```

### Add More Leave Types
```javascript
const leaveTypes = await LeaveType.insertMany([
  // ... existing leave types
  {
    name: 'Maternity Leave',
    code: 'ML',
    yearlyQuota: 90,
    // ... other fields
  }
]);
```

## Troubleshooting

### Error: "MongoDB connection error"
- Ensure MongoDB is running: `mongod` or check your MongoDB service
- Verify `MONGODB_URI` in `.env` file is correct

### Error: "Module not found"
- Run `npm install` in the backend directory
- Ensure all model files exist in `src/models/`

### Error: "Duplicate key error"
- The script already clears data, but if you get this error:
- Manually clear your database or use a different database name

### Password Not Working
- Ensure you're using exactly: `password123`
- Passwords are case-sensitive
- Clear browser cache if you changed the password

## Re-running the Script

You can run this script multiple times:
- Each run will clear and recreate all data
- Employee IDs and emails will be regenerated
- All previous data will be lost

## Next Steps

After seeding:

1. **Start the backend:**
   ```bash
   npm run dev
   ```

2. **Start the frontend:**
   ```bash
   cd ../frontend
   npm run dev
   ```

3. **Login and test:**
   - Go to http://localhost:3000
   - Login with any demo account
   - Test face recognition, attendance, and leave features

## Production Use

**DO NOT use this script in production!**

For production:
- Create users manually through the admin panel
- Import real employee data using a migration script
- Use strong, unique passwords
- Set up proper user roles and permissions
