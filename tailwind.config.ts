import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neem: { 900: "#12302A", 600: "#2E6B54", 100: "#DCE7E0" },
        marigold: { 500: "#E9A227" },
        mineral: { 50: "#F1F4F1" },
        ink: { 950: "#101A16" },
        chalk: { 0: "#FFFFFF" },
        clay: { 600: "#B4472F" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        utility: ["var(--font-utility)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["4rem",    { lineHeight: "1.02", letterSpacing: "-0.015em", fontWeight: "600" }],
        "display-l":  ["2.75rem", { lineHeight: "1.08", letterSpacing: "-0.01em",  fontWeight: "600" }],
        "display-m":  ["2rem",    { lineHeight: "1.15", fontWeight: "500" }],
        "body-l":     ["1.1875rem", { lineHeight: "1.6" }],
        "body":       ["1.0625rem", { lineHeight: "1.65" }],
        "body-s":     ["0.9375rem", { lineHeight: "1.55" }],
        "label":      ["0.8125rem", { lineHeight: "1.3", letterSpacing: "0.06em", fontWeight: "500" }],
        "data":       ["0.9375rem", { lineHeight: "1.4" }],
      },
      spacing: {
        1: "4px", 2: "8px", 4: "16px", 6: "24px",
        10: "40px", 16: "64px", 24: "96px", 36: "144px",
      },
      maxWidth: { content: "1200px" },
      borderRadius: { DEFAULT: "4px", card: "12px" },
      screens: { xs: "480px", sm: "768px", md: "1024px", lg: "1280px" },
      transitionDuration: { DEFAULT: "150ms" },
    },
  },
  plugins: [],
};
export default config;
