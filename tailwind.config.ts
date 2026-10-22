import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#008F73", deep: "#075E57", mint: "#DDF8ED", glow: "#2BD9B0" },
        navy: { DEFAULT: "#102A43", 800: "#0B1E31", 900: "#07131F" },
        ice: "#F7FAFC",
        muted: "#64748B",
      },
      fontFamily: {
        sans: ["var(--font-cairo)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,42,67,.04), 0 12px 32px -8px rgba(16,42,67,.10)",
        lift: "0 2px 4px rgba(16,42,67,.05), 0 24px 56px -12px rgba(16,42,67,.18)",
        glow: "0 0 0 1px rgba(43,217,176,.25), 0 20px 60px -10px rgba(0,143,115,.55)",
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(.6)", opacity: ".7" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        shimmer: { "100%": { transform: "translateX(-100%)" } },
        drift: {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(40px,-30px,0) scale(1.12)" },
        },
        introOut: {
          "0%,70%": { opacity: "1" },
          "100%": { opacity: "0", visibility: "hidden" },
        },
        introLogo: {
          "0%": { opacity: "0", transform: "scale(.85)" },
          "35%,70%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(1.06)" },
        },
      },
      animation: {
        "pulse-ring": "pulseRing 2.4s cubic-bezier(.22,1,.36,1) infinite",
        shimmer: "shimmer 1.6s infinite",
        drift: "drift 14s ease-in-out infinite",
        "intro-out": "introOut 1.5s ease forwards",
        "intro-logo": "introLogo 1.5s cubic-bezier(.22,1,.36,1) forwards",
      },
    },
  },
  plugins: [],
};
export default config;
