# Smart HR System - Test Scenarios

Complete testing guide for all features and user roles.

---

## 🔐 Test Accounts

All passwords: `password123`

| Email | Role | Name | Department | Features to Test |
|-------|------|------|------------|------------------|
| superadmin@acme.com | SUPER_ADMIN | Super Admin | HR | Admin Dashboard, All features |
| admin@acme.com | COMPANY_ADMIN | Alice Johnson | HR | Admin Dashboard, HR features |
| manager@acme.com | MANAGER | Bob Smith | Engineering | Manager Dashboard, Team management |
| john@acme.com | EMPLOYEE | John Doe | Engineering | Employee Dashboard, Attendance |
| jane@acme.com | EMPLOYEE | Jane Williams | Engineering | Employee Dashboard, Remote work |

---

## 📋 Test Scenario Checklist

### Scenario 1: Admin Login & Dashboard

**User:** `admin@acme.com` / `password123`

✅ **Steps:**
1. Navigate to http://localhost:3000
2. Enter email: `admin@acme.com`
3. Enter password: `password123`
4. Click "Login"

✅ **Expected Results:**
- [ ] Login successful
- [ ] Redirected to Admin Dashboard
- [ ] See welcome message: "Admin Dashboard" and "Welcome, Alice!"
- [ ] See 4 KPI cards:
  - Total Employees
  - Present Today
  - On Leave
  - Pending Approvals
- [ ] See "Today's Attendance" table (may be empty if no one punched in)
- [ ] See "Pending Leave Approvals" section
- [ ] See "Quick Stats" section with percentage cards
- [ ] User avatar shows "A" (for Alice)
- [ ] Logout button visible in header

---

### Scenario 2: Manager Login & Dashboard

**User:** `manager@acme.com` / `password123`

✅ **Steps:**
1. Logout from admin account (click user avatar → Logout)
2. Login with email: `manager@acme.com`
3. Enter password: `password123`
4. Click "Login"

✅ **Expected Results:**
- [ ] Login successful
- [ ] See "Manager Dashboard" heading
- [ ] Welcome message shows: "Welcome, Bob!"
- [ ] See "My Attendance" card with Punch In/Out buttons
- [ ] See "Team Overview" card with:
  - Present Today count
  - Pending Approvals count
- [ ] See personal leave balance (3 cards for CL, SL, EL)
- [ ] See "Team Attendance Today" table
- [ ] See "Pending Leave Approvals" with Approve/Reject buttons
- [ ] User avatar shows "B" (for Bob)

---

### Scenario 3: Employee Login & Dashboard

**User:** `john@acme.com` / `password123`

✅ **Steps:**
1. Logout from manager account
2. Login with email: `john@acme.com`
3. Enter password: `password123`
4. Click "Login"

✅ **Expected Results:**
- [ ] Login successful
- [ ] See simple Employee Dashboard
- [ ] Welcome message: "Welcome, John!"
- [ ] See "Quick Actions" card with:
  - Punch In button (enabled)
  - Punch Out button (disabled until punched in)
- [ ] See "Today's Status" card showing "Absent" or status
- [ ] See 3 leave balance cards:
  - Casual Leave: 12/12
  - Sick Leave: 10/10
  - Earned Leave: 15/15
- [ ] User avatar shows "J" (for John)
- [ ] No admin or manager features visible

---

### Scenario 4: Employee Punch In (Face Recognition)

**User:** `john@acme.com` (already logged in)

✅ **Steps:**
1. Click "Punch In" button
2. Wait for webcam dialog to open
3. Allow webcam access if prompted
4. Position face in camera view
5. Click "Capture" button
6. Review captured image
7. Click "Confirm" button

✅ **Expected Results:**
- [ ] Face capture dialog opens
- [ ] Webcam starts and shows live video
- [ ] "Capture" button is visible
- [ ] After capture, image preview shows
- [ ] "Retake" button appears
- [ ] "Confirm" button appears
- [ ] After confirm:
  - Success message: "Punch in successful!"
  - Dialog closes
  - "Punch In" button becomes disabled and shows "Punched In"
  - "Punch Out" button becomes enabled
  - "Today's Status" updates to show punch in time
  - Status changes from "Absent" to "PRESENT"

