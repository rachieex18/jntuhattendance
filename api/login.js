import { supabase } from './_lib.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { email, password } = req.body;

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('verified', true)
            .single();

        if (error || !user) {
            return res.status(400).json({ error: 'Invalid credentials or unverified account' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

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
        res.status(500).json({ error: 'Login failed' });
    }
}
