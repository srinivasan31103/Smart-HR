# Smart HR System - Architecture Documentation

## System Overview

The Smart HR + Attendance System is a full-stack corporate HR management solution built entirely on the MERN stack. It provides face recognition-based attendance tracking and comprehensive leave management with enterprise-grade features.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │   React SPA (Vite)                                      │ │
│  │   - Material-UI Components                              │ │
│  │   - React Router (SPA Navigation)                       │ │
│  │   - Context API (State Management)                      │ │
│  │   - Axios (HTTP Client)                                 │ │
│  │   - React Webcam (Face Capture)                         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                         API LAYER                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │   Express.js REST API                                   │ │
│  │   ┌──────────────┬──────────────┬──────────────┐       │ │
│  │   │ Middlewares  │ Controllers  │   Routes     │       │ │
│  │   │ - Auth       │ - Auth       │ - /auth      │       │ │
│  │   │ - Role       │ - Employee   │ - /employees │       │ │
│  │   │ - Validate   │ - Attendance │ - /attendance│       │ │
│  │   │ - Error      │ - Leave      │ - /leaves    │       │ │
│  │   │ - RateLimit  │ - Dashboard  │ - /reports   │       │ │
│  │   └──────────────┴──────────────┴──────────────┘       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │   Services                                              │ │
│  │   ┌────────────────┬─────────────────┬───────────────┐ │ │
│  │   │ Face           │ Notification    │ Leave Balance │ │ │
│  │   │ Recognition    │ Service         │ Service       │ │ │
│  │   │ Service        │ - Email         │ - Calculate   │ │ │
│  │   │ - Register     │ - SMS           │ - Accrue      │ │ │
│  │   │ - Verify       │ - WhatsApp      │ - Reset       │ │ │
│  │   │ - Delete       │ - In-App        │               │ │ │
│  │   └────────────────┴─────────────────┴───────────────┘ │ │
│  │   ┌────────────────────────────────────────────────────┐│ │
│  │   │ Audit Log Service                                  ││ │
│  │   │ - Log actions, track changes                       ││ │
│  │   └────────────────────────────────────────────────────┘│ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                       DATA LAYER                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │   MongoDB + Mongoose ODM                                │ │
│  │   ┌──────────────────────────────────────────────────┐ │ │
│  │   │   Collections:                                    │ │ │
│  │   │   - companies                                     │ │ │
│  │   │   - employees                                     │ │ │
│  │   │   - departments                                   │ │ │
│  │   │   - designations                                  │ │ │
│  │   │   - shifts                                        │ │ │
│  │   │   - attendance                                    │ │ │
│  │   │   - leavetypes                                    │ │ │
│  │   │   - leaverequests                                 │ │ │
│  │   │   - holidays                                      │ │ │
│  │   │   - notifications                                 │ │ │
│  │   │   - auditlogs                                     │ │ │
│  │   └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES (Pluggable)             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │   - AWS Rekognition / Azure Face / Face++ (Optional)   │ │
│  │   - AWS S3 / Cloudinary (File Storage)                 │ │
│  │   - SMTP / SendGrid (Email)                             │ │
│  │   - Twilio (SMS/WhatsApp)                               │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Authentication Flow

```
User (Browser)
    │
    │ 1. POST /auth/login { email, password }
    ▼
Express API
    │
    │ 2. Validate credentials
    ▼
Employee Model
    │
    │ 3. Compare password hash
    ▼
JWT Service
    │
    │ 4. Generate access & refresh tokens
    ▼
Response
    │
    │ 5. Set HTTP-only cookies
    │    Return user data + token
    ▼
User (Store token, redirect to dashboard)
```

### 2. Face Recognition Attendance Flow

```
User (Browser)
    │
    │ 1. Capture face via webcam
    │    (Base64 image data)
    ▼
POST /attendance/punch-in
    │
    │ 2. Validate JWT token
    ▼
Attendance Controller
    │
    │ 3. Call Face Recognition Service
    ▼
Face Recognition Service
    │
    ├─→ Mock Provider (Dev)
    │   - Generate mock result
    │
    └─→ Real Provider (Prod)
        - AWS Rekognition
        - Azure Face API
        - Face++
    │
    │ 4. Return match result + confidence
    ▼
Attendance Controller
    │
    │ 5. Create/Update attendance record
    │    - Check if late
    │    - Calculate working hours
    ▼
MongoDB (Attendance Collection)
    │
    │ 6. Send notifications if needed
    ▼
Notification Service
    │
    │ 7. Return success response
    ▼
User (Browser)
    │
    └─→ Show success message
```

### 3. Leave Application Flow

