# Advanced HR Modules - Implementation Plan 🚀

**Transforming Smart HR into a Complete Enterprise HRMS**

---

## 🎯 Vision

Transform the current MVP into a **comprehensive Enterprise HRMS** with these advanced modules:

1. **Employee Management** - Complete employee lifecycle
2. **Payroll Management** - Salary processing & payslips
3. **Performance Management** - KPIs, reviews, appraisals
4. **Recruitment** - Job posts, applications, interviews
5. **Training & Development** - Courses, certifications, skill tracking
6. **Asset Management** - IT assets, inventory tracking
7. **Expense Management** - Claims, reimbursements, approvals
8. **Document Management** - Contracts, policies, employee docs
9. **Time Tracking & Projects** - Timesheets, billable hours, project management
10. **Advanced Analytics** - Dashboards, reports, insights
11. **Self-Service Portal** - Employee & Manager portals
12. **Organizational Structure** - Org charts, hierarchies

---

## 📊 Module 1: Employee Management (Priority: CRITICAL)

### Features:
- ✅ **Employee CRUD Operations**
  - Add new employee (with wizard)
  - Edit employee details
  - Bulk import (CSV/Excel)
  - Employee search & filters
  - Employee directory with photos

- ✅ **Employee Profile**
  - Personal information
  - Contact details
  - Emergency contacts
  - Family members
  - Education history
  - Work experience
  - Skills & certifications
  - Documents repository

- ✅ **Onboarding Workflow**
  - Welcome email
  - Document collection checklist
  - Asset assignment
  - Access provisioning
  - Training assignment
  - Buddy assignment

- ✅ **Offboarding Workflow**
  - Exit interview
  - Asset return
  - Access revocation
  - Final settlement calculation
  - Clearance checklist

### Database Schema:

```javascript
// employees (extended)
{
  // ... existing fields ...

  // Personal
  middleName: String,
  gender: String,
  maritalStatus: String,
  nationality: String,
  religion: String,
  bloodGroup: String,

  // Contact
  personalEmail: String,
  alternatePhone: String,
  permanentAddress: Object,
  currentAddress: Object,

  // Emergency
  emergencyContacts: [{
    name: String,
    relationship: String,
    phone: String,
    address: String
  }],

  // Employment
  employmentType: String, // FULL_TIME, CONTRACT, INTERN
  probationEndDate: Date,
  confirmationDate: Date,
  noticePeriod: Number, // days
  reportingManager: ObjectId,
  previousEmployer: String,
  experienceYears: Number,

  // Bank
  bankName: String,
  accountNumber: String,
  ifscCode: String,
  panNumber: String,
  aadharNumber: String,
  pfNumber: String,
  esiNumber: String,

  // Documents
  documents: [{
    type: String, // AADHAR, PAN, DEGREE, etc.
    fileName: String,
    fileUrl: String,
    uploadedDate: Date,
    expiryDate: Date,
    status: String // PENDING, VERIFIED, REJECTED
  }],

  // Family
  familyMembers: [{
    name: String,
    relationship: String,
    dateOfBirth: Date,
    occupation: String,
    dependent: Boolean
  }],

  // Education
  education: [{
    degree: String,
    institution: String,
    fieldOfStudy: String,
    startYear: Number,
    endYear: Number,
    percentage: Number
  }],

  // Skills
  skills: [{
    skillName: String,
    level: String, // BEGINNER, INTERMEDIATE, EXPERT
    yearsOfExperience: Number
  }],

  // Onboarding
  onboardingStatus: String, // PENDING, IN_PROGRESS, COMPLETED
  onboardingTasks: [{
    task: String,
    completed: Boolean,
    completedDate: Date
  }],

  // Status
  exitDate: Date,
  exitReason: String,
  rehireEligible: Boolean
}
```

---

## 💰 Module 2: Payroll Management (Priority: HIGH)

### Features:
- ✅ **Salary Structure**
  - Multiple salary components (Basic, HRA, DA, etc.)
  - Tax calculation (TDS)
  - Deductions (PF, ESI, Insurance)
  - Allowances & benefits
  - CTC breakdown

- ✅ **Payroll Processing**
  - Monthly salary calculation
  - Attendance-based salary
  - Leave deductions
  - Overtime calculation
  - Loan deductions
  - Advance adjustments
  - Bonus & incentives

