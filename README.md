# Smart HR + Attendance System 🏢

A full-featured **Corporate HR & Attendance Management System** built with the **MERN stack** (MongoDB, Express.js, React.js, Node.js) featuring **Face Recognition** attendance and comprehensive **Leave Management**.

---

## 🎯 Features

### Core Features

✅ **Smart Attendance with Face Recognition**
- Webcam-based punch in/out with face verification
- Support for office and Work From Home (WFH) attendance
- Automatic late marking and early exit detection
- Manual attendance correction by HR with audit trail
- Real-time attendance status tracking

✅ **Comprehensive Leave Management**
- Multiple leave types (Casual, Sick, Earned, LOP, etc.)
- Multi-level approval workflow (Manager → HR)
- Real-time leave balance calculation
- Leave calendar and team view
- Integration with attendance system

✅ **HR & Admin Dashboard**
- Real-time KPIs (Present, Absent, WFH, On Leave)
- Interactive charts and analytics
- Bulk employee management
- Report exports (CSV/Excel ready)
- Master data management (Departments, Shifts, Holidays)

✅ **Employee Self-Service Portal**
- Personal dashboard with quick actions
- Attendance history (calendar & list view)
- Leave application and tracking
- Profile management
- Leave balance overview

### Enterprise Features

🔐 **Security & Access Control**
- JWT-based authentication with HTTP-only cookies
- Role-based access control (Super Admin, Company Admin, Manager, Employee)
- Password hashing with bcrypt
- Rate limiting and brute-force protection

📊 **Advanced Features**
- Complete audit logging
- Pluggable notification system (Email/SMS/WhatsApp)
- Shift management (Fixed, Rotational, Flexible)
- Geo/IP restrictions for check-in
- Configurable attendance policies
- Dark/Light theme support

---

## 🏗️ Tech Stack

### Backend
- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcrypt, helmet, cors
- **Validation**: Joi
- **Rate Limiting**: express-rate-limit

### Frontend
- **Library**: React 18
- **Build Tool**: Vite
- **UI Framework**: Material-UI (MUI v5)
- **Routing**: React Router v6
- **State Management**: Context API + Hooks
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form + Zod
- **Webcam**: react-webcam
- **Notifications**: notistack

### Face Recognition
- **Current**: Mock implementation (for development)
- **Pluggable**: Ready for AWS Rekognition, Azure Face API, or Face++

---

## 📁 Project Structure

```
smart-hr/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & constants
│   │   ├── models/          # Mongoose schemas
│   │   ├── controllers/     # Business logic
│   │   ├── routes/          # API routes
│   │   ├── middlewares/     # Auth, validation, error handling
│   │   ├── services/        # Face recognition, notifications, audit
│   │   ├── utils/           # Helper functions
│   │   └── server.js        # Entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   ├── routes/          # Routing config
│   │   ├── layouts/         # Layout components
│   │   ├── utils/           # Helper functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── IMPLEMENTATION_GUIDE.md  # Backend code reference
├── FRONTEND_GUIDE.md        # Frontend code reference
└── README.md               # This file
```

---

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:

