import { supabase, cors } from './_lib.js';

export default cors(async function handler(req, res) {
    try {
        const userIdQuery = req.query.userId;
        const idQuery = req.query.id;

        if (req.method === 'GET') {
            if (!userIdQuery) return res.status(400).json({ error: 'Missing userId' });

            const { data, error } = await supabase
                .from('subjects')
                .select('*')
                .eq('user_id', parseInt(userIdQuery));

            if (error) {
                console.error('Fetch subjects error:', error);
                return res.status(500).json({ error: 'Database error' });
            }
            return res.status(200).json(data);
        }

        if (req.method === 'POST') {
            const { userId, subjectName, credits, hoursPerWeek, subjectType } = req.body;
            
            console.log('POST /subjects request:', { userId, subjectName, credits, hoursPerWeek, subjectType });
            
            if (!userId || !subjectName) {
                console.error('Missing required fields:', { userId, subjectName });
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Ensure userId is an number to match the DB type (integer)
            const numericUserId = parseInt(userId);

            const { data, error } = await supabase
                .from('subjects')
                .insert({
                    user_id: numericUserId,
                    subject_name: subjectName,
                    credits: parseInt(credits) || 3,
                    hours_per_week: parseFloat(hoursPerWeek) || 0,
                    subject_type: subjectType
                })
                .select()
                .maybeSingle();

            if (error) {
                console.error('Add subject error:', error);
                
                // Better error message for the user if it's a type mismatch or constraint violation
                if (error.code === '22P02' && error.message.includes('uuid')) {
                     return res.status(400).json({ 
                        error: 'Database Schema Error: The subjects table is expecting a UUID but we sent an Integer. Please run the database fix script.',
                        details: error.message 
                    });
                }
                
                return res.status(500).json({ error: 'Failed to add subject', details: error.message });
            }
            
            return res.status(200).json(data);
        }

        if (req.method === 'DELETE') {
            if (!idQuery) return res.status(400).json({ error: 'Missing subject id' });

            const { error } = await supabase
                .from('subjects')
                .delete()
                .eq('id', idQuery);

            if (error) {
                console.error('Delete subject error:', error);
                return res.status(500).json({ error: 'Failed to delete subject' });
            }
            return res.status(200).json({ message: 'Subject deleted successfully' });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Subjects API Fatal Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});
