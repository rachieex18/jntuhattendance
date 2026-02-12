import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Supabase Init
export const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Email Init
export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: '🔐 Your JNTU Attendance Verification Code',
        html: `<div style="font-family: Arial; padding: 20px;">
             <h2>Welcome! 🎉</h2>
             <p>Your verification code is:</p>
             <div style="background: #007bff; color: white; font-size: 32px; padding: 20px; text-align: center; border-radius: 5px;">${otp}</div>
           </div>`
    };
    await transporter.sendMail(mailOptions);
};