```
Employee
    │
    │ 1. Apply for leave
    ▼
POST /leaves/apply
    │
    │ 2. Validate leave data
    ▼
Leave Controller
    │
    │ 3. Check leave balance
    ▼
Leave Balance Service
    │
    │ 4. Check for overlapping leaves
    ▼
LeaveRequest Model
    │
    │ 5. Create leave request
    │    - Set approval chain
    │    - Status: PENDING
    ▼
MongoDB
    │
    │ 6. Notify manager
    ▼
Notification Service
    │
    └─→ Email/SMS to manager

Manager
    │
    │ 7. Review and approve/reject
    ▼
PUT /leaves/:id/approve
    │
    │ 8. Update leave status
    ▼
Leave Controller
    │
    ├─→ If APPROVED:
    │   │ - Deduct leave balance
    │   │ - Create attendance records
    │   │ - Notify employee
    │   └─→ Move to next approval level (HR)
    │
    └─→ If REJECTED:
        │ - Update status
        └─→ Notify employee
```

---

## Database Schema Design

### Employee Collection

```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (hashed),
  employeeId: String (unique, indexed),
  firstName: String,
  lastName: String,
  role: Enum [SUPER_ADMIN, COMPANY_ADMIN, MANAGER, EMPLOYEE],
  status: Enum [ACTIVE, INACTIVE, SUSPENDED, TERMINATED],

  // Face Recognition
  faceData: {
    referenceImage: String,
    faceId: String,
    embeddings: Mixed,
    isRegistered: Boolean,
    registeredAt: Date
  },

  // Organization
  company: ObjectId (ref: Company),
  department: ObjectId (ref: Department),
  designation: ObjectId (ref: Designation),
  manager: ObjectId (ref: Employee),
  shift: ObjectId (ref: Shift),

  // Leave Balance (Map)
  leaveBalance: {
    leaveTypeId1: Number,
    leaveTypeId2: Number,
    ...
  },

  // Security
  refreshToken: String,
  loginAttempts: Number,
  lockUntil: Date,

  timestamps: { createdAt, updatedAt }
}
```

**Indexes:**
- `{ email: 1 }` - unique
- `{ employeeId: 1 }` - unique
- `{ company: 1, status: 1 }`
- `{ manager: 1 }`
- `{ faceData.isRegistered: 1 }`

### Attendance Collection

```javascript
{
  _id: ObjectId,
  employee: ObjectId (ref: Employee, indexed),
  company: ObjectId (ref: Company),
  date: Date (indexed),
  shift: ObjectId (ref: Shift),

  status: Enum [PRESENT, ABSENT, HALF_DAY, ON_LEAVE, WFH],

  punches: [
    {
      type: Enum [IN, OUT],
      time: Date,
      source: Enum [FACE, MANUAL, SYSTEM],
      ipAddress: String,
      location: { latitude, longitude },
      faceConfidence: Number
    }
  ],

  punchIn: Date,
  punchOut: Date,
  totalHours: Number,

  isLate: Boolean,
  lateByMinutes: Number,
  isEarlyExit: Boolean,
  earlyExitByMinutes: Number,
  isWFH: Boolean,
  isHalfDay: Boolean,

  // Manual entry
  isManualEntry: Boolean,
  manualEntryBy: ObjectId (ref: Employee),
  manualEntryReason: String,

  leaveRequest: ObjectId (ref: LeaveRequest),

  timestamps: { createdAt, updatedAt }
}
```

**Indexes:**
- `{ employee: 1, date: 1 }` - unique, compound
- `{ company: 1, date: 1 }`
- `{ status: 1, date: 1 }`
- `{ isLate: 1, date: 1 }`

### LeaveRequest Collection

```javascript
{
  _id: ObjectId,
  employee: ObjectId (ref: Employee, indexed),
  company: ObjectId (ref: Company),
  leaveType: ObjectId (ref: LeaveType),

  fromDate: Date,
  toDate: Date,
  totalDays: Number,
  isHalfDay: Boolean,
  halfDayPeriod: Enum [FIRST_HALF, SECOND_HALF],
  reason: String,

  status: Enum [PENDING, APPROVED, REJECTED, CANCELLED],

  approvalChain: [
    {
      level: Number,
      approver: ObjectId (ref: Employee),
      approverRole: String,
      status: Enum [PENDING, APPROVED, REJECTED],
      comments: String,
      actionAt: Date
    }
  ],

  currentApprovalLevel: Number,

  finalApprover: ObjectId (ref: Employee),
  finalApprovedAt: Date,
  rejectedBy: ObjectId (ref: Employee),
  rejectionReason: String,

  timestamps: { createdAt, updatedAt }
}
```

**Indexes:**
- `{ employee: 1, status: 1 }`
- `{ company: 1, fromDate: -1 }`
- `{ leaveType: 1, status: 1 }`
- `{ approvalChain.approver: 1, approvalChain.status: 1 }`

---

## Security Architecture

### Authentication Flow

1. **Login**: User credentials → JWT generation
2. **Token Storage**:
   - HTTP-only cookie (preferred)
   - LocalStorage (fallback)
3. **Token Refresh**: Short-lived access token (15min), long-lived refresh token (7 days)
4. **Logout**: Clear cookies and revoke refresh token

### Authorization Levels

```
SUPER_ADMIN
    │
    ├─→ Can manage multiple companies
    ├─→ Full system access
    └─→ Cannot be restricted

COMPANY_ADMIN (HR Head)
    │
    ├─→ Manage all employees in company
    ├─→ Approve leaves (final level)
    ├─→ Manage master data
    └─→ Generate reports

MANAGER
    │
    ├─→ View team attendance
    ├─→ Approve team leaves (first level)
    └─→ Limited to own department

EMPLOYEE
    │
    ├─→ Mark own attendance
    ├─→ Apply for leaves
    └─→ View own records only
```