- ✅ **Payslips**
  - Monthly payslip generation
  - Email payslips to employees
  - Download PDF payslips
  - YTD (Year-to-Date) summary
  - Form 16 generation

- ✅ **Salary Revisions**
  - Annual increments
  - Promotion-based hikes
  - Revision history tracking
  - Bulk salary updates

### Database Schema:

```javascript
// salaryStructures
{
  employee: ObjectId(employees),
  effectiveFrom: Date,
  ctc: Number,
  components: [{
    name: String, // BASIC, HRA, DA, etc.
    type: String, // EARNING, DEDUCTION
    calculationType: String, // FIXED, PERCENTAGE
    value: Number,
    isMonthly: Boolean
  }],
  deductions: [{
    name: String, // PF, ESI, TAX, etc.
    type: String,
    value: Number,
    mandatory: Boolean
  }],
  isActive: Boolean,
  createdBy: ObjectId(employees)
}

// payrollRuns
{
  month: Number,
  year: Number,
  status: String, // DRAFT, PROCESSED, APPROVED, PAID
  processedDate: Date,
  approvedBy: ObjectId(employees),
  approvedDate: Date,
  totalEmployees: Number,
  totalAmount: Number,
  paymentDate: Date
}

// payslips
{
  employee: ObjectId(employees),
  payrollRun: ObjectId(payrollRuns),
  month: Number,
  year: Number,
  workingDays: Number,
  presentDays: Number,
  paidDays: Number,
  leaveDays: Number,

  earnings: [{
    component: String,
    amount: Number
  }],

  deductions: [{
    component: String,
    amount: Number
  }],

  grossSalary: Number,
  totalDeductions: Number,
  netSalary: Number,

  ytd: {
    grossSalary: Number,
    deductions: Number,
    netSalary: Number
  },

  status: String, // GENERATED, SENT, VIEWED
  generatedDate: Date,
  sentDate: Date,
  viewedDate: Date
}

// loans
{
  employee: ObjectId(employees),
  loanType: String, // PERSONAL, VEHICLE, HOME
  loanAmount: Number,
  interestRate: Number,
  tenureMonths: Number,
  emiAmount: Number,
  disbursedDate: Date,
  status: String, // ACTIVE, CLOSED, DEFAULTED
  remainingAmount: Number,

  installments: [{
    month: Number,
    year: Number,
    amount: Number,
    principal: Number,
    interest: Number,
    paid: Boolean,
    paidDate: Date
  }]
}
```

---

## 📈 Module 3: Performance Management (Priority: HIGH)

### Features:
- ✅ **Goal Setting (OKRs/KPIs)**
  - Individual goals
  - Team goals
  - Company goals
  - Goal alignment
  - Progress tracking
  - Goal weightage

- ✅ **Performance Reviews**
  - Self-appraisal
  - Manager review
  - 360-degree feedback
  - Peer reviews
  - Rating scales (1-5, A-D, etc.)
  - Review templates
  - Review cycles (Quarterly, Annually)

- ✅ **Appraisals**
  - Rating normalization
  - Bell curve distribution
  - Increment recommendations
  - Promotion recommendations
  - Performance improvement plans (PIP)

- ✅ **Continuous Feedback**
  - One-on-one meetings
  - Feedback requests
  - Recognition & appreciation
  - Skill assessments

### Database Schema:

