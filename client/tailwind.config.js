export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        'cvm-blue': '#1F3A6E',
        'cvm-green': '#7AB317',
        'cvm-yellow': '#F2A900',
      },
      fontFamily: {
        sans: ['Georama', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
