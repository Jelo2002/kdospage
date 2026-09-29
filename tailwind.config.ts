import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        corp: {
          bg: "#f8fafc",
          card: "#ffffff",
          elevated: "#ffffff",
          border: "#e2e8f0",
          borderSubtle: "#f1f5f9",
          primary: "#059669",
          primaryHover: "#047857",
          emerald: "#059669",
          amber: "#d97706",
          rose: "#e11d48",
        },
        clivax: {
          bg: "#f8fafc",
          sidebar: "#ffffff",
          sidebarHover: "#f1f5f9",
          card: "#ffffff",
          cardElevated: "#ffffff",
          border: "#e2e8f0",
          borderLight: "#f1f5f9",
          primary: "#059669",
          primaryLight: "#10b981",
          primaryHover: "#047857",
          gold: "#d97706",
          muted: "#64748b",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "'JetBrains Mono'",
          "'SF Mono'",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
