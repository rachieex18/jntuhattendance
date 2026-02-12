import { supabase } from './_lib.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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

        const { data: userData } = await supabase
            .from('pending_users')
            .select('*')
            .eq('email', email)
            .single();

        if (!userData) {
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
        res.status(500).json({ error: 'Verification failed' });
    }
}
