# Quick Start Checklist ✅

**Use this checklist to verify your Smart HR system is set up correctly.**

---

## 📋 Pre-Flight Checklist

### ✅ Step 1: Verify Prerequisites

- [ ] **Node.js installed** (v16 or higher)
  ```bash
  node --version
  # Should show v16.x.x or higher
  ```

- [ ] **MongoDB running** (v5 or higher)
  ```bash
  # Check MongoDB is running
  # Windows: Check Services → MongoDB Server
  # Mac: brew services list | grep mongodb
  # Linux: systemctl status mongod
  ```

- [ ] **npm installed**
  ```bash
  npm --version
  # Should show 8.x.x or higher
  ```

---

### ✅ Step 2: Verify Backend Setup

- [ ] **Dependencies installed**
  ```bash
  cd backend
  # If not done: npm install
  # Verify: Should see node_modules folder
  ls node_modules
  ```

- [ ] **.env file exists** with correct values
  ```bash
  cd backend
  cat .env
  # Should show:
  # - MONGODB_URI
  # - JWT_SECRET
  # - JWT_REFRESH_SECRET
  # - PORT=5000
  ```

- [ ] **Database seeded** with demo users
  ```bash
  cd backend
  node scripts/checkUsers.js
  # Should show: "Found 5 users in database"
  # If shows 0: node scripts/seedDatabase.js
  ```

- [ ] **Backend server starts**
  ```bash
  cd backend
  npm run dev
  # Should show:
  # ✅ MongoDB Connected
  # ✅ Server running on port 5000
  ```

