/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        neo: {
          yellow: '#FFE500',
          pink: '#FF4D8D',
          cyan: '#00E5FF',
          lime: '#B6FF00',
          orange: '#FF7A00',
          cream: '#FFF8E7',
          black: '#000000',
        },
      },
      fontFamily: {
        display: ['"Archivo Black"', '"Space Grotesk"', 'sans-serif'],
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      boxShadow: {
        neo: '6px 6px 0px #000000',
        'neo-sm': '4px 4px 0px #000000',
        'neo-lg': '8px 8px 0px #000000',
      },
    },
  },
  plugins: [],
};
