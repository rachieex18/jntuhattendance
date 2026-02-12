import { supabase, generateOTP, transporter } from './_lib.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { email } = req.body;

    try {
        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('verified', true)
            .single();

        if (!user) {
            return res.status(200).json({ message: 'If this email exists, a reset code has been sent.' });
        }

        const resetCode = generateOTP();

        await supabase
            .from('verification_codes')
            .upsert({
                email,
                code: resetCode,
                expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: '🔐 Password Reset Code - JNTU Attendance',
            html: `<h2>Password Reset Request</h2><p>Your code is: <b>${resetCode}</b></p>`
        });

        res.status(200).json({ message: 'Reset code sent to your email.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to process request' });
    }
}