- **Node.js** v16 or higher ([Download](https://nodejs.org/))
- **MongoDB** v5 or higher ([Download](https://www.mongodb.com/try/download/community))
- **Git** ([Download](https://git-scm.com/))

### Installation

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd smart-hr
```

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your configuration
# At minimum, set:
# - MONGODB_URI
# - JWT_SECRET
# - JWT_REFRESH_SECRET
```

**Backend .env Configuration:**

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-hr
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this_in_production
FACE_RECOGNITION_PROVIDER=mock
EMAIL_PROVIDER=mock
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

#### 3. Frontend Setup

```bash
# Navigate to frontend directory (from root)
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file
```

**Frontend .env Configuration:**

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_APP_NAME=Smart HR
VITE_ENABLE_FACE_RECOGNITION=true
```

#### 4. Start MongoDB

```bash
# If using MongoDB service
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
# Or start MongoDB Compass for Windows
```

#### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Backend will run on [http://localhost:5000](http://localhost:5000)

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Frontend will run on [http://localhost:3000](http://localhost:3000)

---

## 🌐 Live Demo

**Frontend:** <https://smart-hr-snowy.vercel.app>
**Backend API:** <https://smart-hr-pbxi.onrender.com>

### Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@acme.com` | *(contact owner)* |
| **Manager** | `manager@acme.com` | `password123` |
| **Employee** | `john@acme.com` | `password123` |

> **Note:** The demo is hosted on free tier services. The backend may take 30-60 seconds to wake up on first request.

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "EMPLOYEE"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <token>
```

### Attendance Endpoints

#### Register Face
```http
POST /attendance/register-face
Authorization: Bearer <token>
Content-Type: application/json

{
  "faceImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

#### Punch In
```http
POST /attendance/punch-in
Authorization: Bearer <token>
Content-Type: application/json

{
  "faceImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "isWFH": false
}
```

#### Punch Out
```http
POST /attendance/punch-out
Authorization: Bearer <token>
Content-Type: application/json

{
  "faceImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

#### Get My Attendance
```http
GET /attendance/my-attendance?month=11&year=2024&page=1&limit=31
Authorization: Bearer <token>
```

#### Get Today's Status
```http
GET /attendance/today-status
Authorization: Bearer <token>
```

### Leave Endpoints

#### Apply Leave
```http
POST /leaves/apply
Authorization: Bearer <token>
Content-Type: application/json

{
  "leaveTypeId": "65abc123...",
  "fromDate": "2024-12-01",
  "toDate": "2024-12-03",
  "isHalfDay": false,
  "reason": "Family emergency"
}
```

#### Get My Leaves
```http
GET /leaves/my-leaves?status=PENDING&page=1&limit=10
Authorization: Bearer <token>
```

#### Get Leave Balance
```http
GET /leaves/balance
Authorization: Bearer <token>
```

#### Approve/Reject Leave (Manager/HR only)
```http
PUT /leaves/:leaveId/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "APPROVED",
  "comments": "Approved"
}
```

---

## 🔧 Configuration

### Attendance Rules

Configure in Company settings or backend constants:

```javascript
ATTENDANCE_RULES = {
  GRACE_MINUTES: 15,
  LATE_MARK_THRESHOLD: 15,
  HALF_DAY_HOURS: 4,
  FULL_DAY_HOURS: 8,
  MAX_WFH_PER_MONTH: 10,
}
```

### Shift Configuration

Create shifts via admin panel or directly in database:

```javascript
{
  name: "General Shift",
  code: "GEN",
  startTime: "09:00",
  endTime: "18:00",
  graceMinutes: 15,
  halfDayHours: 4,
  fullDayHours: 8,
  weeklyOffs: [0, 6]  // Sunday, Saturday
}
```

### Leave Types

Configure leave types with:
- Yearly quota
- Carry forward rules
- Approval levels
- Paid/Unpaid status

---

## 🔌 Integrating Real Face Recognition

The system is designed to be provider-agnostic. To integrate a real face recognition provider:

### Option 1: AWS Rekognition

1. Install AWS SDK:
```bash
npm install aws-sdk
```

2. Set environment variables:
```env
FACE_RECOGNITION_PROVIDER=aws_rekognition
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REKOGNITION_COLLECTION_ID=smart-hr-faces
```

3. The service will automatically use AWS Rekognition implementation (code structure already in place in `faceRecognitionService.js`).

### Option 2: Azure Face API

```env
FACE_RECOGNITION_PROVIDER=azure_face
AZURE_FACE_API_KEY=your_api_key
AZURE_FACE_ENDPOINT=https://your-resource.cognitiveservices.azure.com
```

### Option 3: Face++

```env
FACE_RECOGNITION_PROVIDER=face_plus_plus
FACEPP_API_KEY=your_api_key
FACEPP_API_SECRET=your_api_secret
```

---

## 📧 Email Integration

### Using SMTP (e.g., Gmail)

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@smarthr.com
```

For Gmail, create an [App Password](https://support.google.com/accounts/answer/185833).

---

## 🎨 Customization

### Theme Customization

Edit `frontend/src/contexts/ThemeContext.jsx`:

```javascript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',  // Your brand color
    },
    secondary: {
      main: '#9c27b0',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Arial", sans-serif',
  },
});
```

### Adding New Leave Types

Via Admin Panel or database:

```javascript
{
  name: "Parental Leave",
  code: "PARENTAL",
  yearlyQuota: 90,
  isPaid: true,
  isCarryForward: false,
  requiresApproval: true,
  approvalLevels: 2,
}
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

---

## 📦 Production Deployment

### Backend Deployment

1. **Environment Variables**: Set production values in your hosting platform
2. **Database**: Use MongoDB Atlas or managed MongoDB
3. **Security**:
   - Set strong JWT secrets
   - Enable HTTPS only
   - Configure CORS properly
   - Set rate limits appropriately

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/smart-hr
JWT_SECRET=super_strong_production_secret_change_this
COOKIE_SECURE=true
CORS_ORIGINS=https://yourapp.com
```

### Frontend Deployment

1. Build the app:
```bash
cd frontend
npm run build
```

2. Deploy `dist` folder to:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Your own server (Nginx)

3. Update environment variables:
```env
VITE_API_URL=https://api.yourapp.com/api/v1
```

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Email: support@smarthr.com
- Documentation: See `IMPLEMENTATION_GUIDE.md` and `FRONTEND_GUIDE.md`

---

## 🗺️ Roadmap

### Upcoming Features

- [ ] Mobile app (React Native)
- [ ] Biometric authentication
- [ ] Advanced analytics & reports
- [ ] Payroll integration
- [ ] Multi-company support
- [ ] Real-time notifications (WebSockets)
- [ ] Document management
- [ ] Performance management
- [ ] Recruitment module

---

## 🙏 Acknowledgments

- **Material-UI** for the beautiful UI components
- **MongoDB** for the flexible database
- **React** for the amazing frontend library
- **Express.js** for the robust backend framework

---

**Built with ❤️ using the MERN Stack**

