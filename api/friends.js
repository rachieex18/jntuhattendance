import { supabase, cors } from './_lib.js';

export default cors(async function handler(req, res) {
    try {
        const userId = req.query.userId || req.body.userId;

        if (req.method === 'GET') {
            if (!userId) return res.status(400).json({ error: 'Missing userId' });

            // Fetch friendships where the user is either the sender OR the recipient
            const { data, error } = await supabase
                .from('friendships')
                .select(`
                    id,
                    status,
                    user_id,
                    friend_id,
                    sender:user_id (id, full_name, roll_number, branch, email),
                    recipient:friend_id (id, full_name, roll_number, branch, email)
                `)
                .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

            if (error) {
                console.error('Fetch friends error:', error);
                return res.status(500).json({ error: error.message });
            }

            // Standardize the output so the frontend always sees the 'other' person as the friend
            const formattedData = data.map(f => {
                const isUserSender = f.user_id === parseInt(userId);
                const friendData = isUserSender ? f.recipient : f.sender;
                
                return {
                    friendship_id: f.id,
                    status: f.status,
                    is_sender: isUserSender,
                    friend_id: friendData.id,
                    full_name: friendData.full_name,
                    roll_number: friendData.roll_number,
                    branch: friendData.branch,
                    email: friendData.email
                };
            });

            return res.status(200).json(formattedData);
        }

        if (req.method === 'POST') {
            const { friendRollNumber } = req.body;
            if (!userId || !friendRollNumber) return res.status(400).json({ error: 'Missing required fields' });

            // Find friend by roll number
            const { data: friend, error: friendError } = await supabase
                .from('users')
                .select('id')
                .eq('roll_number', friendRollNumber)
                .single();

            if (friendError || !friend) {
                return res.status(404).json({ error: 'User not found' });
            }

            if (friend.id === parseInt(userId)) {
                return res.status(400).json({ error: 'You cannot add yourself as a friend' });
            }

            // check if already friends or request pending
            const { data: existing } = await supabase
                .from('friendships')
                .select('*')
                .or(`and(user_id.eq.${userId},friend_id.eq.${friend.id}),and(user_id.eq.${friend.id},friend_id.eq.${userId})`)
                .maybeSingle();

            if (existing) {
                return res.status(400).json({ error: 'Friend request already exists or you are already friends' });
            }

            const { error: insertError } = await supabase
                .from('friendships')
                .insert({ user_id: userId, friend_id: friend.id, status: 'pending' });

            if (insertError) {
                console.error('Add friend error:', insertError);
                return res.status(500).json({ error: 'Failed to add friend' });
            }
            return res.status(200).json({ message: 'Friend request sent' });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Friends API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
