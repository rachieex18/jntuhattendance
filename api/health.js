export default async function handler(req, res) {
    const envCheck = {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
        hasEmailUser: !!process.env.EMAIL_USER,
        hasEmailPass: !!process.env.EMAIL_PASS,
        supabaseUrlValue: process.env.SUPABASE_URL ? 'Set' : 'Missing',
        nodeEnv: process.env.NODE_ENV || 'not set'
    };

    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: envCheck
    });
}