### Security Measures

1. **Password Security**
   - bcrypt hashing (10 rounds)
   - Minimum 6 characters
   - Password change tracking

2. **Brute Force Protection**
   - Max 5 login attempts
   - Account lockout for 2 hours
   - Rate limiting on auth routes

3. **Token Security**
   - JWT with secret keys
   - HTTP-only cookies
   - CSRF protection
   - Token rotation

4. **API Security**
   - Helmet.js (security headers)
   - CORS configuration
   - Rate limiting
   - Input validation (Joi)

5. **Data Security**
   - Sensitive fields not returned by default
   - Audit logging
   - Encrypted environment variables

---

## Scalability Considerations

### Current Design (500-5000 employees)

- Single MongoDB instance
- In-memory session management
- Synchronous notification sending

### Future Scaling (5000+ employees)

1. **Database**
   - MongoDB sharding
   - Read replicas
   - Caching layer (Redis)

2. **Application**
   - Horizontal scaling (load balancer)
   - Microservices architecture
   - Message queues (Bull/RabbitMQ)

3. **File Storage**
   - Move to S3/Cloudinary
   - CDN for profile pictures

4. **Background Jobs**
   - Cron jobs for:
     - Leave accrual
     - Yearly balance reset
     - Report generation
     - Notification batching

---

## API Design Principles

### RESTful Conventions

- `GET /resource` - List all
- `GET /resource/:id` - Get one
- `POST /resource` - Create
- `PUT /resource/:id` - Update (full)
- `PATCH /resource/:id` - Update (partial)
- `DELETE /resource/:id` - Delete

### Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

### HTTP Status Codes

- `200` OK
- `201` Created
- `204` No Content
- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `422` Unprocessable Entity
- `429` Too Many Requests
- `500` Internal Server Error

---

## Frontend Architecture

### Component Hierarchy

```
App
│
├─→ ThemeProvider
│   └─→ AuthProvider
│       └─→ SnackbarProvider
│           └─→ Router
│               │
│               ├─→ Public Routes
│               │   └─→ Login
│               │
│               └─→ Protected Routes
│                   └─→ MainLayout
│                       ├─→ AppBar
│                       ├─→ Sidebar (optional)
│                       └─→ Outlet
│                           ├─→ Dashboard
│                           ├─→ Attendance
│                           ├─→ Leave
│                           ├─→ Profile
│                           └─→ Admin (role-based)
```

### State Management

- **Global State**: React Context API
  - `AuthContext` - User authentication
  - `ThemeContext` - Light/Dark mode

- **Local State**: useState + useReducer
  - Component-specific UI state
  - Form state

- **Server State**: Direct API calls with Axios
  - No need for React Query (can be added)

### Routing Strategy

- **Protected Routes**: Require authentication
- **Role-Based Routes**: Check user role
- **Lazy Loading**: Code splitting for performance

---

## DevOps & Deployment

### Development Environment

```bash
# Backend
npm run dev  # nodemon with hot reload

# Frontend
npm run dev  # Vite dev server with HMR
```

### Production Build

```bash
# Backend
NODE_ENV=production node src/server.js

# Frontend
npm run build  # Creates optimized dist/ folder
```

### Recommended Hosting

**Backend:**
- Heroku
- AWS EC2 / ECS
- DigitalOcean
- Railway

**Frontend:**
- Vercel (recommended)
- Netlify
- AWS S3 + CloudFront
- Nginx

**Database:**
- MongoDB Atlas (managed)
- AWS DocumentDB
- Self-hosted MongoDB

---

## Monitoring & Logging

### Application Logging

- Development: `console.log` with Morgan
- Production: Winston or Pino
- Error tracking: Sentry (recommended)

### Audit Logging

All critical actions logged to `auditlogs` collection:
- Who did what and when
- Before/after snapshots
- IP address and user agent

### Performance Monitoring

- Response times
- Database query performance
- API endpoint usage
- Error rates

---

## Testing Strategy

### Backend Testing

```javascript
// Unit tests for services
describe('Face Recognition Service', () => {
  test('should register face successfully', async () => {
    // Test implementation
  });
});

// Integration tests for API endpoints
describe('POST /auth/login', () => {
  test('should return token on valid credentials', async () => {
    // Test implementation
  });
});
```

### Frontend Testing

```javascript
// Component tests
describe('Login Component', () => {
  test('should render login form', () => {
    // Test implementation
  });
});

// Integration tests
describe('Authentication Flow', () => {
  test('should redirect to dashboard after login', () => {
    // Test implementation
  });
});
```

---

## Future Enhancements

### Phase 2

- Mobile app (React Native)
- Real-time notifications (WebSockets)
- Advanced analytics
- Document management

### Phase 3

- Payroll integration
- Performance management
- Recruitment module
- Training management

---

**End of Architecture Documentation**

