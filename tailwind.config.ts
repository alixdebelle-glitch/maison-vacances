import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        stone: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
        terracotta: {
          50: '#fdf4f0',
          100: '#fbe5da',
          200: '#f6cab5',
          300: '#f0a888',
          400: '#e87f58',
          500: '#d4622f',
          600: '#b84f23',
          700: '#963e1c',
          800: '#7a3119',
          900: '#642918',
        },
        sage: {
          50: '#f4f7f4',
          100: '#e4ece4',
          200: '#cad9ca',
          300: '#a5bea6',
          400: '#799c7b',
          500: '#5a7d5c',
          600: '#456447',
          700: '#38503a',
          800: '#2e4030',
          900: '#263528',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
