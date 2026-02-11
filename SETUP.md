# JNTU Attendance Tracker Setup

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Gmail account with App Password enabled

## Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure email settings:**
   - Copy `.env.example` to `.env`
   - Update with your Gmail credentials:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-gmail-app-password
   PORT=3001
   ```

4. **Generate Gmail App Password:**
   - Go to Google Account settings
   - Enable 2-Factor Authentication
   - Generate App Password for "Mail"
   - Use this password (not your regular Gmail password)

5. **Start the backend server:**
   ```bash
   npm run dev
   ```

## Frontend Setup

1. **Navigate to project root:**
   ```bash
   cd ..
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the frontend:**
   ```bash
   npm run dev
   ```

## Features

### Authentication
- ✅ Email signup with OTP verification
- ✅ Secure password hashing
- ✅ User login/logout
- ✅ Session management
- ✅ **Forgot password with email reset**
- ✅ **Password reset with OTP verification**
- ✅ **Password change confirmation emails**

### Password Recovery Flow
1. **Forgot Password:** Enter email address
2. **Email Sent:** 6-digit reset code sent to email
3. **Verify Code:** Enter the reset code
4. **New Password:** Set new password (min 8 characters)
5. **Confirmation:** Email confirmation sent

### Attendance Management
- ✅ Subject management
- ✅ Daily attendance tracking
- ✅ Attendance statistics
- ✅ Progress visualization

### Database
- ✅ SQLite database (local storage)
- ✅ User profiles
- ✅ Subject records
- ✅ Attendance history

## API Endpoints

### Authentication
- `POST /api/signup` - User registration
- `POST /api/verify-otp` - Email verification
- `POST /api/login` - User login

### Password Recovery
- `POST /api/forgot-password` - Request password reset
- `POST /api/verify-reset-code` - Verify reset code
- `POST /api/reset-password` - Reset password with token

### Data Management
- `GET /api/subjects/:userId` - Get user subjects
- `POST /api/subjects` - Add new subject
- `GET /api/attendance/:userId` - Get attendance records
- `POST /api/attendance` - Add attendance record

## Usage

1. **Sign Up:**
   - Fill in your details
   - Verify email with OTP
   - Account created successfully

2. **Forgot Password:**
   - Click "Forgot your password?" on login
   - Enter your email address
   - Check email for 6-digit reset code
   - Enter code and set new password

3. **Add Subjects:**
   - Use timetable scanner or manual entry
   - Configure subject details

4. **Track Attendance:**
   - Mark daily attendance
   - View statistics and trends
   - Monitor attendance percentage

## Security Features

- Password hashing with bcrypt
- Email verification required
- Password reset with time-limited codes
- Input validation
- SQL injection protection
- CORS enabled for frontend
- Secure token generation for resets

## Email Templates

The system includes professional email templates for:
- **Account verification** - Welcome email with OTP
- **Password reset** - Reset code with security warnings
- **Password changed** - Confirmation with timestamp

## Production Deployment

For production deployment:

1. Use environment variables for all sensitive data
2. Replace SQLite with PostgreSQL/MySQL
3. Implement JWT tokens for authentication
4. Add rate limiting for password reset attempts
5. Use HTTPS
6. Set up proper logging
7. Configure professional email service (SendGrid, etc.)
8. Add password strength requirements
9. Implement account lockout after failed attempts

## Troubleshooting

**Email not sending:**
- Check Gmail App Password
- Verify 2FA is enabled
- Check spam folder
- Ensure EMAIL_USER and EMAIL_PASS are correct

**Password reset not working:**
- Check if reset codes are expiring (15 minutes)
- Verify email exists in database
- Check server logs for errors

**Database errors:**
- Ensure write permissions in server directory
- Check SQLite installation

**CORS errors:**
- Verify backend is running on port 3001
- Check frontend API_BASE URL

## Testing the Forgot Password Flow

1. Create a test account through signup
2. Go to login page and click "Forgot your password?"
3. Enter your email address
4. Check your email for the reset code
5. Enter the 6-digit code
6. Set a new password
7. Login with the new password
8. Check for password change confirmation email