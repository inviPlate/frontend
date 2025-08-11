const flowbiteReact = require("flowbite-react/plugin/tailwindcss");

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js",
    ".flowbite-react/class-list.json"
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [require('flowbite/plugin'), flowbiteReact],
}