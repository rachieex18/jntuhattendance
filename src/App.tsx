import React, { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { LoginForm } from './components/auth/LoginForm'
import { SignupForm } from './components/auth/SignupForm'
import { ForgotPasswordForm } from './components/auth/ForgotPasswordForm'
import { Dashboard } from './components/dashboard/Dashboard'
import { Toaster } from 'sonner';

function AppContent() {
    const { user, loading, signOut } = useAuth()
    const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot'>('login')

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-light"></div>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen">
            <header className="border-b border-gray-800 py-4">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-primary-light">JNTU Attendance</h1>
                    {user && (
                        <div className="flex items-center gap-4">
                            <span className="text-text-secondary">Welcome, {user.fullName}</span>
                            <button
                                onClick={signOut}
                                className="text-sm text-text-secondary hover:text-white transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-8">
                {!user ? (
                    <div className="max-w-md mx-auto">
                        {authView === 'login' && (
                            <LoginForm onForgotPassword={() => setAuthView('forgot')} />
                        )}
                        {authView === 'signup' && <SignupForm />}
                        {authView === 'forgot' && (
                            <ForgotPasswordForm onBack={() => setAuthView('login')} />
                        )}

                        {authView !== 'forgot' && (
                            <p className="mt-4 text-center text-text-secondary">
                                {authView === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                                <button
                                    onClick={() => setAuthView(authView === 'signup' ? 'login' : 'signup')}
                                    className="text-primary-light hover:underline"
                                >
                                    {authView === 'signup' ? 'Sign In' : 'Sign Up'}
                                </button>
                            </p>
                        )}
                    </div>
                ) : (
                    <Dashboard />
                )}
            </main>

            <footer className="border-t border-gray-800 py-6 mt-auto">
                <div className="container mx-auto px-4">
                    <div className="flex justify-center items-center gap-2 text-sm text-gray-400">
                        <span>Developed by Rachith Koushik Vanam</span>
                        <span>•</span>
                        <a
                            href="https://www.linkedin.com/in/rachith-koushik-vanam003b2367"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            LinkedIn
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    )
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
            <Toaster position="top-right" theme="dark" />
        </AuthProvider>
    )
}

export default App
