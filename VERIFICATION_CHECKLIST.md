# Smart HR System - Verification Checklist

Use this checklist to verify that your Smart HR system is set up correctly and working.

---

## ✅ Pre-Setup Verification

### System Requirements
- [ ] Node.js v16+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] MongoDB installed and can start
- [ ] Code editor (VS Code recommended)
- [ ] Git installed (optional)

---

## ✅ Backend Verification

### Files Created
- [ ] `backend/src/config/database.js` exists
- [ ] `backend/src/config/constants.js` exists
- [ ] `backend/src/models/` folder has 11 model files
- [ ] `backend/src/services/` folder has 4 service files
- [ ] `backend/src/middlewares/` folder has 5 middleware files
- [ ] `backend/src/controllers/` folder has controller files
- [ ] `backend/src/routes/` folder has route files
- [ ] `backend/src/server.js` exists
- [ ] `backend/.env.example` exists
- [ ] `backend/package.json` exists

### Environment Setup
- [ ] `backend/.env` file created (from .env.example)
- [ ] `MONGODB_URI` is set
- [ ] `JWT_SECRET` is set
- [ ] `JWT_REFRESH_SECRET` is set
- [ ] `PORT` is set (5000)

### Dependencies
- [ ] Run `cd backend && npm install`
- [ ] No errors during installation
- [ ] `node_modules` folder created
- [ ] `package-lock.json` created

### MongoDB
- [ ] MongoDB service is running
- [ ] Can connect via `mongosh` or MongoDB Compass
- [ ] Database `smart-hr` can be created

### Backend Server
- [ ] Run `npm run dev` in backend folder
- [ ] Server starts without errors
- [ ] See "MongoDB Connected" message
- [ ] See "Server running" message
- [ ] Can access `http://localhost:5000/api/v1/health`
- [ ] Health check returns JSON with success: true

---

## ✅ Frontend Verification

### Files Created
- [ ] `frontend/src/services/` folder has API service files
- [ ] `frontend/src/contexts/` folder has context files
- [ ] `frontend/src/hooks/` folder has custom hooks
- [ ] `frontend/src/components/` folder has component files
- [ ] `frontend/src/pages/` folder has page files
- [ ] `frontend/src/layouts/` folder has layout files
- [ ] `frontend/src/routes/` folder has route files
- [ ] `frontend/src/App.jsx` exists
- [ ] `frontend/src/main.jsx` exists
- [ ] `frontend/index.html` exists
- [ ] `frontend/vite.config.js` exists
- [ ] `frontend/.env.example` exists
- [ ] `frontend/package.json` exists

