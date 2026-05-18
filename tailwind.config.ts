import type { Config } from 'tailwindcss';

const config: Config = {
  future: {
    hoverOnlyWhenSupported: true,
  },
  darkMode: ['variant', '&:is(.dark *):not(.light *)'],
  content: ['./src/renderer/src/**/*.{ts,tsx}'],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      boxShadow: {
        button: '0 3px 25px 3px rgba(0, 0, 0, 0.05)',
      },
      colors: {
        gray: {
          1: 'var(--gray-1)',
          2: 'var(--gray-2)',
          3: 'var(--gray-3)',
          4: 'var(--gray-4)',
          5: 'var(--gray-5)',
          6: 'var(--gray-6)',
          7: 'var(--gray-7)',
          8: 'var(--gray-8)',
          9: 'var(--gray-9)',
        },
        red: {
          1: 'var(--red-1)',
          2: 'var(--red-2)',
        },
        green: {
          1: 'var(--green-1)',
          2: 'var(--green-2)',
          3: 'var(--green-3)',
        },
        lime: 'var(--lime)',
        ['radio-orange']: 'var(--radio-orange)',
        ['radio-yellow']: 'var(--radio-yellow)',
        ['radio-blue']: 'var(--radio-blue)',
        ['radio-pink']: 'var(--radio-pink)',
        ['radio-green']: 'var(--radio-green)',
        ['radio-red']: 'var(--radio-red)',
        ['radio-dark-blue']: 'var(--radio-dark-blue)',
        ['dark-gray']: {
          1: 'var(--dark-gray-1)',
          2: 'var(--dark-gray-2)',
          3: 'var(--dark-gray-3)',
          4: 'var(--dark-gray-4)',
          5: 'var(--dark-gray-5)',
          6: 'var(--dark-gray-6)',
          7: 'var(--dark-gray-7)',
          8: 'var(--dark-gray-8)',
          9: 'var(--dark-gray-9)',
        },
        ['dark-green']: {
          1: 'var(--dark-green-1)',
          2: 'var(--dark-green-2)',
          3: 'var(--dark-green-3)',
        },
        ['dark-red']: {
          1: 'var(--dark-red-1)',
          2: 'var(--dark-red-2)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
};

export default config;