---

### Scenario 5: Employee Punch Out

**User:** `john@acme.com` (after punch in)

✅ **Steps:**
1. Click "Punch Out" button
2. Capture face again
3. Click "Confirm"

✅ **Expected Results:**
- [ ] Face capture dialog opens
- [ ] After confirmation:
  - Success message: "Punch out successful!"
  - "Punch Out" button becomes disabled
  - Both buttons show as completed
  - Today's status shows both punch in and out times

---

### Scenario 6: Manager Views Team Attendance

**User:** `manager@acme.com` / `password123`

✅ **Steps:**
1. Login as manager
2. View "Team Attendance Today" table
3. Check for John Doe's attendance (from previous punch in)

✅ **Expected Results:**
- [ ] Team attendance table displays
- [ ] Shows team members (John Doe, Jane Williams)
- [ ] Shows punch in/out times
- [ ] Shows status badges (PRESENT, ABSENT, LATE)
- [ ] Status badges have correct colors:
  - Green for PRESENT
  - Yellow for LATE
  - Red for ABSENT

---

### Scenario 7: Manager Punch In/Out (Dual Role)

**User:** `manager@acme.com` (already logged in)

✅ **Steps:**
1. From Manager Dashboard, find "My Attendance" section
2. Click "Punch In"
3. Complete face capture
4. Later, click "Punch Out"

✅ **Expected Results:**
- [ ] Manager can punch in like regular employee
- [ ] Punch in successful
- [ ] Own attendance appears in "Team Attendance" table
- [ ] Can punch out successfully
- [ ] Attendance tracked separately from team management

---

### Scenario 8: Admin Views Company-Wide Stats

**User:** `admin@acme.com` / `password123`

✅ **Steps:**
1. Login as admin
2. Review all dashboard statistics
3. Check attendance table for all employees

✅ **Expected Results:**
- [ ] See total employees count (50 - mock data)
- [ ] See "Present Today" count (should show employees who punched in)
- [ ] See attendance percentage
- [ ] Attendance table shows ALL employees (not just team)
- [ ] Can see different departments
- [ ] Quick stats show company-wide metrics

---

### Scenario 9: Theme Toggle (All Users)

**User:** Any user

✅ **Steps:**
1. Login with any account
2. Find theme toggle icon in header (sun/moon icon)
3. Click to toggle theme
4. Observe changes

✅ **Expected Results:**
- [ ] Toggle icon visible in app bar
- [ ] Click switches between light/dark mode
- [ ] All colors invert appropriately
- [ ] Theme preference persists on page refresh
- [ ] Cards, buttons, tables all update theme
- [ ] Text remains readable in both modes

---

### Scenario 10: Logout & Session

**User:** Any user

✅ **Steps:**
1. Login with any account
2. Click user avatar in header
3. Click "Logout"

✅ **Expected Results:**
- [ ] Redirected to login page
- [ ] User data cleared from localStorage
- [ ] Cannot access /dashboard without login
- [ ] Must login again to access system

---

### Scenario 11: Role-Based Access Control

**Test:** Verify each role sees correct dashboard

✅ **Steps:**
1. Login as `superadmin@acme.com` → Should see Admin Dashboard
2. Logout, login as `admin@acme.com` → Should see Admin Dashboard
3. Logout, login as `manager@acme.com` → Should see Manager Dashboard
4. Logout, login as `john@acme.com` → Should see Employee Dashboard
5. Logout, login as `jane@acme.com` → Should see Employee Dashboard

✅ **Expected Results:**
- [ ] Super Admin → Admin Dashboard ✅
- [ ] Company Admin → Admin Dashboard ✅
- [ ] Manager → Manager Dashboard ✅
- [ ] Employee (John) → Employee Dashboard ✅
- [ ] Employee (Jane) → Employee Dashboard ✅
- [ ] Each dashboard has appropriate features for the role

---

### Scenario 12: Leave Balance Display

**User:** Any employee

✅ **Steps:**
1. Login as employee
2. View leave balance cards

