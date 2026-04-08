/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#235347",
        secondary: "#8EB69B",
        accent: "#DAF1DE",
        highlight: "#16837A",

        // 🔥 variantes automáticas para UI
        primaryLight: "#2f6b5a",
        primaryDark: "#1b4037",

        secondaryLight: "#a8cbb3",
        secondaryDark: "#6e9580",
      },

      // 🧱 Sombras elegantes
      boxShadow: {
        soft: "0 4px 20px rgba(0,0,0,0.05)",
        card: "0 8px 30px rgba(0,0,0,0.08)",
      },

      // 🔤 Tipografía moderna
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },

      // 🔘 Bordes premium
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },

      // ⚡ Transiciones suaves
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
