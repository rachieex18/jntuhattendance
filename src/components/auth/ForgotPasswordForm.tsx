import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Lock, Key } from 'lucide-react';

interface ForgotPasswordFormProps {
    onBack: () => void;
}

export const ForgotPasswordForm = ({ onBack }: ForgotPasswordFormProps) => {
    const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email');
    const [email, setEmail] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { forgotPassword, verifyResetCode, resetPassword } = useAuth();

    const handleSendResetCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await forgotPassword(email);

        if (result.success) {
            toast.success('Reset code sent to your email!');
            setStep('verify');
        } else {
            toast.error(result.error || 'Failed to send reset code');
        }

        setLoading(false);
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await verifyResetCode(email, resetCode);

        if (result.success && result.resetToken) {
            toast.success('Code verified! Set your new password.');
            setResetToken(result.resetToken);
            setStep('reset');
        } else {
            toast.error(result.error || 'Invalid reset code');
        }

        setLoading(false);
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);

        const result = await resetPassword(resetToken, newPassword);

        if (result.success) {
            toast.success('Password reset successfully! You can now login.');
            onBack(); // Go back to login form
        } else {
            toast.error(result.error || 'Failed to reset password');
        }

        setLoading(false);
    };

    return (
        <div className="max-w-md mx-auto mt-12 p-8 bg-surface rounded-xl shadow-2xl border border-gray-800">
            <div className="flex items-center mb-6">
                <button
                    onClick={onBack}
                    className="mr-3 p-2 text-text-secondary hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-3xl font-bold text-primary-light">
                    {step === 'email' && 'Forgot Password'}
                    {step === 'verify' && 'Verify Code'}
                    {step === 'reset' && 'Reset Password'}
                </h2>
            </div>

            {step === 'email' && (
                <form onSubmit={handleSendResetCode} className="space-y-4">
                    <div className="text-center mb-6">
                        <Mail className="w-16 h-16 text-primary-light mx-auto mb-4" />
                        <p className="text-text-secondary">
                            Enter your email address and we'll send you a reset code.
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-light outline-none"
                            placeholder="your-email@example.com"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 px-4 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Sending...' : 'Send Reset Code'}
                    </button>
                </form>
            )}

            {step === 'verify' && (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                    <div className="text-center mb-6">
                        <Key className="w-16 h-16 text-primary-light mx-auto mb-4" />
                        <p className="text-text-secondary">
                            We've sent a 6-digit code to <strong>{email}</strong>
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Reset Code</label>
                        <input
                            type="text"
                            value={resetCode}
                            onChange={(e) => setResetCode(e.target.value)}
                            className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-light outline-none text-center text-2xl tracking-widest"
                            placeholder="000000"
                            maxLength={6}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 px-4 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Verifying...' : 'Verify Code'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setStep('email')}
                        className="w-full py-2 px-4 text-text-secondary hover:text-white transition-colors"
                    >
                        Resend Code
                    </button>
                </form>
            )}

            {step === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="text-center mb-6">
                        <Lock className="w-16 h-16 text-primary-light mx-auto mb-4" />
                        <p className="text-text-secondary">
                            Create a new password for your account.
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-light outline-none"
                            placeholder="Enter new password"
                            minLength={8}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-light outline-none"
                            placeholder="Confirm new password"
                            minLength={8}
                            required
                        />
                    </div>
                    <div className="bg-secondary p-3 rounded-lg border border-gray-700">
                        <p className="text-xs text-text-secondary">
                            <strong>Password Requirements:</strong>
                        </p>
                        <ul className="text-xs text-text-secondary mt-1 ml-4">
                            <li>• At least 8 characters long</li>
                            <li>• Mix of letters and numbers recommended</li>
                        </ul>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 px-4 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            )}
        </div>
    );
};