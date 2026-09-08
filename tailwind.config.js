/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#08111C",
        navy2: "#10283D",
        burgundy: "#2A0D13",
        burgundy2: "#3A1118",
        gold: "#C8A96B",
        goldLight: "#E0C27A",
        ivory: "#F6F1E7",
        muted: "#A7ADB3",
        beige: "#D8C8AD",
        wood: "#1C0F0F",
      },
      fontFamily: {
        serif: ["'Cormorant Garamond'", "serif"],
        sans: ["Inter", "sans-serif"],
        script: ["'Tangerine'", "cursive"],
      },
    },
  },
  plugins: [],
};
