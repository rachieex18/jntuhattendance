import { supabase } from './_lib.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { email, code, newPassword } = req.body;

    try {
        const { data: storedCode } = await supabase
            .from('verification_codes')
            .select('*')
            .eq('email', email)
            .single();

        if (!storedCode || storedCode.code !== code || Date.now() > storedCode.expires_at) {
            return res.status(400).json({ error: 'Invalid or expired code' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const { error: updateError } = await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('email', email);

        if (updateError) throw updateError;

        await supabase.from('verification_codes').delete().eq('email', email);

        res.status(200).json({ message: 'Password reset successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reset password' });
    }
}
