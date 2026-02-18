import { supabase, generateOTP, sendOTPEmail, cors } from './_lib.js';
import bcrypt from 'bcryptjs';

export default cors(async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password, fullName, rollNumber, semester, branch } = req.body;

        if (!email || !password || !fullName || !rollNumber) {
            return res.status(400).json({ error: 'Required fields missing' });
        }

        // Check if user already exists
        const { data: existingUser } = await supabase
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
                created_at: new Date().toISOString(),
            });

        if (pendingError) {
            return res.status(500).json({ error: 'Failed to save signup data' });
        }

        // Store OTP in verification_codes table
        const { error: otpError } = await supabase
            .from('verification_codes')
            .upsert({
                email,
                code: otp,
                expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            });

        if (otpError) {
            return res.status(500).json({ error: 'Failed to save verification code' });
        }

        // Send OTP email
        await sendOTPEmail(email, otp);

        res.status(200).json({
            message: 'OTP sent to your email. Please verify to complete signup.',
            email: email,
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Signup failed' });
    }
});
