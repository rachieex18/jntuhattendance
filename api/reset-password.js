import { supabase, cors } from './_lib.js';
import bcrypt from 'bcryptjs';

export default cors(async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
        return res.status(400).json({ error: 'Reset token and new password are required' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    try {
        // Decode the resetToken (base64 encoded {email, code})
        let email, code;
        try {
            const decoded = JSON.parse(Buffer.from(resetToken, 'base64').toString('utf8'));
            email = decoded.email;
            code = decoded.code;
        } catch {
            return res.status(400).json({ error: 'Invalid reset token' });
        }

        // Verify the code still exists and matches
        const { data: storedEntry } = await supabase
            .from('verification_codes')
            .select('*')
            .eq('email', email)
            .single();

        if (!storedEntry || storedEntry.code !== `RESET:${code}`) {
            return res.status(400).json({ error: 'Invalid or expired reset token. Please start over.' });
        }

        if (new Date() > new Date(storedEntry.expires_at)) {
            await supabase.from('verification_codes').delete().eq('email', email);
            return res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
        }

        // Hash and update the password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const { error: updateError } = await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('email', email);

        if (updateError) {
            console.error('Password update error:', updateError);
            return res.status(500).json({ error: 'Failed to update password' });
        }

        // Clean up the used reset code
        await supabase.from('verification_codes').delete().eq('email', email);

        return res.status(200).json({ message: 'Password reset successfully! You can now log in.' });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ error: 'Failed to reset password' });
    }
});
