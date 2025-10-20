import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand Color (Green)
        primary: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50', // Main primary
          600: '#43A047',
          700: '#388E3C',
          800: '#2E7D32',
          900: '#1B5E20',
          950: '#0D3F0F',
        },
        // Secondary Brand Color (Blue)
        secondary: {
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#4A90E2', // Main secondary
          600: '#1E88E5',
          700: '#1976D2',
          800: '#1565C0',
          900: '#0D47A1',
          950: '#082F49',
        },
        // Accent Color (Orange/Amber)
        accent: {
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFCA28',
          500: '#FDA811', // Main accent
          600: '#F57C00',
          700: '#EF6C00',
          800: '#E65100',
          900: '#BF360C',
          950: '#7F2300',
        },
        // Purple for special features
        purple: {
          50: '#F3E5F5',
          100: '#E1BEE7',
          200: '#CE93D8',
          300: '#BA68C8',
          400: '#AB47BC',
          500: '#9C27B0',
          600: '#8E24AA',
          700: '#7B1FA2',
          800: '#6A1B9A',
          900: '#4A148C',
          950: '#2E0854',
        },
        // System colors
        background: '#FBFBFB',
        foreground: '#212121',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"Noto Sans"',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
      },
    },
  },
  plugins: [],
};

export default config;