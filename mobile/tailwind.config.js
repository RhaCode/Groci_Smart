/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#0ea5e9',
        'primary-dark': '#0284c7',
        'primary-light': '#38bdf8',
        
        accent: '#d946ef',
        'accent-dark': '#c026d3',
        'accent-light': '#e879f9',
        
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        
        background: '#111827',
        surface: '#1f2937',
        'surface-light': '#374151',
        
        border: '#374151',
        'border-light': '#4b5563',
        
        'text-primary': '#f9fafb',
        'text-secondary': '#d1d5db',
        'text-muted': '#9ca3af',
      },
      fontFamily: {
        sans: ['System'],
        mono: ['Courier'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
