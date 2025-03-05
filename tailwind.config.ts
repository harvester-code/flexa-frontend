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
      fontSize: {
        xl: 'var(--xl)',
        '2xl': 'var(--2xl)',
        lg: 'var(--lg)',
        md: 'var(--md)',
        sm: 'var(--sm)',
        xs: 'var(--xs)',
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
        tertiary: 'var(--tertiary)',
        white: 'var(--white)',
        brand: 'var(--brand)',
        brandDark: 'var(--brand-dark)',
        red: 'var(--red)',
        deepRed: 'var(--deepRed)',
        warning: 'var(--warning)',
        default: {
          25: 'var(--default-25)',
          50: 'var(--default-50)',
          100: 'var(--default-100)',
          200: 'var(--default-200)',
          300: 'var(--default-300)',
          400: 'var(--default-400)',
          500: 'var(--default-500)',
          600: 'var(--default-600)',
          700: 'var(--default-700)',
          800: 'var(--default-800)',
          900: 'var(--default-900)',
        },
        accent: {
          25: 'var(--accent-25)',
          50: 'var(--accent-50)',
          100: 'var(--accent-100)',
          200: 'var(--accent-200)',
          300: 'var(--accent-300)',
          400: 'var(--accent-400)',
          500: 'var(--accent-500)',
          600: 'var(--accent-600)',
          700: 'var(--accent-700)',
          800: 'var(--accent-800)',
          900: 'var(--accent-900)',
        },
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
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
        // primary: {
        //   DEFAULT: 'hsl(var(--primary))',
        //   foreground: 'hsl(var(--primary-foreground))',
        // },
        // secondary: {
        //   DEFAULT: 'hsl(var(--secondary))',
        //   foreground: 'hsl(var(--secondary-foreground))',
        // },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        // accent: {
        //   DEFAULT: 'hsl(var(--accent))',
        //   foreground: 'hsl(var(--accent-foreground))',
        // },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
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
      // borderRadius: {
      //   lg: 'var(--radius)',
      //   md: 'calc(var(--radius) - 2px)',
      //   sm: 'calc(var(--radius) - 4px)',
      // },
      spacing: {},
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