✅ **Expected Results:**
- [ ] See 3 leave type cards:
  - Casual Leave (CL)
  - Sick Leave (SL)
  - Earned Leave (EL)
- [ ] Each card shows:
  - Available/Total format (e.g., 12/12)
  - Used count
  - Pending count
- [ ] All new employees show full balance
- [ ] Cards display with icons

---

### Scenario 13: Responsive Design

**Test:** Mobile & tablet views

✅ **Steps:**
1. Login on desktop browser
2. Resize browser window to mobile size (< 768px)
3. Test on tablet size (768px - 1024px)

✅ **Expected Results:**
- [ ] Login page responsive on all sizes
- [ ] Dashboard cards stack vertically on mobile
- [ ] Buttons remain accessible
- [ ] Tables scroll horizontally if needed
- [ ] Text sizes appropriate
- [ ] No horizontal overflow
- [ ] Touch-friendly button sizes on mobile

---

### Scenario 14: Error Handling - Invalid Login

**Test:** Wrong credentials

✅ **Steps:**
1. Go to login page
2. Enter email: `wrong@email.com`
3. Enter password: `wrongpassword`
4. Click "Login"

✅ **Expected Results:**
- [ ] Error message displayed
- [ ] User remains on login page
- [ ] No redirect
- [ ] Error message is clear

---

### Scenario 15: Error Handling - Validation

**Test:** Form validation

✅ **Steps:**
1. On login page, try submitting:
   - Empty email
   - Invalid email format
   - Too short password

✅ **Expected Results:**
- [ ] Validation errors show
- [ ] Form doesn't submit
- [ ] Clear error messages
- [ ] Red error styling

---

### Scenario 16: Multiple Employees Same Day

**Test:** Concurrent attendance

✅ **Steps:**
1. Login as `john@acme.com`, punch in, logout
2. Login as `jane@acme.com`, punch in, logout
3. Login as `manager@acme.com`
4. Check team attendance table

✅ **Expected Results:**
- [ ] Manager sees both John and Jane in attendance table
- [ ] Both show "PRESENT" status
- [ ] Punch in times displayed for both
- [ ] Each employee's data is separate

---

### Scenario 17: Late Arrival Detection

**Test:** Late punch in (if grace period expired)

✅ **Steps:**
1. Note: Shift starts at 9:00 AM, grace period is 15 mins
2. If testing after 9:15 AM, punch in should mark as LATE
3. Login as employee
4. Punch in after grace period

✅ **Expected Results:**
- [ ] If before 9:15 AM → Status: PRESENT
- [ ] If after 9:15 AM → Status: LATE (with warning color)
- [ ] Status badge shows appropriate color
- [ ] Time recorded correctly

---

### Scenario 18: Data Persistence

**Test:** Data survives page refresh

✅ **Steps:**
1. Login as any user
2. Note current dashboard data
3. Press F5 or refresh page
4. Check if still logged in

✅ **Expected Results:**
- [ ] User remains logged in
- [ ] Dashboard shows same data
- [ ] Theme preference maintained
- [ ] No data loss
- [ ] Smooth re-render

---

### Scenario 19: Browser Back Button

**Test:** Navigation behavior

✅ **Steps:**
1. Login successfully
2. Navigate to dashboard
3. Click browser back button

✅ **Expected Results:**
- [ ] Doesn't go back to login page while logged in
- [ ] Route guards work properly
- [ ] No authentication loops

---

### Scenario 20: Empty State Display

**Test:** No data scenarios

✅ **Steps:**
1. Login as manager on a fresh day
2. Check team attendance when no one has punched in

✅ **Expected Results:**
- [ ] "No attendance records" message shown
- [ ] No JavaScript errors
- [ ] Tables show empty state gracefully
- [ ] Leave section shows "No pending leave requests"

---

## 🎯 Critical Path Test (Full Flow)

**Complete user journey:**