```javascript
// goals
{
  employee: ObjectId(employees),
  reviewCycle: ObjectId(reviewCycles),
  title: String,
  description: String,
  type: String, // INDIVIDUAL, TEAM, COMPANY
  category: String, // OKR, KPI, SMART

  targetValue: Number,
  currentValue: Number,
  unit: String, // PERCENTAGE, NUMBER, BOOLEAN

  weightage: Number, // 1-100
  priority: String, // HIGH, MEDIUM, LOW

  startDate: Date,
  endDate: Date,

  status: String, // NOT_STARTED, IN_PROGRESS, COMPLETED, ABANDONED

  keyResults: [{
    description: String,
    targetValue: Number,
    currentValue: Number,
    completed: Boolean
  }],

  alignedGoals: [ObjectId(goals)], // Parent/child goals

  createdBy: ObjectId(employees),
  approvedBy: ObjectId(employees)
}

// reviewCycles
{
  name: String, // Q1 2024, Annual 2024
  type: String, // QUARTERLY, HALF_YEARLY, ANNUAL
  startDate: Date,
  endDate: Date,
  selfAppraisalDeadline: Date,
  managerReviewDeadline: Date,
  normalizationDeadline: Date,
  status: String, // ACTIVE, COMPLETED, CANCELLED
  participants: [ObjectId(employees)]
}

// performanceReviews
{
  employee: ObjectId(employees),
  reviewCycle: ObjectId(reviewCycles),
  reviewer: ObjectId(employees),
  reviewerType: String, // SELF, MANAGER, PEER, SKIP_LEVEL

  goals: [{
    goal: ObjectId(goals),
    rating: Number, // 1-5
    comments: String,
    achievements: String
  }],

  competencies: [{
    name: String, // COMMUNICATION, LEADERSHIP, etc.
    rating: Number,
    comments: String
  }],

  overallRating: Number,
  normalizedRating: Number,

  strengths: String,
  areasOfImprovement: String,
  trainingNeeds: String,

  incrementRecommendation: Number, // percentage
  promotionRecommendation: Boolean,

  status: String, // DRAFT, SUBMITTED, ACKNOWLEDGED

  submittedDate: Date,
  acknowledgedDate: Date
}

// feedback
{
  from: ObjectId(employees),
  to: ObjectId(employees),
  type: String, // APPRECIATION, CONSTRUCTIVE, REQUEST
  category: String, // COMMUNICATION, TEAMWORK, etc.
  message: String,
  isAnonymous: Boolean,
  isPublic: Boolean,
  createdDate: Date,
  acknowledged: Boolean
}
```

---

## 👔 Module 4: Recruitment (Priority: MEDIUM)

### Features:
- ✅ **Job Requisitions**
  - Create job openings
  - Job description templates
  - Approval workflow
  - Budget allocation
  - Hiring team

- ✅ **Applicant Tracking**
  - Career portal integration
  - Application forms
  - Resume parsing
  - Candidate database
  - Application stages (Applied, Screening, Interview, Offer, etc.)
  - Bulk actions (shortlist, reject)

- ✅ **Interview Management**
  - Interview scheduling
  - Calendar integration
  - Interview panels
  - Interview feedback forms
  - Scorecards
  - Video interview links

- ✅ **Offer Management**
  - Offer letter templates
  - Offer approval workflow
  - E-signature integration
  - Offer negotiation tracking
  - Offer acceptance/rejection

### Database Schema:

```javascript
// jobOpenings
{
  title: String,
  department: ObjectId(departments),
  designation: ObjectId(designations),
  employmentType: String, // FULL_TIME, CONTRACT, INTERN

  numberOfPositions: Number,
  experienceMin: Number,
  experienceMax: Number,
  salaryMin: Number,
  salaryMax: Number,

  jobDescription: String,
  responsibilities: [String],
  requirements: [String],
  skills: [String],

  location: String,
  isRemote: Boolean,

  status: String, // OPEN, CLOSED, ON_HOLD, FILLED

  hiringManager: ObjectId(employees),
  recruiters: [ObjectId(employees)],

  publishedDate: Date,
  closedDate: Date,

  source: String // INTERNAL, EXTERNAL, REFERRAL
}

// applications
{
  jobOpening: ObjectId(jobOpenings),

  // Candidate Info
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  currentLocation: String,

  // Professional
  currentCompany: String,
  currentDesignation: String,
  totalExperience: Number,
  currentSalary: Number,
  expectedSalary: Number,
  noticePeriod: Number,

  // Documents
  resumeUrl: String,
  coverLetterUrl: String,
  portfolioUrl: String,
  linkedinUrl: String,

  // Tracking
  source: String, // CAREERS_PAGE, LINKEDIN, NAUKRI, REFERRAL
  referredBy: ObjectId(employees),

  stage: String, // APPLIED, SCREENING, INTERVIEW, OFFER, HIRED, REJECTED
  status: String, // ACTIVE, REJECTED, WITHDRAWN, HIRED

  appliedDate: Date,

  tags: [String],
  rating: Number,
  notes: String
}

// interviews
{
  application: ObjectId(applications),
  round: Number,
  type: String, // PHONE, VIDEO, IN_PERSON, TECHNICAL, HR

  scheduledDate: Date,
  duration: Number, // minutes
  location: String,
  meetingLink: String,

  interviewers: [{
    interviewer: ObjectId(employees),
    role: String, // INTERVIEWER, OBSERVER
    feedback: String,
    rating: Number,
    recommendation: String // STRONG_HIRE, HIRE, NO_HIRE, STRONG_NO_HIRE
  }],

  status: String, // SCHEDULED, COMPLETED, CANCELLED, NO_SHOW

  overallRating: Number,
  outcome: String, // PROCEED, REJECT, HOLD

  createdBy: ObjectId(employees)
}

// offers
{
  application: ObjectId(applications),

  designation: ObjectId(designations),
  department: ObjectId(departments),
  joiningDate: Date,

  ctc: Number,
  salaryComponents: Object,

  offerLetterUrl: String,
  offerSentDate: Date,
  offerExpiryDate: Date,

  status: String, // DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED

  acceptedDate: Date,
  rejectedDate: Date,
  rejectionReason: String,

  approvedBy: ObjectId(employees),
  approvedDate: Date
}
```

