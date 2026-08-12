/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        kemix: {
          bg: 'var(--color-kemix-bg)',
          surface: 'var(--color-kemix-surface)',
          elevated: 'var(--color-kemix-elevated)',
          border: 'var(--color-kemix-border)',
          'border-light': 'var(--color-kemix-border-light)',
          text: 'var(--color-kemix-text)',
          'text-secondary': 'var(--color-kemix-text-secondary)',
          muted: 'var(--color-kemix-muted)',
          blue: 'var(--color-kemix-blue)',
          'blue-soft': 'var(--color-kemix-blue-soft)',
          'blue-muted': 'var(--color-kemix-blue-muted)',
          'blue-light': 'var(--color-kemix-blue-light)',
          navy: 'var(--color-kemix-navy)',
          'navy-soft': 'var(--color-kemix-navy-soft)',
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
