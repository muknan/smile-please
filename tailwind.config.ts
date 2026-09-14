import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neem: { 950: "#102D27", 900: "#183C34", 700: "#285545", 600: "#32634F", 200: "#C6D5C9", 100: "#E2E9DF", 50: "#F0F4EE" },
        marigold: { 700: "#76520B", 600: "#9B6E14", 500: "#E0B54B", 100: "#F7E8B7" },
        mineral: { 50: "#F8F5ED" },
        ink: { 950: "#1B3029" },
        chalk: { 0: "#FFFFFF" },
        clay: { 600: "#B4472F" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        utility: ["var(--font-utility)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["3.75rem", { lineHeight: "1.02", letterSpacing: "-0.025em", fontWeight: "600" }],
        "display-l":  ["2.5rem",  { lineHeight: "1.08", letterSpacing: "-0.018em", fontWeight: "600" }],
        "display-m":  ["1.75rem", { lineHeight: "1.18", letterSpacing: "-0.008em", fontWeight: "500" }],
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
      borderRadius: { DEFAULT: "6px", card: "16px", panel: "24px" },
      screens: { xs: "480px", sm: "768px", md: "1024px", lg: "1280px" },
      transitionDuration: { DEFAULT: "150ms" },
    },
  },
  plugins: [],
};
export default config;