- [ ] **Health endpoint works**
  - Open browser: [http://localhost:5000/health](http://localhost:5000/health)
  - Should show: `{"status":"OK"}`

---

### ✅ Step 3: Verify Frontend Setup

- [ ] **Dependencies installed**
  ```bash
  cd frontend
  # If not done: npm install
  # Verify: Should see node_modules folder
  ls node_modules
  ```

- [ ] **.env file exists** with correct API URL
  ```bash
  cd frontend
  cat .env
  # Should show:
  # VITE_API_URL=http://localhost:5000/api/v1
  ```

- [ ] **Frontend starts**
  ```bash
  cd frontend
  npm run dev
  # Should show:
  # VITE v4.x.x ready
  # Local: http://localhost:3000/
  ```

- [ ] **Login page loads**
  - Open browser: [http://localhost:3000](http://localhost:3000)
  - Should see login form with email/password fields

---

## 🎯 Functional Testing Checklist

### ✅ Test 1: Employee Login & Punch In

- [ ] **Login as Employee**
  - Email: `john@acme.com`
  - Password: `password123`
  - Click "Login"
  - Should redirect to Employee Dashboard

- [ ] **Verify Employee Dashboard**
  - [ ] See "Welcome, John!" heading
  - [ ] See "Quick Actions" card with Punch In/Out buttons
  - [ ] See "Today's Status" card showing "Absent" or current status
  - [ ] See 3 Leave Balance cards:
    - Casual Leave: 12/12
    - Sick Leave: 10/10
    - Earned Leave: 15/15

- [ ] **Punch In**
  - [ ] Click "Punch In" button
  - [ ] Webcam dialog opens
  - [ ] Allow camera access (if prompted)
  - [ ] See live video feed
  - [ ] Click "Capture" button
  - [ ] See captured image preview
  - [ ] Click "Confirm" button
  - [ ] Success message: "Punch in successful!"
  - [ ] "Punch In" button disabled
  - [ ] "Punch Out" button enabled
  - [ ] Today's Status updates to show punch in time

- [ ] **Punch Out**
  - [ ] Click "Punch Out" button
  - [ ] Repeat face capture process
  - [ ] Success message: "Punch out successful!"
  - [ ] Both buttons show as completed
  - [ ] Today's Status shows both punch in and out times

---

### ✅ Test 2: Manager Login & Team View

- [ ] **Logout** (click user avatar → Logout)

- [ ] **Login as Manager**
  - Email: `manager@acme.com`
  - Password: `password123`
  - Should redirect to Manager Dashboard

- [ ] **Verify Manager Dashboard**
  - [ ] See "Manager Dashboard" heading
  - [ ] See "Welcome, Bob!" message
  - [ ] See "My Attendance" section with Punch In/Out buttons
  - [ ] See "Team Overview" with counts:
    - Present Today
    - Pending Approvals
  - [ ] See "Team Attendance Today" table
  - [ ] See "Pending Leave Approvals" section

- [ ] **Verify Team Attendance**
  - [ ] Team table shows team members (John Doe, Jane Williams)
  - [ ] If John punched in earlier, see his attendance
  - [ ] Status badges have correct colors:
    - 🟢 Green for PRESENT
    - 🟡 Yellow for LATE
    - 🔴 Red for ABSENT

- [ ] **Manager can punch in/out**
  - [ ] Click "Punch In" in "My Attendance" section
  - [ ] Complete face capture
  - [ ] Verify manager's own attendance tracked

---

### ✅ Test 3: Admin Login & Company View

- [ ] **Logout**

- [ ] **Login as Admin**
  - Email: `admin@acme.com`
  - Password: `password123`
  - Should redirect to Admin Dashboard

- [ ] **Verify Admin Dashboard**
  - [ ] See "Admin Dashboard" heading
  - [ ] See "Welcome, Alice!" message
  - [ ] See 4 KPI cards:
    - Total Employees (should show 50 - mock data)
    - Present Today
    - On Leave
    - Pending Approvals
  - [ ] See "Today's Attendance" table (all employees, not just team)
  - [ ] See "Pending Leave Approvals" section
  - [ ] See "Quick Stats" with percentage cards

- [ ] **Verify Company-wide View**
  - [ ] Attendance table shows ALL employees
  - [ ] Can see different departments
  - [ ] KPIs show company-wide stats

---

### ✅ Test 4: Common Features

- [ ] **Theme Toggle**
  - [ ] While logged in, click sun/moon icon in header
  - [ ] Theme switches between light/dark
  - [ ] All colors update appropriately
  - [ ] Refresh page - theme preference remembered

- [ ] **User Avatar**
  - [ ] Shows first letter of user's name
  - [ ] Clicking opens menu with Logout option

- [ ] **Logout**
  - [ ] Click user avatar → Logout
  - [ ] Redirected to login page
  - [ ] Cannot access /dashboard without logging in again

- [ ] **Responsive Design**
  - [ ] Resize browser window to mobile size (< 768px)
  - [ ] Dashboard cards stack vertically
  - [ ] All buttons remain accessible
  - [ ] No horizontal scroll
  - [ ] Text remains readable

---

### ✅ Test 5: Error Handling

- [ ] **Invalid Login**
  - [ ] Try login with: `wrong@email.com` / `wrongpass`
  - [ ] Should show error message
  - [ ] User remains on login page

- [ ] **Empty Form Validation**
  - [ ] Try submitting login with empty email
  - [ ] Should show validation error
  - [ ] Try submitting with invalid email format
  - [ ] Should show validation error

- [ ] **Network Errors**
  - [ ] Stop backend server (Ctrl+C)
  - [ ] Try to login
  - [ ] Should show connection error
  - [ ] Restart backend and try again

---

## 🔧 Backend API Testing Checklist

**Using Browser DevTools (F12 → Network tab)**

### ✅ Auth Endpoints

- [ ] **POST /api/v1/auth/login**
  - Status: 200 OK
  - Response includes: user object, accessToken
  - Set-Cookie header present (refresh token)

- [ ] **GET /api/v1/auth/me**
  - Status: 200 OK
  - Response includes current user details

- [ ] **POST /api/v1/auth/logout**
  - Status: 200 OK
  - Refresh token cookie cleared

### ✅ Attendance Endpoints

- [ ] **POST /api/v1/attendance/punch-in**
  - Status: 200 OK
  - Response includes attendance record

- [ ] **POST /api/v1/attendance/punch-out**
  - Status: 200 OK
  - Response includes updated attendance

- [ ] **GET /api/v1/attendance/today**
  - Status: 200 OK
  - Response includes today's attendance or null

- [ ] **GET /api/v1/attendance/team** (Manager/Admin only)
  - Status: 200 OK (if Manager/Admin)
  - Status: 403 Forbidden (if Employee)
  - Response includes array of team attendance

### ✅ Leave Endpoints

- [ ] **GET /api/v1/leaves/balance**
  - Status: 200 OK
  - Response includes leave balance object

- [ ] **GET /api/v1/leaves/pending-approvals** (Manager/Admin only)
  - Status: 200 OK (if Manager/Admin)
  - Status: 403 Forbidden (if Employee)
  - Response includes array of pending leaves

---

## 📊 Database Verification Checklist

**Using MongoDB Compass or mongo shell**

### ✅ Collections Exist

- [ ] **employees** collection
  - Should have 5 documents
  - Fields: email, password, firstName, lastName, role, etc.

- [ ] **companies** collection
  - Should have 1 document (ACME Corporation)

- [ ] **departments** collection
  - Should have 3 documents (HR, Engineering, Sales)

- [ ] **designations** collection
  - Should have 5 documents (various positions)

- [ ] **shifts** collection
  - Should have 1 document (General Shift)

- [ ] **leaveTypes** collection
  - Should have 3 documents (CL, SL, EL)

- [ ] **holidays** collection
  - Should have 4 documents (New Year, etc.)

- [ ] **attendances** collection
  - Initially empty
  - Gets populated when employees punch in/out

- [ ] **leaves** collection
  - Initially empty
  - Gets populated when employees apply for leaves

- [ ] **auditlogs** collection
  - Gets populated with all user actions

---

## 🎯 Demo Accounts Verification

### ✅ All Demo Accounts Working

**All passwords: `password123`**

- [ ] **superadmin@acme.com** → Super Admin Dashboard
- [ ] **admin@acme.com** → Admin Dashboard (Alice Johnson)
- [ ] **manager@acme.com** → Manager Dashboard (Bob Smith)
- [ ] **john@acme.com** → Employee Dashboard (John Doe)
- [ ] **jane@acme.com** → Employee Dashboard (Jane Williams)

---

## 🚀 Production Readiness Checklist

**Before deploying to production:**

### ✅ Security

- [ ] Change JWT_SECRET to strong random string (32+ chars)
- [ ] Change JWT_REFRESH_SECRET to different strong string
- [ ] Update CORS_ORIGINS to your production domain
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS only (set COOKIE_SECURE=true)
- [ ] Review rate limiting values
- [ ] Disable mock face recognition provider
- [ ] Enable real face recognition (AWS/Azure)

### ✅ Database

- [ ] Move to MongoDB Atlas (cloud database)
- [ ] Update MONGODB_URI to production cluster
- [ ] Set up database backups
- [ ] Create database indexes for performance
- [ ] Enable authentication on MongoDB

### ✅ Email/SMS

- [ ] Configure real email provider (SendGrid/SMTP)
- [ ] Test email notifications work
- [ ] Update email templates with company branding

### ✅ Deployment

- [ ] Deploy backend to cloud (Heroku/Railway/AWS)
- [ ] Deploy frontend to CDN (Vercel/Netlify)
- [ ] Set up domain and SSL certificate
- [ ] Configure environment variables in hosting platform
- [ ] Test production URLs work
- [ ] Monitor error logs

---

## ✅ Final Verification

### All Systems Go! 🎉

- [ ] **Backend running** on http://localhost:5000
- [ ] **Frontend running** on http://localhost:3000
- [ ] **Database connected** with 5 demo users
- [ ] **All 5 logins work** (tested at least 3)
- [ ] **Punch in/out works** (tested with at least 1 employee)
- [ ] **Role-based dashboards** show different content
- [ ] **Theme toggle works** across all dashboards
- [ ] **No console errors** in browser DevTools
- [ ] **No errors** in backend terminal
- [ ] **API responses** are fast (< 1 second)

---

## 📚 Documentation Reference

If anything doesn't work, check these docs:

| Issue | Check Document |
|-------|----------------|
| Can't start system | [GETTING_STARTED.md](./GETTING_STARTED.md) |
| Login not working | [GETTING_STARTED.md](./GETTING_STARTED.md) - Troubleshooting |
| Want to test features | [TEST_SCENARIOS.md](./TEST_SCENARIOS.md) |
| Want to add features | [ADVANCED_FEATURES_ROADMAP.md](./ADVANCED_FEATURES_ROADMAP.md) |
| API documentation | [README.md](./README.md) - API Endpoints |
| Architecture overview | [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md) |

---

## 🎯 Success Criteria

**Your system is ready when:**

✅ All 5 demo accounts can login
✅ Employees can punch in/out with face capture
✅ Managers can see team attendance
✅ Admins can see company-wide stats
✅ Theme toggle works
✅ No errors in console or terminal
✅ All API endpoints return 200/403 (not 404/500)

---

## 🎉 Next Steps

**Once everything is ✅:**

### Option 1: Test Thoroughly
Follow [TEST_SCENARIOS.md](./TEST_SCENARIOS.md) for 20 detailed test scenarios

### Option 2: Build New Features
Pick from [ADVANCED_FEATURES_ROADMAP.md](./ADVANCED_FEATURES_ROADMAP.md):
1. Employee Management UI
2. Leave Application Page
3. Attendance History
4. Email Notifications
5. Real Face Recognition

### Option 3: Deploy to Production
Follow Production Readiness Checklist above

---

**Congratulations! Your Smart HR system is ready! 🚀**

**Quick Start Commands:**
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Browser
http://localhost:3000
Login: admin@acme.com / password123
```
