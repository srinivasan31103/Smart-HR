# Production Setup Guide - Smart HR System

This guide will walk you through setting up the Smart HR system for production deployment with real services.

---

## 📋 Prerequisites

Before starting, you'll need accounts for:

- ✅ MongoDB Atlas (Database)
- ✅ AWS Account (Face Recognition + File Storage) OR Azure/Face++
- ✅ Email Service (Gmail/SendGrid/AWS SES)
- ✅ Twilio Account (SMS/WhatsApp - Optional)
- ✅ Domain name (for frontend)
- ✅ Hosting platform (AWS/Heroku/DigitalOcean/Vercel)

---

## 🔐 Step 1: Generate Strong JWT Secrets

### Method 1: Using Node.js (Recommended)

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate Refresh Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate Cookie Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy each output and save them - you'll need these in your `.env` file.

### Method 2: Using OpenSSL

```bash
openssl rand -hex 64
```

Run this 3 times to generate 3 different secrets.

### Method 3: Using Online Tool

Go to: https://www.grc.com/passwords.htm
- Use the "63 random alpha-numeric characters" section
- Generate 3 different passwords

---

## 🗄️ Step 2: Setup MongoDB Atlas (Cloud Database)

### 2.1 Create Account & Cluster

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for free account
3. Create a new cluster:
   - Choose **FREE** tier (M0 Sandbox)
   - Select cloud provider (AWS/GCP/Azure)
   - Choose region closest to your users
   - Cluster name: `smart-hr-prod`

### 2.2 Create Database User

1. Click **Database Access** (left sidebar)
2. Click **Add New Database User**
3. Choose **Password** authentication
4. Username: `smarthr_admin` (or your choice)
5. Password: Generate a strong password (save this!)
6. Database User Privileges: **Atlas Admin** or **Read and write to any database**
7. Click **Add User**

### 2.3 Whitelist IP Address

1. Click **Network Access** (left sidebar)
2. Click **Add IP Address**
3. Option A: **Allow Access from Anywhere** (0.0.0.0/0) - easier but less secure
4. Option B: Add your server's specific IP address - more secure
5. Click **Confirm**

### 2.4 Get Connection String

1. Click **Database** (left sidebar)
2. Click **Connect** button on your cluster
3. Choose **Connect your application**
4. Copy the connection string, it looks like:
   ```
   mongodb+srv://smarthr_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual database user password
6. Add database name before the `?`:
   ```
   mongodb+srv://smarthr_admin:YourPassword123@cluster0.xxxxx.mongodb.net/smart-hr-prod?retryWrites=true&w=majority
   ```

**Save this connection string!**

---

## 👤 Step 3: Setup Face Recognition Service

### Option A: AWS Rekognition (Recommended)

#### 3.1 Create AWS Account
1. Go to https://aws.amazon.com/
2. Sign up (requires credit card, but has free tier)

#### 3.2 Create IAM User
1. Go to **IAM** service
2. Click **Users** → **Add users**
3. Username: `smarthr-rekognition`
4. Access type: **Programmatic access**
5. Click **Next: Permissions**
6. Attach policies directly: Search and select:
   - `AmazonRekognitionFullAccess`
   - `AmazonS3FullAccess` (for file storage)
7. Click through and **Create user**
8. **IMPORTANT**: Download or copy:
   - Access key ID
   - Secret access key
   (You won't see the secret key again!)

#### 3.3 Create Rekognition Collection
1. Go to **AWS CLI** or use AWS Console
2. Run this command (or use AWS Console):
   ```bash
   aws rekognition create-collection \
     --collection-id smart-hr-faces-prod \
     --region us-east-1
   ```
3. Note your collection ID: `smart-hr-faces-prod`

#### 3.4 Update .env
```env
FACE_RECOGNITION_PROVIDER=aws_rekognition
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REKOGNITION_COLLECTION_ID=smart-hr-faces-prod
```

---

### Option B: Azure Face API

#### 3.1 Create Azure Account
1. Go to https://azure.microsoft.com/
2. Sign up (free tier available)

#### 3.2 Create Face Resource
1. Go to **Azure Portal**
2. Click **Create a resource**
3. Search for **Face**
4. Click **Create**
5. Fill in:
   - Resource group: Create new or use existing
   - Region: Choose closest to your users
   - Name: `smarthr-face-api`
   - Pricing tier: **Free F0** (30 transactions/min)
6. Click **Review + create**

#### 3.3 Get API Key
1. Go to your Face resource
2. Click **Keys and Endpoint** (left sidebar)
3. Copy:
   - Key 1 (or Key 2)
   - Endpoint URL

#### 3.4 Update .env
```env
FACE_RECOGNITION_PROVIDER=azure_face
AZURE_FACE_API_KEY=your_32_character_key_here
AZURE_FACE_ENDPOINT=https://smarthr-face-api.cognitiveservices.azure.com
```

---

### Option C: Face++ (Alternative)

#### 3.1 Sign Up
1. Go to https://www.faceplusplus.com/
2. Register for account
3. Verify email

#### 3.2 Create API Application
1. Go to **Console** → **Applications**
2. Create new application
3. Copy:
   - API Key
   - API Secret

#### 3.3 Update .env
```env
FACE_RECOGNITION_PROVIDER=face_plus_plus
FACEPP_API_KEY=your_api_key
FACEPP_API_SECRET=your_api_secret
```

---

## 📁 Step 4: Setup File Storage

### Option A: AWS S3 (Using same AWS account)

#### 4.1 Create S3 Bucket
1. Go to **S3** service in AWS
2. Click **Create bucket**
3. Bucket name: `smarthr-files-prod` (must be globally unique)
4. Region: Same as your Rekognition region
5. Block Public Access: **Uncheck** "Block all public access"
   - Check the acknowledgment
6. Click **Create bucket**

#### 4.2 Configure Bucket Policy
1. Click on your bucket
2. Go to **Permissions** tab
3. Click **Bucket Policy**
4. Add this policy (replace `smarthr-files-prod` with your bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::smarthr-files-prod/public/*"
    }
  ]
}
```

