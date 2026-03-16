import { supabase, sendEmail, cors, generateOTP } from './_lib.js';

export default cors(async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        // Check if user exists and is verified
        const { data: user } = await supabase
            .from('users')
            .select('id, email')
            .eq('email', email)
            .eq('verified', true)
            .single();

        // Always return success to prevent email enumeration
        if (!user) {
            return res.status(200).json({ message: 'If this email exists, a reset code has been sent.' });
        }

        const resetCode = generateOTP();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

        // Store the reset code in verification_codes table (using RESET: prefix to distinguish from signup OTPs)
        const { error: upsertError } = await supabase.from('verification_codes').upsert({
            email,
            code: `RESET:${resetCode}`,
            expires_at: expiresAt,
        });

        if (upsertError) {
            console.error('Failed to store reset code:', upsertError);
            return res.status(500).json({ error: 'Failed to generate reset code. Please try again.' });
        }

        // Send email
        await sendEmail({
            to: email,
            subject: '🔐 Password Reset Code - JNTU Attendance',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #4f86f7;">Password Reset Request</h2>
                    <p>You requested to reset your JNTU Attendance password.</p>
                    <p>Your reset code is:</p>
                    <div style="background: #4f86f7; color: white; font-size: 32px; font-weight: bold;
                                padding: 20px; text-align: center; border-radius: 8px; letter-spacing: 8px;">
                        ${resetCode}
                    </div>
                    <p style="margin-top: 16px; color: #888;">This code expires in 15 minutes.</p>
                    <p style="color: #888;">If you did not request this, please ignore this email.</p>
                </div>`,
        });

        return res.status(200).json({ message: 'Reset code sent to your email.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ error: 'Failed to send reset code. Please try again.' });
    }
});
