/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f9f9ff',
        surface: '#ffffff',
        'surface-dim': '#cfdaf2',
        border: '#e2e8f0',
        primary: {
          DEFAULT: '#004ac6',
          container: '#2563eb',
          hover: '#1e40af',
        },
        text: {
          high: '#111c2d',
          body: '#434655',
        },
        error: '#ba1a1a',
      },
      fontFamily: {
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0px 4px 6px -1px rgba(0, 0, 0, 0.05)',
        'modal': '0px 10px 25px -5px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}
