import type { Config } from 'tailwindcss';
import tailwindAnimate from 'tailwindcss-animate';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/colors.ts', // colors.ts 파일의 클래스들도 포함
  ],
  safelist: [
    // Badge colors (필요한 색상만 포함)
    {
      pattern: /^(bg|text|border)-(cyan|emerald|amber|rose|sky|purple|indigo|teal|orange|lime|pink|violet)-(100|200|700)$/,
    },
    {
      pattern: /^hover:bg-(cyan|emerald|amber|rose|sky|purple|indigo|teal|orange|lime|pink|violet)-200$/,
    },
    // Zone gradient colors
    {
      pattern: /^from-(blue|purple|green|orange|pink|indigo|cyan|emerald|amber|rose|lime|violet)-(500|600|700)$/,
    },
    {
      pattern: /^to-(blue|purple|green|orange|pink|indigo|cyan|emerald|amber|rose|lime|violet)-(600|700)$/,
    },
    {
      pattern: /^hover:from-(blue|purple|green|orange|pink|indigo|cyan|emerald|amber|rose|lime|violet)-(600|700)$/,
    },
    {
      pattern: /^hover:to-(blue|purple|green|orange|pink|indigo|cyan|emerald|amber|rose|lime|violet)-(700|800)$/,
    },
  ],
  theme: {
    extend: {
      // 🎯 폰트 시스템
      fontFamily: {
        pretendard: ['Pretendard', 'sans-serif'],
        sans: ['Pretendard', 'sans-serif'], // 기본 sans-serif를 Pretendard로 설정
      },
      // 🎯 페이지 레이아웃 시스템
      maxWidth: {
        page: '83.75rem', // 1089px (13px 기준)
      },
      spacing: {
        'page-x': '1.875rem', // 24.375px (13px 기준) - 좌우 패딩
        'page-b': '6rem', // 78px (13px 기준) - 하단 패딩
      },
      borderRadius: {
        md: 'calc(var(--radius) - 2px)',
        xl: 'var(--rounded-xl)',
        lg: 'var(--radius)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        primary: {
          50: 'hsl(var(--primary-50))',
          500: 'hsl(var(--primary-500))',
          900: 'hsl(var(--primary-900))',
          DEFAULT: 'hsl(var(--primary-500))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },

        white: 'hsl(var(--white))',
        warning: 'hsl(var(--warning))',
        default: {
          500: 'hsl(var(--default-500))',
          900: 'hsl(var(--default-900))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
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
    },
  },
  plugins: [tailwindAnimate],
} satisfies Config;
