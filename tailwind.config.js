/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    // Disable preflight to avoid conflicts with Mantine
    preflight: false,
  },
};
