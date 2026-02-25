import { supabase, cors } from './_lib.js';

export default cors(async function handler(req, res) {
    const { userId } = req.query;

    if (req.method === 'GET') {
        if (!userId) return res.status(400).json({ error: 'Missing userId' });

        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('Fetch attendance error:', error);
            return res.status(500).json({ error: error.message });
        }
        return res.status(200).json(data);
    }

    if (req.method === 'POST') {
        const { userId, subjectId, date, hoursAttended, totalHours, isMidterm, notes } = req.body;
        if (!userId || !subjectId) return res.status(400).json({ error: 'Missing required fields' });

        const { data, error } = await supabase
            .from('attendance')
            .upsert({
                user_id: userId,
                subject_id: subjectId,
                date,
                hours_attended: hoursAttended,
                total_hours: totalHours,
                is_midterm: isMidterm,
                notes
            })
            .select()
            .single();

        if (error) {
            console.error('Save attendance error:', error);
            return res.status(500).json({ error: error.message });
        }
        return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
});
