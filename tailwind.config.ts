import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#f4f1fb",
          100: "#e6ddf5",
          200: "#cdb9eb",
          300: "#b095e0",
          400: "#9370d6",
          500: "#7a51c9",
          600: "#623fa3",
          700: "#4a2f7c",
          800: "#332056",
          900: "#1d1230",
          950: "#120a1e",
        },
        "app-bg": "#faf9fd",
      },
      boxShadow: {
        card: "0 1px 2px rgba(29, 18, 48, 0.04), 0 8px 24px -12px rgba(29, 18, 48, 0.12)",
        "card-hover": "0 2px 4px rgba(29, 18, 48, 0.06), 0 16px 32px -12px rgba(29, 18, 48, 0.18)",
        nav: "0 -4px 16px -4px rgba(29, 18, 48, 0.08)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s ease-in-out infinite",
        "fade-in": "fade-in 0.25s ease-out",
        "pop-in": "pop-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
