import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neem: { 950: "rgb(var(--neem-950) / <alpha-value>)", 900: "rgb(var(--neem-900) / <alpha-value>)", 700: "rgb(var(--neem-700) / <alpha-value>)", 600: "rgb(var(--neem-600) / <alpha-value>)", 200: "rgb(var(--neem-200) / <alpha-value>)", 100: "rgb(var(--neem-100) / <alpha-value>)", 50: "rgb(var(--neem-50) / <alpha-value>)" },
        marigold: { 700: "rgb(var(--marigold-700) / <alpha-value>)", 600: "rgb(var(--marigold-600) / <alpha-value>)", 500: "rgb(var(--marigold-500) / <alpha-value>)", 100: "rgb(var(--marigold-100) / <alpha-value>)" },
        mineral: { 50: "rgb(var(--mineral-50) / <alpha-value>)" },
        ink: { 950: "rgb(var(--ink-950) / <alpha-value>)" },
        chalk: { 0: "rgb(var(--chalk-0) / <alpha-value>)" },
        clay: { 600: "rgb(var(--clay-600) / <alpha-value>)" },
        canvas: "rgb(var(--mineral-50) / <alpha-value>)",
        surface: "rgb(var(--chalk-0) / <alpha-value>)",
        foreground: "rgb(var(--ink-950) / <alpha-value>)",
        outline: "rgb(var(--neem-200) / <alpha-value>)",
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