### Environment Setup
- [ ] `frontend/.env` file created (from .env.example)
- [ ] `VITE_API_URL` points to backend (http://localhost:5000/api/v1)

### Dependencies
- [ ] Run `cd frontend && npm install`
- [ ] No errors during installation
- [ ] `node_modules` folder created
- [ ] `package-lock.json` created

### Frontend Server
- [ ] Run `npm run dev` in frontend folder
- [ ] Vite starts without errors
- [ ] Can access `http://localhost:3000` (or 5173)
- [ ] No console errors in browser
- [ ] See login page

---

## ✅ Database Verification

### Collections Setup
- [ ] Connected to MongoDB (`mongosh` or Compass)
- [ ] Switched to `smart-hr` database
- [ ] Created `companies` collection with test data
- [ ] Created `departments` collection with test data
- [ ] Created `designations` collection with test data
- [ ] Created `employees` collection with admin user

### Test Data
- [ ] Admin user exists with:
  - [ ] Valid email
  - [ ] Hashed password
  - [ ] Role: COMPANY_ADMIN or SUPER_ADMIN
  - [ ] Status: ACTIVE
  - [ ] isActive: true
  - [ ] Valid company reference
  - [ ] Valid department reference
  - [ ] Valid designation reference

---

## ✅ Integration Testing

### Login Flow
- [ ] Can access login page
- [ ] Form validation works (empty fields show errors)
- [ ] Can enter admin credentials
- [ ] Login succeeds with valid credentials
- [ ] Login fails with invalid credentials
- [ ] Redirected to dashboard after login
- [ ] User info displayed in header
- [ ] Token stored (check browser cookies or localStorage)

### Dashboard
- [ ] Dashboard loads after login
- [ ] Welcome message shows user's first name
- [ ] Punch In button is visible
- [ ] Punch Out button is disabled (no punch in yet)
- [ ] Today's status card shows "Absent" or similar
- [ ] Leave balance cards may be empty (no leave types yet)
- [ ] No console errors

### Authentication
- [ ] Can access protected routes when logged in
- [ ] Redirected to login when not logged in
- [ ] Can logout successfully
- [ ] Redirected to login after logout
- [ ] Cannot access dashboard after logout

### Theme Toggle
- [ ] Theme toggle button visible in header
- [ ] Can switch to dark mode
- [ ] Can switch back to light mode
- [ ] Theme persists after page refresh

---

## ✅ Face Recognition Testing

### Camera Permissions
- [ ] Browser asks for camera permission
- [ ] Camera permission granted
- [ ] Webcam works in browser

### Face Registration
- [ ] Can access face registration
- [ ] Webcam preview appears
- [ ] Can capture photo
- [ ] Can retake photo
- [ ] Can confirm photo
- [ ] Registration succeeds (mock provider)
- [ ] Success message shown

### Punch In
- [ ] Click "Punch In" on dashboard
- [ ] Face capture modal opens
- [ ] Webcam preview appears
- [ ] Can capture face
- [ ] Face verification succeeds (mock provider)
- [ ] Attendance record created
- [ ] Today's status updated to "PRESENT"
- [ ] Punch In button becomes disabled
- [ ] Punch Out button becomes enabled
- [ ] Success notification shown

### Punch Out
- [ ] Click "Punch Out" on dashboard
- [ ] Face capture modal opens
- [ ] Can capture face
- [ ] Face verification succeeds
- [ ] Attendance record updated
- [ ] Total hours calculated
- [ ] Punch Out button becomes disabled
- [ ] Success notification shown

---

## ✅ API Testing (Optional - Using Postman/Thunder Client)

### Auth Endpoints
- [ ] POST `/api/v1/auth/login` - Returns token and user data
- [ ] GET `/api/v1/auth/me` - Returns current user (with token)
- [ ] POST `/api/v1/auth/logout` - Clears session
- [ ] POST `/api/v1/auth/refresh` - Returns new access token

### Attendance Endpoints
- [ ] POST `/api/v1/attendance/register-face` - Registers face
- [ ] POST `/api/v1/attendance/punch-in` - Creates attendance record
- [ ] POST `/api/v1/attendance/punch-out` - Updates attendance record
- [ ] GET `/api/v1/attendance/my-attendance` - Returns attendance history
- [ ] GET `/api/v1/attendance/today-status` - Returns today's record

### Leave Endpoints
- [ ] POST `/api/v1/leaves/apply` - Creates leave request
- [ ] GET `/api/v1/leaves/my-leaves` - Returns leave requests
- [ ] GET `/api/v1/leaves/balance` - Returns leave balance

---

## ✅ Error Handling Testing

### Frontend Errors
- [ ] Network error shows notification
- [ ] Invalid form input shows validation errors
- [ ] API errors show user-friendly messages
- [ ] Loading states displayed during API calls

### Backend Errors
- [ ] Invalid token returns 401
- [ ] Missing fields return 422 with details
- [ ] Duplicate email returns 409
- [ ] Server errors return 500

---

## ✅ Security Testing

### Authentication
- [ ] Cannot access protected routes without token
- [ ] Expired token triggers refresh
- [ ] Invalid token logs out user
- [ ] Password not returned in API responses

### Authorization
- [ ] Employee can only see own data
- [ ] Manager can see team data (when implemented)
- [ ] Admin can see all data

### Rate Limiting
- [ ] Multiple rapid requests get rate limited
- [ ] Rate limit message returned

---

## ✅ Documentation Verification

### Files Exist
- [ ] `README.md` - Main documentation
- [ ] `QUICK_START.md` - Setup guide
- [ ] `ARCHITECTURE.md` - System architecture
- [ ] `IMPLEMENTATION_GUIDE.md` - Backend code reference
- [ ] `FRONTEND_GUIDE.md` - Frontend code reference
- [ ] `PROJECT_SUMMARY.md` - Project overview
- [ ] `VERIFICATION_CHECKLIST.md` - This file

### Documentation Quality
- [ ] README has clear setup instructions
- [ ] QUICK_START has step-by-step guide
- [ ] ARCHITECTURE explains system design
- [ ] Code examples are present and clear
- [ ] API endpoints documented

---

## ✅ Production Readiness Checklist

### Security
- [ ] Environment variables not committed
- [ ] `.env` files in `.gitignore`
- [ ] Strong JWT secrets set (not defaults)
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Helmet security headers enabled

### Code Quality
- [ ] No console.logs in production code (or using proper logger)
- [ ] Error handling in all routes
- [ ] Input validation on all endpoints
- [ ] Proper HTTP status codes used
- [ ] Clean code structure

### Database
- [ ] Indexes defined on all queries
- [ ] No N+1 query issues
- [ ] Connection pooling configured
- [ ] Backup strategy planned

### Deployment (When Ready)
- [ ] Production environment variables set
- [ ] MongoDB Atlas or managed DB configured
- [ ] Frontend built and deployed
- [ ] Backend deployed
- [ ] HTTPS enabled
- [ ] Monitoring set up

---

## 🐛 Common Issues Checklist

If something doesn't work, check these:

### Backend Won't Start
- [ ] MongoDB is running
- [ ] Port 5000 not in use
- [ ] `.env` file exists with correct values
- [ ] Dependencies installed (`npm install`)
- [ ] No syntax errors in code

### Frontend Won't Start
- [ ] Port 3000/5173 not in use
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file exists
- [ ] Backend is running

### Login Doesn't Work
- [ ] User exists in database
- [ ] Password hash is correct
- [ ] User status is ACTIVE
- [ ] Backend is running
- [ ] CORS is configured correctly
- [ ] Browser console shows no errors

### Face Capture Doesn't Work
- [ ] Camera permission granted
- [ ] HTTPS or localhost (cameras need secure context)
- [ ] Browser supports getUserMedia API
- [ ] No other app using camera

### API Calls Fail
- [ ] Backend is running
- [ ] CORS configured correctly
- [ ] Token is valid
- [ ] Request body format is correct
- [ ] Network tab shows request details

---

## 📊 Final Verification Score

Count your checkmarks:

- **90-100% complete**: ✅ Excellent! System is fully working
- **70-89% complete**: ⚠️ Good! Some features need attention
- **Below 70%**: ❌ Needs work! Review setup instructions

---

## 🎯 Must-Have Checkmarks (Critical)

These MUST be checked for the system to work:

Backend:
- [ ] MongoDB running
- [ ] Backend server starts
- [ ] Health endpoint works

Frontend:
- [ ] Frontend server starts
- [ ] Login page loads
- [ ] No console errors

Database:
- [ ] Admin user created
- [ ] Can login with admin credentials

Integration:
- [ ] Login succeeds
- [ ] Dashboard loads
- [ ] Can logout

If all critical checks pass, your system is working! 🎉

---

## 📞 Need Help?

If you're stuck:

1. Check `QUICK_START.md` for setup instructions
2. Review `README.md` for detailed documentation
3. Check browser console for errors
4. Check backend terminal for errors
5. Verify MongoDB is running and connected

Remember: Most issues are due to:
- MongoDB not running
- Missing `.env` files
- Port conflicts
- Missing dependencies

Good luck! 🚀

