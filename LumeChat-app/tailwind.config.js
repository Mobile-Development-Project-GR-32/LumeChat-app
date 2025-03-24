/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#5865F2",
        discord: {
          bg: "#313338",
          card: "#2B2D31",
          input: "#1E1F22",
          text: "#B5BAC1",
          link: "#00A8FC"
        }
      }
    }
  }
};
