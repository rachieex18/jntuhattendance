/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#3b82f6',
                    dark: '#0f172a',
                    light: '#60a5fa',
                },
                surface: '#1e293b',
                secondary: '#1e293b', // Matching surface for now, can be tweaked
                text: {
                    primary: '#f1f5f9',
                    secondary: '#94a3b8',
                },
                success: '#10b981',
                warning: '#f59e0b',
                danger: '#ef4444',
                accent: '#8b5cf6',
            },
            animation: {
                fadeIn: 'fadeIn 0.3s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
}
