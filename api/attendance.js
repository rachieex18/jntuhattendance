import { supabase } from './_lib.js';

export default async function handler(req, res) {
    const { userId } = req.query;

    if (req.method === 'GET') {
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', userId);

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
    }

    if (req.method === 'POST') {
        const { userId, subjectId, date, hoursAttended, totalHours, isMidterm, notes } = req.body;
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

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
