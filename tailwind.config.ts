import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        md: 'calc(var(--radius) - 2px)',
        xl: 'var(--rounded-xl)',
        lg: 'var(--radius)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        tertiary: 'hsl(var(--tertiary))',
        white: 'hsl(var(--white))',
        brand: {
          25: 'hsl(var(--brand-25))',
          50: 'hsl(var(--brand-50))',
          100: 'hsl(var(--brand-100))',
          200: 'hsl(var(--brand-200))',
          300: 'hsl(var(--brand-300))',
          400: 'hsl(var(--brand-400))',
          500: 'hsl(var(--brand-500))',
          600: 'hsl(var(--brand-600))',
          700: 'hsl(var(--brand-700))',
          800: 'hsl(var(--brand-800))',
          900: 'hsl(var(--brand-900))',
          DEFAULT: 'hsl(var(--brand-600))',
        },
        brandDark: 'hsl(var(--brand-dark))',

        warning: 'hsl(var(--warning))',
        default: {
          25: 'hsl(var(--default-25))',
          50: 'hsl(var(--default-50))',
          100: 'hsl(var(--default-100))',
          200: 'hsl(var(--default-200))',
          300: 'hsl(var(--default-300))',
          400: 'hsl(var(--default-400))',
          500: 'hsl(var(--default-500))',
          600: 'hsl(var(--default-600))',
          700: 'hsl(var(--default-700))',
          800: 'hsl(var(--default-800))',
          900: 'hsl(var(--default-900))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        bg: {
          tertiary: 'hsl(var(--bg-tertiary))',
          gradient: 'var(--bg-gradient)',
        },
        btn: {
          primary: {
            DEFAULT: 'var(--brand-600)',
            hover: '#f00',
            active: '#5B3DB5',
            disabled: '#A8A8A8',
          },
          secondary: {
            DEFAULT: '#F3F4F6',
            hover: '#E5E7EB',
            active: '#D1D5DB',
            disabled: '#A8A8A8',
          },
          danger: {
            DEFAULT: '#EF4444',
            hover: '#DC2626',
            active: '#B91C1C',
            disabled: '#A8A8A8',
          },
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },

        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },

        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: 'hsl(var(--success))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },

      spacing: {},
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
