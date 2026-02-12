import { supabase } from './_lib.js';

export default async function handler(req, res) {
    const { userId, id } = req.query;

    if (req.method === 'GET') {
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .eq('user_id', userId);

        if (error) return res.status(500).json({ error: 'Database error' });
        return res.status(200).json(data);
    }

    if (req.method === 'POST') {
        const { userId, subjectName, credits, hoursPerWeek, subjectType } = req.body;
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

        if (error) return res.status(500).json({ error: 'Failed to add subject' });
        return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
        const { error } = await supabase
            .from('subjects')
            .delete()
            .eq('id', id);

        if (error) return res.status(500).json({ error: 'Failed to delete subject' });
        return res.status(200).json({ message: 'Subject deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
