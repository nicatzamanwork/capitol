/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Bu sətir Tailwind-ə deyir ki, bütün komponentləri yoxla
  ],
  theme: {
    extend: {
      colors: {
        card: "#0A0A0A",
        cardBorder: "rgba(255,255,255,0.05)",
        mutedText: "#666666",
      },
      letterSpacing: {
        widest: ".2em",
      },
    },
  },
  plugins: [],
};
