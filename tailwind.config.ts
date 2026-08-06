import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
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
        },
      },
    },
  },
  plugins: [],
};
export default config;
