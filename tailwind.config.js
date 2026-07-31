/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        kemix: {
          bg: '#121212',
          surface: '#1A1A1A',
          elevated: '#242424',
          border: '#2E2E2E',
          'border-light': '#333333',
          text: '#FFFFFF',
          'text-secondary': '#A0A0A0',
          muted: '#6B6B6B',
          blue: '#3B82F6',
          'blue-soft': '#60A5FA',
          'blue-muted': '#1E3A5F',
          'blue-light': '#1A2332',
          navy: '#FFFFFF',
          'navy-soft': '#A0A0A0',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'System'],
        medium: ['Pretendard-Medium', 'System'],
        semibold: ['Pretendard-SemiBold', 'System'],
        bold: ['Pretendard-Bold', 'System'],
      },
      fontSize: {
        'kemix-display': ['28px', { lineHeight: '36px', fontWeight: '700' }],
        'kemix-title': ['22px', { lineHeight: '30px', fontWeight: '700' }],
        'kemix-headline': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'kemix-body': ['15px', { lineHeight: '22px' }],
        'kemix-caption': ['13px', { lineHeight: '18px' }],
        'kemix-label': ['12px', { lineHeight: '16px', fontWeight: '600' }],
      },
      borderRadius: {
        kemix: '16px',
        'kemix-lg': '20px',
        'kemix-sm': '12px',
      },
      spacing: {
        'kemix-screen': '32px',
        'kemix-section': '36px',
        'kemix-card': '24px',
      },
    },
  },
  plugins: [],
};
