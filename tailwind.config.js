/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        c1: "#F8F5E9",
        c2: "#F8F5E9",
        c3: "#F8F5E9",
        c4: "#1b4638",
        back: "#F8F5E9",
         b1: "#2f201e",
        b2: "#6b291c",
        b3: "#f7ecdb",
        b4: "#d7ae75",
      },
    },
  },
  plugins: [],
}
