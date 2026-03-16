import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Supabase Init
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('CRITICAL: Missing Supabase Environment Variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// ── Email provider ──────────────────────────────────────────────────────────
// Prefers Resend (HTTPS, never blocked) when RESEND_API_KEY is set.
// Falls back to Gmail SMTP if only EMAIL_USER / EMAIL_PASS are set.

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

// Gmail nodemailer transport (only used if Resend is not configured)
const gmailTransport = (!resend && process.env.EMAIL_USER && process.env.EMAIL_PASS)
    ? nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
    })
    : null;

/**
 * Universal email sender.
 * Uses Resend if RESEND_API_KEY is set, Gmail otherwise.
 */
export const sendEmail = async ({ to, subject, html }) => {
    const fromAddr = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@example.com';
    const isDev = process.env.NODE_ENV !== 'production';

    try {
        if (resend) {
            const { error } = await resend.emails.send({ from: fromAddr, to, subject, html });
            if (error) throw new Error(error.message);
            console.log(`Email sent via Resend to ${to}`);
        } else if (gmailTransport) {
            await gmailTransport.sendMail({ from: fromAddr, to, subject, html });
            console.log(`Email sent via Gmail to ${to}`);
        } else {
            console.warn('⚠️ No email provider configured.');
            if (isDev) {
                console.log('--- DEV MODE: EMAIL CONTENT START ---');
                console.log(`To: ${to}`);
                console.log(`Subject: ${subject}`);
                console.log(`Body: ${html.replace(/<[^>]*>?/gm, ' ')}`);
                console.log('--- DEV MODE: EMAIL CONTENT END ---');
            }
        }
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        
        // In development, don't crash the request if email fails (likely SMTP block)
        if (isDev) {
            console.log('--- DEV MODE (SEND FAILURE): LOGGING CONTENT INSTEAD ---');
            console.log(`To: ${to}`);
            console.log(`Body Snippet: ${html.substring(0, 500)}`);
            return; // Allow the flow to continue
        }
        
        throw error; // Rethrow in production
    }
};

// Legacy alias used by signup.js
export const transporter = {
    sendMail: ({ from, to, subject, html }) => sendEmail({ to, subject, html }),
};

// CORS Helper
export const cors = (fn) => async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    return await fn(req, res);
};

export const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const sendOTPEmail = async (email, otp) => {
    await sendEmail({
        to: email,
        subject: '🔐 Your JNTU Attendance Verification Code',
        html: `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4f86f7;">Welcome! 🎉</h2>
            <p>Your verification code is:</p>
            <div style="background: #4f86f7; color: white; font-size: 32px; font-weight: bold;
                        padding: 20px; text-align: center; border-radius: 8px; letter-spacing: 8px;">
                ${otp}
            </div>
            <p style="margin-top: 16px; color: #888;">This code expires in 10 minutes.</p>
        </div>`,
    });
};