---

## 📚 Module 5: Training & Development (Priority: MEDIUM)

### Features:
- ✅ **Training Catalog**
  - Course library
  - Internal & external courses
  - Course categories
  - Instructor profiles
  - Course materials (videos, PDFs)

- ✅ **Training Programs**
  - Onboarding training
  - Compliance training
  - Skill development
  - Leadership programs
  - Certification courses

- ✅ **Training Management**
  - Training calendar
  - Session scheduling
  - Attendance tracking
  - Training nominations
  - Approval workflow

- ✅ **Skill Matrix**
  - Skill inventory
  - Skill gap analysis
  - Individual development plans
  - Career progression paths

### Database Schema:

```javascript
// courses
{
  title: String,
  description: String,
  category: String, // TECHNICAL, SOFT_SKILLS, COMPLIANCE, etc.
  type: String, // ONLINE, CLASSROOM, WORKSHOP, CERTIFICATION

  duration: Number, // hours
  level: String, // BEGINNER, INTERMEDIATE, ADVANCED

  instructor: String,
  provider: String, // INTERNAL, EXTERNAL

  materials: [{
    title: String,
    type: String, // VIDEO, PDF, LINK
    url: String
  }],

  capacity: Number,
  cost: Number,

  isActive: Boolean,
  isMandatory: Boolean,

  tags: [String],
  prerequisites: [ObjectId(courses)]
}

// trainingSessions
{
  course: ObjectId(courses),
  title: String,

  startDate: Date,
  endDate: Date,
  schedule: [{
    date: Date,
    startTime: String,
    endTime: String,
    location: String
  }],

  instructor: String,
  maxParticipants: Number,

  status: String, // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED

  enrollments: [{
    employee: ObjectId(employees),
    nominatedBy: ObjectId(employees),
    status: String, // PENDING, APPROVED, REJECTED
    attended: Boolean,
    completionStatus: String, // NOT_STARTED, IN_PROGRESS, COMPLETED
    score: Number,
    feedback: String,
    certificateUrl: String
  }]
}

// skillMatrix
{
  employee: ObjectId(employees),

  skills: [{
    skillName: String,
    category: String, // TECHNICAL, SOFT_SKILL, DOMAIN
    currentLevel: String, // BEGINNER, INTERMEDIATE, EXPERT
    targetLevel: String,
    lastAssessedDate: Date,
    assessedBy: ObjectId(employees)
  }],

  developmentPlan: [{
    skill: String,
    targetLevel: String,
    actions: String,
    targetDate: Date,
    status: String // PLANNED, IN_PROGRESS, COMPLETED
  }]
}
```

---

## 💼 Module 6: Asset Management (Priority: MEDIUM)

### Features:
- ✅ **Asset Inventory**
  - Laptops, phones, monitors
  - Software licenses
  - Office equipment
  - Vehicles
  - Asset categories

- ✅ **Asset Assignment**
  - Assign to employees
  - Assignment history
  - Return tracking
  - Transfer between employees

- ✅ **Asset Maintenance**
  - Warranty tracking
  - AMC details
  - Repair history
  - Vendor management

### Database Schema:

