import { supabase, cors } from './_lib.js';

export default cors(async function handler(req, res) {
    const { userId } = req.query;

    if (req.method === 'GET') {
        if (!userId) return res.status(400).json({ error: 'Missing userId' });

        const { data, error } = await supabase
            .from('friendships')
            .select(`
                friendship_id:id,
                status,
                sender_id:user_id,
                user_id:friend_id,
                users:friend_id (
                    full_name,
                    roll_number,
                    branch,
                    email
                )
            `)
            .eq('user_id', userId);

        if (error) return res.status(500).json({ error: error.message });

        // Flatten the structure for the frontend
        const formattedData = data.map(friendship => ({
            friendship_id: friendship.friendship_id,
            status: friendship.status,
            sender_id: friendship.sender_id,
            user_id: friendship.user_id,
            full_name: friendship.users.full_name,
            roll_number: friendship.users.roll_number,
            branch: friendship.users.branch,
            email: friendship.users.email
        }));

        return res.status(200).json(formattedData);
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
});
