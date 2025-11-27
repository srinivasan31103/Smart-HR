require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('../src/models/Employee');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('✅ Connected to MongoDB\n');

  const users = await Employee.find({}, 'email firstName lastName role employeeId').sort({ employeeId: 1 });

  console.log(`Found ${users.length} users in database:\n`);
  console.log('='.repeat(80));

  users.forEach((u, i) => {
    console.log(`${i + 1}. Email: ${u.email}`);
    console.log(`   Name:  ${u.firstName} ${u.lastName}`);
    console.log(`   Role:  ${u.role}`);
    console.log(`   ID:    ${u.employeeId}`);
    console.log('-'.repeat(80));
  });

  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
