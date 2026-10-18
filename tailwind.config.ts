import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "pp-bg": "#050B18",
        "pp-bg-2": "#0A1428",
        "pp-card": "#0E1B33",
        "pp-blue": "#2563EB",
        "pp-electric": "#38BDF8",
        "pp-light": "#93C5FD",
        "pp-text": "#F1F5F9",
        "pp-muted": "#94A3B8",
        "pp-border": "#1E3A5F",
        "pp-gold": "#FBBF24",
        "pp-silver": "#D1D5DB",
        "pp-bronze": "#C2410C",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "grid-shift": "gridShift 20s linear infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        gridShift: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "50px 50px" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;