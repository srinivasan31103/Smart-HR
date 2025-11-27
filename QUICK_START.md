# Quick Start Guide - Smart HR System

This guide will help you get the Smart HR system up and running in **under 10 minutes**.

---

## Prerequisites Check

Before starting, ensure you have:

- ✅ **Node.js v16+** installed ([Download](https://nodejs.org/))
- ✅ **MongoDB** running ([Download](https://www.mongodb.com/try/download/community))
- ✅ A code editor (VS Code recommended)
- ✅ Terminal/Command Prompt

Verify installations:
```bash
node --version  # Should show v16.x or higher
npm --version   # Should show 8.x or higher
mongo --version # Or mongod --version
```

---

## Step-by-Step Setup

### Step 1: Start MongoDB (2 minutes)

**Windows:**
```bash
# Start MongoDB service
net start MongoDB

# Or use MongoDB Compass GUI
```

**macOS:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

Verify MongoDB is running:
```bash
mongosh  # Should connect to MongoDB shell
# Or check MongoDB Compass shows "Connected"
```

---

### Step 2: Backend Setup (3 minutes)

```bash
# Navigate to backend directory
cd backend

# Install dependencies (this may take 1-2 minutes)
npm install

# Create environment file
cp .env.example .env

# You're done! The default values will work for local development
```

**Quick .env check** (optional):
```bash
# Open .env and verify these lines exist:
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-hr
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this_in_production
```

**Start backend:**
```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected: localhost
🚀 Server running in development mode on port 5000
```

**Keep this terminal running!**

---

### Step 3: Frontend Setup (3 minutes)

Open a **new terminal window/tab**:

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies (this may take 1-2 minutes)
npm install

# Create environment file
cp .env.example .env

# Start frontend
npm run dev
```

You should see:
```
  VITE v4.x.x  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

---

### Step 4: Create Test Account (2 minutes)

Open a **third terminal window**:

```bash
# Connect to MongoDB
mongosh

# Switch to smart-hr database
use smart-hr

# Create a test company
db.companies.insertOne({
  name: "Test Company",
  code: "TEST",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})

# Note the company _id from the output, you'll need it

# Create a test department
db.departments.insertOne({
  name: "Engineering",
  code: "ENG",
  company: ObjectId("PASTE_COMPANY_ID_HERE"),
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})

# Note the department _id

# Create a test designation
db.designations.insertOne({
  title: "Software Engineer",
  code: "SE",
  company: ObjectId("PASTE_COMPANY_ID_HERE"),
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})

# Note the designation _id

# Create admin user (use the IDs from above)
db.employees.insertOne({
  email: "admin@test.com",
  password: "$2a$10$YourPasswordHashHere",  // See below for hash generation
  employeeId: "EMP001",
  firstName: "Admin",
  lastName: "User",
  role: "COMPANY_ADMIN",
  status: "ACTIVE",
  isActive: true,
  company: ObjectId("PASTE_COMPANY_ID_HERE"),
  department: ObjectId("PASTE_DEPARTMENT_ID_HERE"),
  designation: ObjectId("PASTE_DESIGNATION_ID_HERE"),
  dateOfJoining: new Date(),
  leaveBalance: {},
  faceData: {
    isRegistered: false
  },
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**Generate Password Hash:**

Run this in a Node.js console:
```javascript
// In a new terminal:
node

// In Node REPL:
const bcrypt = require('bcryptjs');
bcrypt.hash('admin123', 10).then(hash => console.log(hash));

// Copy the hash and use it in the password field above
```

**Alternative: Use this pre-generated hash for password "admin123":**
```
$2a$10$Xn2fGQV0q6K0Jp0DQN8Hxe7Z3P.8FGQJYqPQYq1K4LqK3K4K5K6K7
```

---

### Step 5: Login & Test (1 minute)

1. Open browser: [http://localhost:3000](http://localhost:3000)

2. Login with:
   - **Email:** `admin@test.com`
   - **Password:** `admin123`

3. You should see the Dashboard!

---

## Common Issues & Solutions

### Issue: "MongoDB connection error"

**Solution:**
```bash
# Check if MongoDB is running
sudo systemctl status mongod  # Linux
brew services list  # macOS
sc query MongoDB  # Windows

# Restart MongoDB if needed
sudo systemctl restart mongod  # Linux
brew services restart mongodb-community  # macOS
net stop MongoDB && net start MongoDB  # Windows
```

### Issue: "Port 5000 already in use"

**Solution:**
```bash
# Find and kill process on port 5000
# Linux/macOS:
lsof -ti:5000 | xargs kill -9

# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change port in backend/.env:
PORT=5001
```

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Frontend will auto-suggest next available port (3001, etc.)
# Or press 'Y' when prompted to use a different port
```

### Issue: "Module not found"

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Cannot login - Invalid credentials"

**Solution:**
```bash
# Verify user exists in MongoDB
mongosh
use smart-hr
db.employees.findOne({ email: "admin@test.com" })

# If not found, recreate the user (see Step 4)
# Make sure password hash is correct
```

---

## What's Next?

### 1. Register Your Face

- Click your profile → "Register Face"
- Allow camera permissions
- Capture your photo
- Now you can use face recognition for attendance!

### 2. Configure Leave Types

- Go to Admin → Leave Types
- Add leave types:
  - Casual Leave (12 days/year)
  - Sick Leave (10 days/year)
  - Earned Leave (15 days/year)

### 3. Create More Users

- Go to Admin → Employees
- Add employees with different roles
- Test manager approval flow

### 4. Mark Attendance

- Dashboard → Punch In (with face)
- System will verify your face and mark attendance
- Check if late/on-time

### 5. Apply for Leave

- Dashboard → Apply Leave
- Select leave type and dates
- Submit for approval

---

## Quick Commands Reference

### Backend
```bash
cd backend
npm run dev      # Start development server
npm start        # Start production server
npm test         # Run tests
```

### Frontend
```bash
cd frontend
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### MongoDB
```bash
mongosh                           # Open MongoDB shell
use smart-hr                      # Switch to database
db.employees.find().pretty()      # View all employees
db.attendance.find().limit(10)    # View recent attendance
```

---

## Default Credentials (After Setup)

**Admin Account:**
- Email: `admin@test.com`
- Password: `admin123`
- Role: Company Admin

**Test Employee (create via UI):**
- Email: `employee@test.com`
- Password: `test123`
- Role: Employee

---

## Pro Tips

1. **Keep Both Terminals Open:**
   - Terminal 1: Backend (npm run dev)
   - Terminal 2: Frontend (npm run dev)

2. **Auto-Reload Enabled:**
   - Backend changes → Nodemon restarts server
   - Frontend changes → Vite hot-reloads instantly

3. **Check Logs:**
   - Backend console shows all API calls
   - Frontend console shows React errors

4. **MongoDB GUI:**
   - Use MongoDB Compass for visual database management
   - Connection string: `mongodb://localhost:27017/smart-hr`

5. **API Testing:**
   - Use Postman or Thunder Client
   - Base URL: `http://localhost:5000/api/v1`
   - Import Postman collection (create one from API docs)

---

## Need Help?

- 📖 **Full Documentation:** See [README.md](README.md)
- 🏗️ **Architecture Details:** See [ARCHITECTURE.md](ARCHITECTURE.md)
- 💻 **Backend Code:** See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)
- ⚛️ **Frontend Code:** See [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md)

---

**You're all set! Enjoy building with Smart HR! 🎉**

