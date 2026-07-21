import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },

        // Saffron ramp. Daily Gita's accent, which happens to measure the same
        // as the AIX brand ramp — so the template's tint/shade steps transfer
        // without a palette fork. The one accent: primary CTA, active nav,
        // current selection. Never decorative.
        brand: {
          25: '#fff8f2',
          50: '#fef3e8',
          100: '#fde6cf',
          200: '#fbcfa0',
          300: '#fab673',
          400: '#f79a47',
          500: '#f47920',
          600: '#e06b15',
          700: '#bc580f',
          800: '#954510',
          900: '#78380f',
          950: '#411c06'
        },

        // Untitled-UI gray ramp, replacing Tailwind's stock gray. Page ink is
        // gray-800 / white, muted gray-500 (light) / gray-400 (dark), borders
        // gray-200 / gray-800 subtle and gray-300 / gray-700 interactive.
        gray: {
          25: '#fcfcfd',
          50: '#f9fafb',
          100: '#f2f4f7',
          200: '#e4e7ec',
          300: '#d0d5dd',
          400: '#98a2b3',
          500: '#667085',
          600: '#475467',
          700: '#344054',
          800: '#1d2939',
          900: '#101828',
          950: '#0c111d'
        },

        success: {
          25: '#f6fef9',
          50: '#ecfdf3',
          100: '#d1fadf',
          200: '#a6f4c5',
          300: '#6ce9a6',
          400: '#32d583',
          500: '#12b76a',
          600: '#039855',
          700: '#027a48',
          800: '#05603a',
          900: '#054f31',
          950: '#053321'
        },
        error: {
          25: '#fffbfa',
          50: '#fef3f2',
          100: '#fee4e2',
          200: '#fecdca',
          300: '#fda29b',
          400: '#f97066',
          500: '#f04438',
          600: '#d92d20',
          700: '#b42318',
          800: '#912018',
          900: '#7a271a',
          950: '#55160c'
        },
        warning: {
          25: '#fffcf5',
          50: '#fffaeb',
          100: '#fef0c7',
          200: '#fedf89',
          300: '#fec84b',
          400: '#fdb022',
          500: '#f79009',
          600: '#dc6803',
          700: '#b54708',
          800: '#93370d',
          900: '#7a2e0e',
          950: '#4e1d09'
        }
      },

      // Radii run tight — the whole scale is retuned one notch crisper than
      // stock so nothing reads soft or bubbly. Controls (buttons, inputs,
      // chips, menu items) = rounded-lg = 5px. Cards = rounded-2xl = 8px.
      // Avatars, dots and pills = rounded-full. Move the system from here;
      // never hardcode a radius at a call site.
      borderRadius: {
        sm: '0.1875rem',   // 3px
        DEFAULT: '0.25rem', // 4px
        md: '0.25rem',     // 4px
        lg: '0.3125rem',   // 5px — controls
        xl: '0.375rem',    // 6px
        '2xl': '0.5rem',   // 8px — cards
        '3xl': '0.75rem'   // 12px
      },

      fontSize: {
        'theme-xs': ['12px', '18px'],
        'theme-sm': ['14px', '20px'],
        'theme-xl': ['20px', '30px'],
        'title-sm': ['30px', '38px'],
        'title-md': ['36px', '44px'],
        'title-lg': ['48px', '60px'],
        'title-xl': ['60px', '72px'],
        'title-2xl': ['72px', '90px']
      },

      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'waveform': {
          '0%, 100%': { height: '0.25rem' },
          '50%': { height: '1rem' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'waveform': 'waveform 0.5s ease-in-out infinite'
      },

      // Cards sit flat: border + bg, hover shifts the border. Shadow exists
      // only on the primary CTA and on floating chrome.
      boxShadow: {
        'theme-xs': 'var(--shadow-theme-xs)',
        'theme-sm': 'var(--shadow-theme-sm)',
        'theme-md': 'var(--shadow-theme-md)',
        cta: 'var(--shadow-cta)',
        'cta-strong': 'var(--shadow-cta-strong)',
        elevated: 'var(--shadow-elevated)',
        'focus-ring': '0 0 0 4px rgba(244, 121, 32, 0.12)'
      },

      transitionTimingFunction: {
        'out-expo': 'var(--ease-out-expo)',
        quiet: 'var(--ease-quiet)'
      },

      fontFamily: {
        // Latin UI, body, labels and data.
        sans: ['Inter', 'Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        // Display headings only — never labels or data.
        display: ['Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        // Daily Gita's own. Sanskrit is never set in the template's Latin type.
        sanskrit: ['Arya', 'Noto Sans Devanagari', 'sans-serif']
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
