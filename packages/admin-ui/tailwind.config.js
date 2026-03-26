/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7ff',
          100: '#d9edff',
          200: '#bce0ff',
          300: '#8ecdff',
          400: '#59b0ff',
          500: '#338dfc',
          600: '#1d6ef1',
          700: '#1558de',
          800: '#1847b4',
          900: '#1a3f8e',
          950: '#152856',
        },
        teal: {
          50: '#effefb',
          100: '#c8fff4',
          200: '#91fee9',
          300: '#52f5dc',
          400: '#1ee2ca',
          500: '#06c6b1',
          600: '#02a092',
          700: '#068076',
          800: '#0a655f',
          900: '#0d534f',
          950: '#003332',
        },
        healthcare: {
          bg: '#f8fafc',
          card: '#ffffff',
          line: '#e2e8f0',
          text: '#1e293b',
          muted: '#64748b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
