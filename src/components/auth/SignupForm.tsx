import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';

export const SignupForm = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        rollNumber: '',
        semester: '',
        branch: '',
    });
    const [loading, setLoading] = useState(false);
    const [showOTPForm, setShowOTPForm] = useState(false);
    const [otp, setOtp] = useState('');
    const [verifyingOTP, setVerifyingOTP] = useState(false);
    
    const { signup, verifyOTP } = useAuth();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await signup({
            ...formData,
            semester: formData.semester ? parseInt(formData.semester) : undefined,
        });

        if (result.success) {
            toast.success('OTP sent to your email!');
            setShowOTPForm(true);
        } else {
            toast.error(result.error || 'Signup failed');
        }

        setLoading(false);
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setVerifyingOTP(true);

        const result = await verifyOTP(formData.email, otp);

        if (result.success) {
            toast.success('Account created successfully!');
        } else {
            toast.error(result.error || 'OTP verification failed');
        }

        setVerifyingOTP(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    if (showOTPForm) {
        return (
            <div className="max-w-md mx-auto mt-12 p-8 bg-surface rounded-xl shadow-2xl border border-gray-800">
                <h2 className="text-3xl font-bold text-primary-light mb-6 text-center">Verify Email</h2>
                <p className="text-text-secondary text-center mb-6">
                    We've sent a 6-digit code to <strong>{formData.email}</strong>
                </p>
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Enter OTP</label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-light outline-none text-center text-2xl tracking-widest"
                            placeholder="000000"
                            maxLength={6}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={verifyingOTP}
                        className="w-full py-2 px-4 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                        {verifyingOTP ? 'Verifying...' : 'Verify & Create Account'}
                    </button>
                </form>
                <button
                    onClick={() => setShowOTPForm(false)}
                    className="w-full mt-2 py-2 px-4 text-text-secondary hover:text-white transition-colors"
                >
                    Back to Signup
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-12 p-8 bg-surface rounded-xl shadow-2xl border border-gray-800">
            <h2 className="text-3xl font-bold text-primary-light mb-6 text-center">Create Account</h2>
            <form onSubmit={handleSignup} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-light outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Roll Number</label>
                    <input
                        type="text"
                        name="rollNumber"
                        value={formData.rollNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-light outline-none"
                        required
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Semester</label>
                        <select
                            name="semester"
                            value={formData.semester}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-light outline-none"
                        >
                            <option value="">Select</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                <option key={sem} value={sem}>{sem}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Branch</label>
                        <select
                            name="branch"
                            value={formData.branch}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-light outline-none"
                        >
                            <option value="">Select</option>
                            <option value="CSE">Computer Science</option>
                            <option value="ECE">Electronics</option>
                            <option value="EEE">Electrical</option>
                            <option value="MECH">Mechanical</option>
                            <option value="CIVIL">Civil</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-light outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-light outline-none"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 px-4 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                    {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
            </form>
        </div>
    );
};