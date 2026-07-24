import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sakura: {
          50: "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#ec4899",
          600: "#db2777",
          700: "#be185d",
          800: "#9d174d",
          900: "#831843",
        },
        rose: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
        },
        gold: {
          400: "#d4a853",
          500: "#c9953a",
          600: "#b07d2e",
        },
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "sakura-gradient": "linear-gradient(135deg, #2d1b2e 0%, #4a2430 30%, #6b2e3f 60%, #3d1f2e 100%)",
        "sakura-card": "linear-gradient(135deg, rgba(75, 30, 45, 0.6) 0%, rgba(90, 35, 55, 0.4) 100%)",
        "sakura-glow": "radial-gradient(ellipse at center, rgba(212, 168, 83, 0.15) 0%, transparent 70%)",
      },
    },
  },
  plugins: [],
} satisfies Config;