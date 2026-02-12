import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import our serverless handlers
import loginHandler from './api/login.js';
import signupHandler from './api/signup.js';
import verifyOtpHandler from './api/verify-otp.js';
import subjectsHandler from './api/subjects.js';
import attendanceHandler from './api/attendance.js';
import forgotPasswordHandler from './api/forgot-password.js';
import resetPasswordHandler from './api/reset-password.js';
import friendsHandler from './api/friends.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Helper to convert Vercel handler to Express route
const vercelToExpress = (handler) => async (req, res) => {
    // Vercel handlers receive (req, res) and it should work mostly as is
    // since Express req/res are compatible with what Vercel provides.
    try {
        await handler(req, res);
    } catch (error) {
        console.error('Error in route:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Map routes
app.post('/api/login', vercelToExpress(loginHandler));
app.post('/api/signup', vercelToExpress(signupHandler));
app.post('/api/verify-otp', vercelToExpress(verifyOtpHandler));
app.get('/api/subjects', vercelToExpress(subjectsHandler));
app.post('/api/subjects', vercelToExpress(subjectsHandler));
app.delete('/api/subjects', vercelToExpress(subjectsHandler));
app.get('/api/attendance', vercelToExpress(attendanceHandler));
app.post('/api/attendance', vercelToExpress(attendanceHandler));
app.post('/api/forgot-password', vercelToExpress(forgotPasswordHandler));
app.post('/api/reset-password', vercelToExpress(resetPasswordHandler));
app.get('/api/friends', vercelToExpress(friendsHandler));
app.post('/api/friends', vercelToExpress(friendsHandler));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
});
