/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}', './lib/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        graphite: { 900: '#111417', 800: '#1A1E22', 700: '#242A2F' },
        steel: { 500: '#3A4148', 400: '#4b545c', 300: '#6b747c' },
        accent: { DEFAULT: '#FF6A13', dark: '#E85B00', soft: '#FFF1E8' },
        surface: '#F5F6F7',
        card: '#FFFFFF',
        success: '#16A34A',
        danger: '#DC2626',
        warning: '#F59E0B',
        ink: '#14181C',
        muted: '#6B7280',
      },
      fontFamily: {
        sans: ['var(--font-vazir)', 'system-ui', 'sans-serif'],
        display: ['var(--font-barlow)', 'Impact', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(17,20,23,.04), 0 8px 24px -12px rgba(17,20,23,.14)',
        lift: '0 18px 40px -18px rgba(17,20,23,.35)',
        glow: '0 10px 30px -8px rgba(255,106,19,.55)',
      },
      borderRadius: { xl2: '1.25rem' },
      keyframes: {
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        // جابه‌جایی به اندازهٔ دقیقاً یک نسخه از لیست (--mq-shift) → چسبیدن آخرین برند به اولین برند
        marqueeShift: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(calc(-1 * var(--mq-shift)))' } },
        spinSlow: { to: { transform: 'rotate(360deg)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        marquee: 'marquee 38s linear infinite',
        'marquee-shift': 'marqueeShift 38s linear infinite',
        'marquee-fast': 'marquee 22s linear infinite',
        'spin-slow': 'spinSlow 24s linear infinite',
      },
    },
  },
  plugins: [],
};
