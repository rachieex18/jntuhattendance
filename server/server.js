// ============================================
// JNTU ATTENDANCE TRACKER BACKEND
// ============================================

require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.json());
app.use(cors());

// ============================================
// 📧 EMAIL CONFIGURATION
// ============================================
const EMAIL_CONFIG = {
  senderEmail: process.env.EMAIL_USER || 'your-email@gmail.com',
  senderPassword: process.env.EMAIL_PASS || 'your-app-password',
};

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_CONFIG.senderEmail,
    pass: EMAIL_CONFIG.senderPassword,
  },
});

// ============================================
// 📊 DATABASE SETUP (SQLite for now)
// ============================================
const db = new sqlite3.Database('./attendance.db');

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT,
    roll_number TEXT UNIQUE,
    semester INTEGER,
    branch TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Subjects table
  db.run(`CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    subject_name TEXT NOT NULL,
    credits INTEGER DEFAULT 3,
    hours_per_week INTEGER DEFAULT 4,
    subject_type TEXT CHECK (subject_type IN ('theory', 'lab')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE(user_id, subject_name)
  )`);

  // Attendance table
  db.run(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER,
    user_id INTEGER,
    date DATE NOT NULL,
    hours_attended DECIMAL NOT NULL,
    total_hours DECIMAL NOT NULL,
    is_midterm BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects (id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE(subject_id, user_id, date)
  )`);

  // Friendships table
  db.run(`CREATE TABLE IF NOT EXISTS friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (friend_id) REFERENCES users (id),
    UNIQUE(user_id, friend_id)
  )`);
});

// ============================================
// 📊 TEMPORARY STORAGE
// ============================================
const pendingUsers = new Map();
const verificationCodes = new Map();
const resetTokens = new Map(); // For password reset

// ============================================
// 🔧 HELPER FUNCTIONS
// ============================================

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function generateResetCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: EMAIL_CONFIG.senderEmail,
    to: email,
    subject: '🔐 Your JNTU Attendance Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to JNTU Attendance Tracker! 🎉</h2>
          <p style="color: #666; font-size: 16px;">Your verification code is:</p>
          <div style="background-color: #007bff; color: white; font-size: 32px; font-weight: bold; padding: 20px; text-align: center; border-radius: 5px; letter-spacing: 5px;">
            ${otp}
          </div>
          <p style="color: #999; font-size: 14px; margin-top: 20px;">
            This code will expire in 10 minutes.
          </p>
          <p style="color: #999; font-size: 14px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

async function sendResetCodeEmail(email, resetCode) {
  const mailOptions = {
    from: EMAIL_CONFIG.senderEmail,
    to: email,
    subject: '🔐 Password Reset Code - JNTU Attendance',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request 🔒</h2>
          <p style="color: #666; font-size: 16px;">
            You requested to reset your password for JNTU Attendance Tracker. Use the code below:
          </p>
          <div style="background-color: #ff6b6b; color: white; font-size: 32px; font-weight: bold; padding: 20px; text-align: center; border-radius: 5px; letter-spacing: 5px;">
            ${resetCode}
          </div>
          <p style="color: #999; font-size: 14px; margin-top: 20px;">
            This code will expire in 15 minutes.
          </p>
          <p style="color: #999; font-size: 14px;">
            If you didn't request this, please ignore this email. Your password will remain unchanged.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            For security reasons, never share this code with anyone.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

async function sendPasswordChangedEmail(email) {
  const mailOptions = {
    from: EMAIL_CONFIG.senderEmail,
    to: email,
    subject: '✅ Password Successfully Changed - JNTU Attendance',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #28a745;">✅ Password Changed Successfully</h2>
          <p style="color: #666; font-size: 16px;">
            Your JNTU Attendance Tracker password has been successfully changed.
          </p>
          <p style="color: #666; font-size: 16px;">
            If you did not make this change, please contact us immediately.
          </p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              <strong>Changed on:</strong> ${new Date().toLocaleString()}
            </p>
          </div>
          <p style="color: #999; font-size: 14px;">
            For your security, you may want to:
          </p>
          <ul style="color: #999; font-size: 14px;">
            <li>Review your recent account activity</li>
            <li>Update your password on other sites if you use the same one</li>
          </ul>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// ============================================
// 🛣️ API ROUTES - FORGOT PASSWORD
// ============================================

// Forgot Password - Send Reset Code
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    db.get('SELECT * FROM users WHERE email = ? AND verified = TRUE', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // For security, don't reveal if email exists or not
      if (!user) {
        return res.status(200).json({
          message: 'If this email exists, a reset code has been sent.'
        });
      }

      // Generate reset code
      const resetCode = generateResetCode();

      // Store reset code with expiry (15 minutes)
      resetTokens.set(email, {
        code: resetCode,
        expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
      });

      try {
        // Send reset code email
        await sendResetCodeEmail(email, resetCode);
        res.status(200).json({
          message: 'Reset code sent to your email.',
          email: email,
        });
      } catch (emailError) {
        console.error('Email error:', emailError);
        res.status(500).json({ error: 'Failed to send reset code' });
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to send reset code' });
  }
});

// Verify Reset Code
app.post('/api/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    // Check if reset code exists
    const storedData = resetTokens.get(email);

    if (!storedData) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    // Check if expired
    if (Date.now() > storedData.expiresAt) {
      resetTokens.delete(email);
      return res.status(400).json({ error: 'Reset code has expired' });
    }

    // Verify code
    if (storedData.code !== code) {
      return res.status(400).json({ error: 'Invalid reset code' });
    }

    // Code is valid - generate a temporary token for password reset
    const resetToken = generateToken();
    resetTokens.set(resetToken, {
      email: email,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes to complete reset
      verified: true,
    });

    // Delete the code token
    resetTokens.delete(email);

    res.status(200).json({
      message: 'Code verified. You can now reset your password.',
      resetToken: resetToken,
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Reset Password
app.post('/api/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required' });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long'
      });
    }

    // Check if token exists
    const tokenData = resetTokens.get(resetToken);

    if (!tokenData) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Check if expired
    if (Date.now() > tokenData.expiresAt) {
      resetTokens.delete(resetToken);
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    db.run('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, tokenData.email], async function (err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to update password' });
      }

      // Clean up token
      resetTokens.delete(resetToken);

      try {
        // Send confirmation email
        await sendPasswordChangedEmail(tokenData.email);
      } catch (emailError) {
        console.error('Email error:', emailError);
        // Don't fail the request if email fails
      }

      console.log('✅ Password reset successful for:', tokenData.email);

      res.status(200).json({
        message: 'Password reset successfully! You can now login with your new password.',
      });
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ============================================
// 🛣️ API ROUTES - AUTHENTICATION
// ============================================

// User Signup
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password, fullName, rollNumber, semester, branch } = req.body;

    if (!email || !password || !fullName || !rollNumber) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ? OR roll_number = ?', [email, rollNumber], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (row) {
        return res.status(400).json({ error: 'User with this email or roll number already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate OTP
      const otp = generateOTP();

      // Store user data temporarily
      pendingUsers.set(email, {
        email,
        password: hashedPassword,
        fullName,
        rollNumber,
        semester: parseInt(semester) || null,
        branch,
        createdAt: Date.now(),
      });

      // Store OTP with expiry
      verificationCodes.set(email, {
        code: otp,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      });

      // Send OTP email
      try {
        await sendOTPEmail(email, otp);
        res.status(200).json({
          message: 'OTP sent to your email. Please verify to complete signup.',
          email: email,
        });
      } catch (emailError) {
        console.error('Email error:', emailError);
        res.status(500).json({ error: 'Failed to send verification email' });
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Verify OTP
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const storedData = verificationCodes.get(email);

    if (!storedData) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({ error: 'OTP has expired' });
    }

    if (storedData.code !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const userData = pendingUsers.get(email);

    if (!userData) {
      return res.status(400).json({ error: 'User data not found' });
    }

    // Create user in database
    db.run(
      `INSERT INTO users (email, password, full_name, roll_number, semester, branch, verified) 
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [userData.email, userData.password, userData.fullName, userData.rollNumber, userData.semester, userData.branch],
      function (err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to create user' });
        }

        // Clean up temporary storage
        pendingUsers.delete(email);
        verificationCodes.delete(email);

        res.status(200).json({
          message: 'Email verified successfully! Account created.',
          user: {
            id: this.lastID,
            email: userData.email,
            fullName: userData.fullName,
            rollNumber: userData.rollNumber,
            semester: userData.semester,
            branch: userData.branch
          },
        });
      }
    );

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get('SELECT * FROM users WHERE email = ? AND verified = TRUE', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(400).json({ error: 'Invalid credentials or unverified account' });
      }

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Return user data
      res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          rollNumber: user.roll_number,
          semester: user.semester,
          branch: user.branch
        }
      });
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get user subjects
app.get('/api/subjects/:userId', (req, res) => {
  const userId = req.params.userId;

  db.all('SELECT * FROM subjects WHERE user_id = ?', [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Add subject
app.post('/api/subjects', (req, res) => {
  const { userId, subjectName, credits, hoursPerWeek, subjectType } = req.body;

  db.run(
    'INSERT INTO subjects (user_id, subject_name, credits, hours_per_week, subject_type) VALUES (?, ?, ?, ?, ?)',
    [userId, subjectName, credits, hoursPerWeek, subjectType],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to add subject' });
      }
      res.json({ id: this.lastID, message: 'Subject added successfully' });
    }
  );
});

// Delete subject
app.delete('/api/subjects/:id', (req, res) => {
  const subjectId = req.params.id;
  console.log(`🗑️ Request to delete subject ID: ${subjectId}`);

  // First delete attendance records associated with this subject
  db.run('DELETE FROM attendance WHERE subject_id = ?', [subjectId], (err) => {
    if (err) {
      console.error(`❌ Error deleting attendance for subject ${subjectId}:`, err);
      return res.status(500).json({ error: 'Failed to delete subject data' });
    }
    console.log(`✅ Deleted attendance for subject ${subjectId}`);

    // Now delete the subject itself
    db.run('DELETE FROM subjects WHERE id = ?', [subjectId], function (err) {
      if (err) {
        console.error(`❌ Error deleting subject ${subjectId}:`, err);
        return res.status(500).json({ error: 'Failed to delete subject' });
      }
      console.log(`✅ Deleted subject ${subjectId} (Rows affected: ${this.changes})`);
      res.json({ message: 'Subject and all its attendance records deleted successfully' });
    });
  });
});

// Get attendance records
app.get('/api/attendance/:userId', (req, res) => {
  const userId = req.params.userId;

  db.all('SELECT * FROM attendance WHERE user_id = ?', [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Add attendance record
app.post('/api/attendance', (req, res) => {
  const { userId, subjectId, date, hoursAttended, totalHours, isMidterm, notes } = req.body;

  db.run(
    `INSERT OR REPLACE INTO attendance 
     (user_id, subject_id, date, hours_attended, total_hours, is_midterm, notes) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, subjectId, date, hoursAttended, totalHours, isMidterm, notes],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to save attendance' });
      }
      res.json({ id: this.lastID, message: 'Attendance saved successfully' });
    }
  );
});

// ============================================
// 🛣️ API ROUTES - FRIENDS & SOCIAL
// ============================================

// Search users to add as friends
app.get('/api/users/search', (req, res) => {
  const { query, currentUserId } = req.query;
  if (!query) return res.json([]);

  const searchTerm = `%${query}%`;
  db.all(
    `SELECT id, email, full_name, roll_number, branch 
     FROM users 
     WHERE (email LIKE ? OR roll_number LIKE ? OR full_name LIKE ?) 
     AND id != ? AND verified = TRUE 
     LIMIT 10`,
    [searchTerm, searchTerm, searchTerm, currentUserId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Search failed' });
      res.json(rows);
    }
  );
});

// Send friend request
app.post('/api/friends/request', (req, res) => {
  const { userId, friendId } = req.body;

  db.run(
    'INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, "pending")',
    [userId, friendId],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Friend request already exists' });
        }
        return res.status(500).json({ error: 'Failed to send request' });
      }
      res.json({ message: 'Friend request sent' });
    }
  );
});

// Accept friend request
app.post('/api/friends/accept', (req, res) => {
  const { userId, friendId } = req.body;

  db.run(
    'UPDATE friendships SET status = "accepted", updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND friend_id = ?',
    [friendId, userId], // Note: friendId is the original sender
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to accept request' });
      res.json({ message: 'Friend request accepted' });
    }
  );
});

// List friends and pending requests
app.get('/api/friends/:userId', (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT f.id as friendship_id, f.status, f.user_id as sender_id,
           u.id as user_id, u.email, u.full_name, u.roll_number, u.branch
    FROM friendships f
    JOIN users u ON (f.user_id = u.id OR f.friend_id = u.id)
    WHERE (f.user_id = ? OR f.friend_id = ?) AND u.id != ?
  `;

  db.all(query, [userId, userId, userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch friends' });
    res.json(rows);
  });
});

// Get friend's attendance summary (if accepted)
app.get('/api/friends/attendance/:friendId', (req, res) => {
  const friendId = req.params.friendId;
  const currentUserId = req.query.userId;

  // Verify friendship exists and is accepted
  db.get(
    'SELECT * FROM friendships WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)) AND status = "accepted"',
    [currentUserId, friendId, friendId, currentUserId],
    (err, friendship) => {
      if (err || !friendship) {
        return res.status(403).json({ error: 'Not authorized to view this data' });
      }

      // Fetch summary stats for friend
      const statsQuery = `
        SELECT 
          SUM(hours_attended) as attended,
          SUM(total_hours) as total
        FROM attendance
        WHERE user_id = ?
      `;

      db.get(statsQuery, [friendId], (err, stats) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch stats' });
        res.json({
          attended: stats.attended || 0,
          total: stats.total || 0,
          percentage: stats.total > 0 ? (stats.attended / stats.total) * 100 : 0
        });
      });
    }
  );
});

// ============================================
// 🚀 START SERVER
// ============================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`\n📧 Email Configuration:`);
  console.log(`   Sender: ${EMAIL_CONFIG.senderEmail}`);
  console.log(`\n🗄️  Database: SQLite (Local)`);
  console.log(`   File: ./attendance.db`);
  console.log(`\n🔗 Available Social Routes:`);
  console.log(`   GET  /api/users/search - Search for classmates`);
  console.log(`   POST /api/friends/request - Send friend request`);
  console.log(`   POST /api/friends/accept - Accept request`);
  console.log(`   GET  /api/friends/:userId - List all friends`);
  console.log(`   GET  /api/friends/attendance/:friendId - Peek friend attendance`);
});