#### 4.3 Update .env
```env
STORAGE_PROVIDER=s3
AWS_S3_BUCKET=smarthr-files-prod
AWS_S3_REGION=us-east-1
# Use same AWS credentials as Rekognition
```

---

### Option B: Cloudinary

#### 4.1 Sign Up
1. Go to https://cloudinary.com/
2. Sign up for free account
3. Verify email

#### 4.2 Get Credentials
1. Go to **Dashboard**
2. Copy:
   - Cloud name
   - API Key
   - API Secret

#### 4.3 Update .env
```env
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_secret_here
```

---

## 📧 Step 5: Setup Email Service

### Option A: Gmail SMTP (Quick & Easy)

#### 5.1 Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification**

#### 5.2 Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select app: **Mail**
3. Select device: **Other (Custom name)**
4. Name it: `Smart HR System`
5. Click **Generate**
6. Copy the 16-character password (no spaces)

#### 5.3 Update .env
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
EMAIL_FROM=Smart HR <noreply@yourcompany.com>
```

---

### Option B: SendGrid (Recommended for Production)

#### 5.1 Sign Up
1. Go to https://sendgrid.com/
2. Sign up for free (100 emails/day)
3. Verify email and complete setup

#### 5.2 Create API Key
1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name: `Smart HR Production`
4. Permissions: **Full Access**
5. Click **Create & View**
6. **Copy the API key** (you won't see it again!)

#### 5.3 Verify Sender Identity
1. Go to **Settings** → **Sender Authentication**
2. Choose **Single Sender Verification**
3. Add your email address
4. Verify the email you receive

#### 5.4 Update .env
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=Smart HR <noreply@yourcompany.com>
```

---

### Option C: AWS SES

#### 5.1 Setup SES
1. Go to **Amazon SES** in AWS Console
2. Click **Verify a New Email Address**
3. Enter your email and verify it
4. (For production) Verify your domain

#### 5.2 Create SMTP Credentials
1. Click **SMTP Settings** (left sidebar)
2. Click **Create My SMTP Credentials**
3. Download or copy credentials

#### 5.3 Update .env
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
EMAIL_FROM=Smart HR <noreply@yourcompany.com>
```

---

## 📱 Step 6: Setup SMS/WhatsApp (Optional)

### Twilio Setup

#### 6.1 Create Account
1. Go to https://www.twilio.com/
2. Sign up (free trial available)
3. Verify your email and phone

#### 6.2 Get Credentials
1. Go to **Console Dashboard**
2. Copy:
   - Account SID
   - Auth Token

#### 6.3 Get Phone Number
1. Click **Phone Numbers** → **Buy a number**
2. Choose a number with SMS capability
3. (For WhatsApp) Enable WhatsApp in console

#### 6.4 Update .env
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
```

---

## 🔧 Step 7: Configure Production .env

1. Copy the production template:
   ```bash
   cp backend/.env.production.example backend/.env.production
   ```

2. Edit `backend/.env.production` with your values:
   - JWT secrets (from Step 1)
   - MongoDB URI (from Step 2)
   - Face recognition credentials (from Step 3)
   - File storage credentials (from Step 4)
   - Email credentials (from Step 5)
   - SMS credentials (from Step 6)

3. Update these settings:
   ```env
   NODE_ENV=production
   FRONTEND_URL=https://yourdomain.com
   CORS_ORIGINS=https://yourdomain.com
   ALLOWED_OFFICE_IPS=your.office.ip.address/32
   ```

---

## 🚀 Step 8: Deploy Backend

### Option A: Heroku

```bash
# Install Heroku CLI
# Then:
heroku login
heroku create smarthr-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="your_mongodb_uri"
heroku config:set JWT_SECRET="your_jwt_secret"
# ... (set all environment variables)

# Deploy
git push heroku main
```

### Option B: AWS EC2

1. Launch EC2 instance (Ubuntu 20.04)
2. Install Node.js and PM2
3. Clone your repository
4. Create `.env.production` file
5. Run:
   ```bash
   npm install --production
   pm2 start src/server.js --name smarthr-api
   pm2 startup
   pm2 save
   ```

