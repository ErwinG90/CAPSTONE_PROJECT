/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#4ade80", // verde claro
          DEFAULT: "#22c55e", // verde principal
          dark: "#16a34a", // verde más oscuro
        },
        background: "#ffffff", // fondo blanco
        text: "#111827",       // texto oscuro
      },
    },
  },
  plugins: [],
};