1. ✅ **Admin creates company structure** (Already done via seed)
2. ✅ **Employee logs in** → `john@acme.com`
3. ✅ **Employee punches in** → Face capture works
4. ✅ **Employee checks leave balance** → Shows correct data
5. ✅ **Manager logs in** → `manager@acme.com`
6. ✅ **Manager sees team attendance** → John appears in table
7. ✅ **Manager punches in** → Own attendance tracked
8. ✅ **Admin logs in** → `admin@acme.com`
9. ✅ **Admin sees company-wide stats** → All employees visible
10. ✅ **Employee punches out** → Logout, login as john, punch out
11. ✅ **Everyone logs out** → Data persisted

---

## 🐛 Known Issues to Verify

Check if these work correctly:

- [ ] Face recognition mock (should succeed ~90% of the time)
- [ ] Attendance route `/attendance/today` (fixed from `/today-status`)
- [ ] Team attendance API returns data
- [ ] Leave approvals API endpoints exist
- [ ] Token refresh on 401 errors
- [ ] CORS allows frontend origin

---

## 📊 Backend API Endpoints to Test

Use Postman or browser DevTools Network tab:

### Auth Endpoints
- [ ] POST `/api/v1/auth/login` - Login
- [ ] POST `/api/v1/auth/logout` - Logout
- [ ] POST `/api/v1/auth/refresh` - Refresh token
- [ ] GET `/api/v1/auth/me` - Get current user

### Attendance Endpoints
- [ ] POST `/api/v1/attendance/punch-in` - Punch in
- [ ] POST `/api/v1/attendance/punch-out` - Punch out
- [ ] GET `/api/v1/attendance/today` - Today's status
- [ ] GET `/api/v1/attendance/team` - Team attendance

### Leave Endpoints
- [ ] GET `/api/v1/leaves/balance` - Leave balance
- [ ] GET `/api/v1/leaves/pending-approvals` - Pending leaves
- [ ] POST `/api/v1/leaves/:id/approve` - Approve leave
- [ ] POST `/api/v1/leaves/:id/reject` - Reject leave

---

## ✅ Success Criteria

All scenarios should:
1. ✅ Load without errors
2. ✅ Display appropriate UI for each role
3. ✅ Save data correctly
4. ✅ Show success/error messages
5. ✅ Maintain authentication state
6. ✅ Work across different browsers
7. ✅ Be responsive on mobile/tablet/desktop

---

## 🔧 If Something Doesn't Work

### Backend Not Running
```bash
cd backend
npm run dev
```
Check: `http://localhost:5000/health` should return OK

### Frontend Not Running
```bash
cd frontend
npm run dev
```
Check: `http://localhost:3000` should load

### Database Empty
```bash
cd backend
node scripts/seedDatabase.js
```

### Browser Console Errors
- Open DevTools (F12)
- Check Console tab for JavaScript errors
- Check Network tab for API errors
- Look for 404, 401, 500 status codes

---

## 📝 Test Results Template

Copy and fill this out:

```
Date: __________
Tester: __________
Browser: __________

Scenario 1 (Admin Login):           [ ] Pass  [ ] Fail
Scenario 2 (Manager Login):          [ ] Pass  [ ] Fail
Scenario 3 (Employee Login):         [ ] Pass  [ ] Fail
Scenario 4 (Employee Punch In):      [ ] Pass  [ ] Fail
Scenario 5 (Employee Punch Out):     [ ] Pass  [ ] Fail
Scenario 6 (Manager Team View):      [ ] Pass  [ ] Fail
Scenario 7 (Manager Punch In/Out):   [ ] Pass  [ ] Fail
Scenario 8 (Admin Stats):            [ ] Pass  [ ] Fail
Scenario 9 (Theme Toggle):           [ ] Pass  [ ] Fail
Scenario 10 (Logout):                [ ] Pass  [ ] Fail
Scenario 11 (Role-Based Access):     [ ] Pass  [ ] Fail
Scenario 12 (Leave Balance):         [ ] Pass  [ ] Fail
Scenario 13 (Responsive Design):     [ ] Pass  [ ] Fail
Scenario 14 (Invalid Login):         [ ] Pass  [ ] Fail
Scenario 15 (Form Validation):       [ ] Pass  [ ] Fail

Notes:
_____________________________________________
_____________________________________________
```

---

**Happy Testing! 🎉**