### Option C: DigitalOcean App Platform

1. Go to DigitalOcean
2. Create new app from GitHub
3. Add environment variables in dashboard
4. Deploy

---

## 🌐 Step 9: Deploy Frontend

### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# From frontend directory
cd frontend
vercel login
vercel

# Set environment variables in Vercel dashboard
# VITE_API_URL=https://your-api.herokuapp.com/api/v1
```

### Option B: Netlify

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```
2. Deploy `dist` folder to Netlify
3. Set environment variables in Netlify dashboard

### Option C: AWS S3 + CloudFront

1. Build frontend:
   ```bash
   npm run build
   ```
2. Upload `dist` folder to S3 bucket
3. Enable static website hosting
4. Create CloudFront distribution
5. Point your domain to CloudFront

---

## 🔒 Step 10: Security Checklist

- [ ] All JWT secrets are strong and unique
- [ ] MongoDB Atlas has IP whitelist configured
- [ ] AWS IAM user has minimal required permissions
- [ ] S3 bucket policy restricts public access to specific folders
- [ ] Email credentials are App Passwords (not main passwords)
- [ ] `.env.production` is in `.gitignore`
- [ ] HTTPS is enabled on frontend domain
- [ ] CORS is configured with specific origins (not *)
- [ ] Rate limiting is enabled
- [ ] Security headers (Helmet) are enabled

---

## 🧪 Step 11: Testing Production Setup

### Test Database Connection
```bash
# In backend directory
node -e "require('dotenv').config({path:'.env.production'}); require('./src/config/database')()"
```

### Test Face Recognition
Create a test script to verify face recognition works.

### Test Email
Send a test email through your application.

### Test Complete Flow
1. Register employee
2. Register face
3. Punch in/out
4. Apply leave
5. Approve leave
6. Check notifications

---

## 📊 Step 12: Monitoring & Maintenance

### Setup Error Tracking (Optional)

1. Sign up for Sentry: https://sentry.io/
2. Create new project
3. Add to `.env.production`:
   ```env
   SENTRY_DSN=https://your_sentry_dsn@sentry.io/project
   ```

### Setup Uptime Monitoring

Use services like:
- UptimeRobot (free)
- Pingdom
- New Relic

### Regular Maintenance

- Monitor MongoDB Atlas metrics
- Check AWS/Azure billing
- Review error logs weekly
- Backup database regularly
- Update dependencies monthly

---

## 💰 Cost Estimates (Monthly)

### Free Tier Option:
- MongoDB Atlas: **FREE** (512MB)
- AWS Rekognition: **FREE** (First 1,000 faces, 1,000 verifications)
- Cloudinary: **FREE** (25 GB storage, 25 GB bandwidth)
- SendGrid: **FREE** (100 emails/day)
- Heroku: **FREE** (with sleep)
- Vercel: **FREE**

**Total: $0/month** (with limitations)

### Production Option (500 employees):
- MongoDB Atlas: **$57/month** (M10)
- AWS Rekognition: **~$20/month**
- AWS S3: **~$5/month**
- SendGrid: **$14.95/month** (40k emails)
- Twilio: **~$10/month** (100 SMS)
- Heroku Hobby: **$7/month**
- Domain: **$12/year**

**Total: ~$115/month**

---

## 🆘 Troubleshooting

### Issue: MongoDB Connection Failed
- Check connection string format
- Verify IP whitelist in MongoDB Atlas
- Check database user permissions

### Issue: Face Recognition Not Working
- Verify AWS credentials are correct
- Check collection ID exists
- Verify IAM permissions

### Issue: Emails Not Sending
- For Gmail: Check App Password (not regular password)
- For SendGrid: Verify API key permissions
- Check email quotas

### Issue: CORS Errors
- Update `CORS_ORIGINS` in backend `.env`
- Check frontend API URL is correct
- Verify HTTPS/HTTP match

---

## 📞 Support Resources

- **MongoDB Atlas**: https://docs.atlas.mongodb.com/
- **AWS Rekognition**: https://docs.aws.amazon.com/rekognition/
- **Azure Face API**: https://docs.microsoft.com/azure/cognitive-services/face/
- **SendGrid**: https://docs.sendgrid.com/
- **Twilio**: https://www.twilio.com/docs

---

## ✅ Production Deployment Checklist

- [ ] Strong JWT secrets generated and set
- [ ] MongoDB Atlas configured and connection tested
- [ ] Face recognition service configured (AWS/Azure/Face++)
- [ ] File storage configured (S3/Cloudinary)
- [ ] Email service configured and tested
- [ ] SMS service configured (if using)
- [ ] Backend deployed and accessible
- [ ] Frontend deployed with correct API URL
- [ ] Custom domain configured (optional)
- [ ] HTTPS enabled
- [ ] Security checklist completed
- [ ] Test user created
- [ ] Complete flow tested end-to-end
- [ ] Monitoring setup (optional)
- [ ] Backup strategy in place

---

**Congratulations! Your Smart HR system is now production-ready! 🎉**

