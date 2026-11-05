import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        outlook: {
          50: "#f0f4f9",
          100: "#e1e9f4",
          200: "#c7d6eb",
          300: "#9fbde0",
          400: "#709fd0",
          500: "#0f6cbd", // Microsoft/Outlook signature accessible blue
          600: "#0f548c",
          700: "#114570",
          800: "#123b5c",
          900: "#14324d",
          950: "#0c1f32",
        },
      },
    },
  },
  plugins: [],
};

export default config;
