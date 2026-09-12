import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#050b14",
          900: "#07111d",
          850: "#0a1628",
          800: "#0d1d33",
          750: "#10243d",
          700: "#163047",
          600: "#1c3d57",
        },
        accent: {
          cyan: "#38d6ff",
          teal: "#14b8a6",
          blue: "#3b82f6",
        },
      },
      boxShadow: {
        card: "0 8px 32px rgba(0, 0, 0, 0.28)",
        glow: "0 0 24px rgba(56, 214, 255, 0.16)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Segoe UI", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
