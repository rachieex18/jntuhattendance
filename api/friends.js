import { supabase } from './_lib.js';

export default async function handler(req, res) {
    const { userId, friendId } = req.query;

    if (req.method === 'GET') {
        const { data, error } = await supabase
            .from('friendships')
            .select('*, users!friend_id(full_name, roll_number)')
            .eq('user_id', userId);

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
    }

    if (req.method === 'POST') {
        const { userId, friendRollNumber } = req.body;

        // Find friend by roll number
        const { data: friend } = await supabase
            .from('users')
            .select('id')
            .eq('roll_number', friendRollNumber)
            .single();

        if (!friend) return res.status(404).json({ error: 'User not found' });

        const { data, error } = await supabase
            .from('friendships')
            .insert({ user_id: userId, friend_id: friend.id, status: 'pending' });

        if (error) return res.status(500).json({ error: 'Failed to add friend' });
        return res.status(200).json({ message: 'Friend request sent' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