```javascript
// assets
{
  assetCode: String,
  name: String,
  category: String, // LAPTOP, PHONE, MONITOR, etc.
  brand: String,
  model: String,
  serialNumber: String,

  purchaseDate: Date,
  purchasePrice: Number,
  vendor: String,
  invoiceNumber: String,

  warrantyExpiryDate: Date,
  amcExpiryDate: Date,

  status: String, // AVAILABLE, ASSIGNED, IN_REPAIR, RETIRED
  condition: String, // NEW, GOOD, FAIR, POOR

  specifications: Object,

  location: String,
  currentHolder: ObjectId(employees),

  assignmentHistory: [{
    employee: ObjectId(employees),
    assignedDate: Date,
    returnedDate: Date,
    condition: String,
    remarks: String
  }],

  maintenanceHistory: [{
    date: Date,
    type: String, // REPAIR, SERVICE, UPGRADE
    description: String,
    cost: Number,
    vendor: String
  }]
}
```

---

## 💳 Module 7: Expense Management (Priority: MEDIUM)

### Features:
- ✅ **Expense Claims**
  - Travel expenses
  - Food & accommodation
  - Client entertainment
  - Medical reimbursements
  - Receipt uploads

- ✅ **Approval Workflow**
  - Multi-level approval
  - Budget checks
  - Policy compliance
  - Auto-approval rules

- ✅ **Reimbursement**
  - Payment processing
  - Bank transfer integration
  - Settlement tracking

### Database Schema:

```javascript
// expenseClaims
{
  employee: ObjectId(employees),
  claimDate: Date,

  category: String, // TRAVEL, FOOD, MEDICAL, etc.

  items: [{
    date: Date,
    category: String,
    description: String,
    amount: Number,
    receiptUrl: String,
    billable: Boolean
  }],

  totalAmount: Number,
  approvedAmount: Number,

  approvalChain: [{
    approver: ObjectId(employees),
    level: Number,
    status: String,
    comments: String,
    actionDate: Date
  }],

  status: String, // DRAFT, SUBMITTED, APPROVED, REJECTED, PAID

  paidDate: Date,
  paymentReference: String
}
```

---

## 🕐 Module 8: Time Tracking & Projects (Priority: LOW)

### Features:
- ✅ **Time Tracking**
  - Daily timesheets
  - Project-wise time logging
  - Task-wise time tracking
  - Billable vs non-billable hours

- ✅ **Project Management**
  - Project creation
  - Project teams
  - Milestones & tasks
  - Project time budgets

### Database Schema:

```javascript
// projects
{
  name: String,
  code: String,
  client: String,

  startDate: Date,
  endDate: Date,

  manager: ObjectId(employees),
  team: [ObjectId(employees)],

  budgetHours: Number,
  billingRate: Number,
  isBillable: Boolean,

  status: String // ACTIVE, COMPLETED, ON_HOLD
}

// timesheets
{
  employee: ObjectId(employees),
  date: Date,

  entries: [{
    project: ObjectId(projects),
    task: String,
    hours: Number,
    description: String,
    isBillable: Boolean
  }],

  totalHours: Number,

  status: String, // DRAFT, SUBMITTED, APPROVED
  approvedBy: ObjectId(employees)
}
```

---

## 📊 Implementation Priority

### Phase 1 (Week 1-2): Foundation
1. **Employee Management** - CRUD + Profile
2. **Document Upload** - S3/Cloudinary integration
3. **Advanced Search & Filters**

### Phase 2 (Week 3-4): Financial
4. **Payroll Management** - Salary structure + Payslip generation
5. **Expense Management** - Claims + Approvals

### Phase 3 (Week 5-6): Performance
6. **Performance Management** - Goals + Reviews
7. **Training & Development** - Courses + Sessions

### Phase 4 (Week 7-8): Recruitment
8. **Recruitment Module** - Job posts + Applications + Interviews
9. **Asset Management** - Inventory + Assignment

### Phase 5 (Week 9-10): Analytics & Polish
10. **Advanced Analytics** - Custom reports, charts
11. **Self-Service Portal** - Employee/Manager dashboards
12. **Mobile Optimization** - Responsive improvements

---

## 🎯 Success Metrics

After implementation, the system will have:

- ✅ **12+ Modules** (vs current 3)
- ✅ **50+ API Endpoints** (vs current 15)
- ✅ **30+ Frontend Pages** (vs current 5)
- ✅ **15+ Database Collections** (vs current 10)
- ✅ **Complete Employee Lifecycle Management**
- ✅ **End-to-End Payroll Processing**
- ✅ **Comprehensive Reporting & Analytics**

---

**Ready to start implementation?** Let me know which module you want to build first!

**Recommended Order:**
1. Employee Management (Critical foundation)
2. Payroll Management (High business value)
3. Performance Management (Competitive differentiator)
