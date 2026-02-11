// ============================================
// JNTU ATTENDANCE TRACKER BACKEND (SUPABASE)
// ============================================

require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(cors());

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

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
// 📊 SUPABASE SETUP
// ============================================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration! Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

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
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('verified', true)
      .single();

    if (userError && userError.code !== 'PGRST116') {
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

    // Store reset code with expiry (15 minutes) in verification_codes table
    await supabase
      .from('verification_codes')
      .upsert({
        email,
        code: resetCode,
        expires_at: Date.now() + 15 * 60 * 1000,
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
    const { data: storedData, error: codeError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .single();

    if (codeError || !storedData) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    // Check if expired
    if (Date.now() > storedData.expires_at) {
      await supabase.from('verification_codes').delete().eq('email', email);
      return res.status(400).json({ error: 'Reset code has expired' });
    }

    // Verify code
    if (storedData.code !== code) {
      return res.status(400).json({ error: 'Invalid reset code' });
    }

    // Code is valid - generate a temporary token for password reset
    const resetToken = generateToken();

    await supabase
      .from('reset_tokens')
      .insert({
        token: resetToken,
        email: email,
        expires_at: Date.now() + 5 * 60 * 1000,
        verified: true,
      });

    // Delete the code token
    await supabase.from('verification_codes').delete().eq('email', email);

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
    const { data: tokenData, error: tokenError } = await supabase
      .from('reset_tokens')
      .select('*')
      .eq('token', resetToken)
      .single();

    if (tokenError || !tokenData) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Check if expired
    if (Date.now() > tokenData.expires_at) {
      await supabase.from('reset_tokens').delete().eq('token', resetToken);
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('email', tokenData.email);

    if (updateError) {
      console.error('Database error:', updateError);
      return res.status(500).json({ error: 'Failed to update password' });
    }

    // Clean up token
    await supabase.from('reset_tokens').delete().eq('token', resetToken);

    try {
      // Send confirmation email
      await sendPasswordChangedEmail(tokenData.email);
    } catch (emailError) {
      console.error('Email error:', emailError);
    }

    console.log('✅ Password reset successful for:', tokenData.email);

    res.status(200).json({
      message: 'Password reset successfully! You can now login with your new password.',
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
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${email},roll_number.eq.${rollNumber}`)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or roll number already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();

    // Store user data temporarily in pending_users table
    const { error: pendingError } = await supabase
      .from('pending_users')
      .upsert({
        email,
        password: hashedPassword,
        full_name: fullName,
        roll_number: rollNumber,
        semester: parseInt(semester) || null,
        branch,
        created_at: Date.now(),
      });

    if (pendingError) {
      console.error('Pending user error:', pendingError);
      return res.status(500).json({ error: 'Failed to save signup data' });
    }

    // Store OTP in verification_codes table
    const { error: otpError } = await supabase
      .from('verification_codes')
      .upsert({
        email,
        code: otp,
        expires_at: Date.now() + 10 * 60 * 1000,
      });

    if (otpError) {
      console.error('OTP storage error:', otpError);
      return res.status(500).json({ error: 'Failed to save verification code' });
    }

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

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Verify OTP
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const { data: storedCode, error: codeError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .single();

    if (codeError || !storedCode) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    if (Date.now() > storedCode.expires_at) {
      await supabase.from('verification_codes').delete().eq('email', email);
      return res.status(400).json({ error: 'OTP has expired' });
    }

    if (storedCode.code !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const { data: userData, error: userError } = await supabase
      .from('pending_users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      return res.status(400).json({ error: 'User data not found' });
    }

    // Create user in database
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: userData.email,
        password: userData.password,
        full_name: userData.full_name,
        roll_number: userData.roll_number,
        semester: userData.semester,
        branch: userData.branch,
        verified: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database error:', insertError);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Clean up temporary storage
    await supabase.from('pending_users').delete().eq('email', email);
    await supabase.from('verification_codes').delete().eq('email', email);

    res.status(200).json({
      message: 'Email verified successfully! Account created.',
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        rollNumber: newUser.roll_number,
        semester: newUser.semester,
        branch: newUser.branch
      },
    });

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

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('verified', true)
      .single();

    if (userError || !user) {
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

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get user subjects
app.get('/api/subjects/:userId', async (req, res) => {
  const userId = req.params.userId;

  const { data: rows, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    return res.status(500).json({ error: 'Database error' });
  }
  res.json(rows);
});

// Add subject
app.post('/api/subjects', async (req, res) => {
  const { userId, subjectName, credits, hoursPerWeek, subjectType } = req.body;

  const { data, error } = await supabase
    .from('subjects')
    .insert({
      user_id: userId,
      subject_name: subjectName,
      credits: credits,
      hours_per_week: hoursPerWeek,
      subject_type: subjectType
    })
    .select()
    .single();

  if (error) {
    console.error('Add subject error:', error);
    return res.status(500).json({ error: 'Failed to add subject' });
  }
  res.json({ id: data.id, message: 'Subject added successfully' });
});

// Delete subject
app.delete('/api/subjects/:id', async (req, res) => {
  const subjectId = req.params.id;
  console.log(`🗑️ Request to delete subject ID: ${subjectId}`);

  // Cascade delete should handle attendance if foreign key is set correctly in Supabase
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', subjectId);

  if (error) {
    console.error(`❌ Error deleting subject ${subjectId}:`, error);
    return res.status(500).json({ error: 'Failed to delete subject' });
  }

  res.json({ message: 'Subject and its records deleted successfully' });
});

// Get attendance records
app.get('/api/attendance/:userId', async (req, res) => {
  const userId = req.params.userId;

  const { data: rows, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    return res.status(500).json({ error: 'Database error' });
  }
  res.json(rows);
});

// Add attendance record
app.post('/api/attendance', async (req, res) => {
  const { userId, subjectId, date, hoursAttended, totalHours, isMidterm, notes } = req.body;

  const { data, error } = await supabase
    .from('attendance')
    .upsert({
      user_id: userId,
      subject_id: subjectId,
      date: date,
      hours_attended: hoursAttended,
      total_hours: totalHours,
      is_midterm: isMidterm,
      notes: notes
    })
    .select()
    .single();

  if (error) {
    console.error('Save attendance error:', error);
    return res.status(500).json({ error: 'Failed to save attendance' });
  }
  res.json({ id: data.id, message: 'Attendance saved successfully' });
});

// ============================================
// 🚀 START SERVER
// ============================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`\n📧 Email Configuration:`);
  console.log(`   Sender: ${EMAIL_CONFIG.senderEmail}`);
  console.log(`\n🗄️  Database: Supabase (Cloud)`);
  console.log(`   URL: ${supabaseUrl}`);
});

// For Vercel hosting
module.exports = app;