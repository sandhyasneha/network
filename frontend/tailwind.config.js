/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    theme: {
        extend: {
            fontFamily: {
                mono: ['"Roboto Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
            colors: {
                navy: {
                    950: '#050B14',
                    900: '#0A1128',
                    800: '#0F172A',
                    700: '#172554',
                },
                signal: {
                    red: '#EF4444',
                    neon: '#FF3B30',
                    blue: '#1C4ED8',
                    cyan: '#3B82F6',
                    green: '#10B981',
                    amber: '#F59E0B',
                },
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            keyframes: {
                'scan': {
                    '0%, 100%': { transform: 'translateY(0)', opacity: '0.8' },
                    '50%': { transform: 'translateY(100%)', opacity: '0.3' },
                },
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 12px rgba(239,68,68,0.6), inset 0 0 8px rgba(239,68,68,0.2)' },
                    '50%': { boxShadow: '0 0 24px rgba(239,68,68,0.9), inset 0 0 12px rgba(239,68,68,0.35)' },
                },
                'pulse-glow-amber': {
                    '0%, 100%': { boxShadow: '0 0 12px rgba(245,158,11,0.6)' },
                    '50%': { boxShadow: '0 0 24px rgba(245,158,11,0.9)' },
                },
                'fade-in-up': {
                    'from': { opacity: '0', transform: 'translateY(8px)' },
                    'to': { opacity: '1', transform: 'translateY(0)' },
                },
                'reticle': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.05)' },
                },
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' }
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' }
                },
            },
            animation: {
                'scan': 'scan 2.4s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 1.6s ease-in-out infinite',
                'pulse-glow-amber': 'pulse-glow-amber 1.6s ease-in-out infinite',
                'fade-in-up': 'fade-in-up 280ms ease-out both',
                'reticle': 'reticle 2s ease-in-out infinite',
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out'
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
};
