import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';

interface LoginFormProps {
    onForgotPassword: () => void;
}

export const LoginForm = ({ onForgotPassword }: LoginFormProps) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await login(email, password);

        if (result.success) {
            toast.success('Login successful!');
        } else {
            toast.error(result.error || 'Login failed');
        }

        setLoading(false);
    };

    return (
        <div className="max-w-md mx-auto mt-12 p-8 bg-surface rounded-xl shadow-2xl border border-gray-800">
            <h2 className="text-3xl font-bold text-primary-light mb-6 text-center">Student Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-light outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 bg-secondary border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-light outline-none"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 px-4 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                    {loading ? 'Logging in...' : 'Sign In'}
                </button>
            </form>
            <div className="mt-4 text-center">
                <button
                    onClick={onForgotPassword}
                    className="text-primary-light hover:underline text-sm"
                >
                    Forgot your password?
                </button>
            </div>
        </div>
    );
};