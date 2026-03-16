import { supabase, cors } from './_lib.js';

export default cors(async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { email, code } = req.body;

    if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });

    try {
        console.log(`Verifying reset code for email: ${email}`);
        const { data: storedEntry, error } = await supabase
            .from('verification_codes')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !storedEntry) {
            console.error('No verification code found for this email:', error);
            return res.status(400).json({ error: 'Invalid or expired reset code' });
        }

        console.log(`Stored code: ${storedEntry.code}, Expected: RESET:${code}`);
        // Expected storedEntry.code is "RESET:<code>"
        const expectedCode = `RESET:${code}`;
        if (storedEntry.code !== expectedCode) {
            console.error('Code mismatch');
            return res.status(400).json({ error: 'Invalid reset code' });
        }

        if (new Date() > new Date(storedEntry.expires_at)) {
            console.error('Code expired');
            await supabase.from('verification_codes').delete().eq('email', email);
            return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
        }

        // Return a base64 session token containing email+code for use in the reset step
        const resetToken = Buffer.from(JSON.stringify({ email, code })).toString('base64');
        console.log('Reset code verified successfully');

        return res.status(200).json({
            message: 'Code verified. You may now reset your password.',
            resetToken,
        });
    } catch (error) {
        console.error('Verify reset code error:', error);
        return res.status(500).json({ error: 'Failed to verify code' });
    }
});
