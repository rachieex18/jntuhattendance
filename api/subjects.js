import { supabase, cors } from './_lib.js';

export default cors(async function handler(req, res) {
    const { userId, id } = req.query;

    if (req.method === 'GET') {
        if (!userId) return res.status(400).json({ error: 'Missing userId' });

        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('Fetch subjects error:', error);
            return res.status(500).json({ error: 'Database error' });
        }
        return res.status(200).json(data);
    }

    if (req.method === 'POST') {
        const { userId, subjectName, credits, hoursPerWeek, subjectType } = req.body;
        if (!userId || !subjectName) return res.status(400).json({ error: 'Missing required fields' });

        const { data, error } = await supabase
            .from('subjects')
            .insert({
                user_id: userId,
                subject_name: subjectName,
                credits,
                hours_per_week: hoursPerWeek,
                subject_type: subjectType
            })
            .select()
            .single();

        if (error) {
            console.error('Add subject error:', error);
            return res.status(500).json({ error: 'Failed to add subject' });
        }
        return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
        if (!id) return res.status(400).json({ error: 'Missing subject id' });

        const { error } = await supabase
            .from('subjects')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete subject error:', error);
            return res.status(500).json({ error: 'Failed to delete subject' });
        }
        return res.status(200).json({ message: 'Subject deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
});
