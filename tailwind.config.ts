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
          bg: "#09090b",
          card: "#121215",
          elevated: "#18181b",
          border: "#27272a",
          borderSubtle: "#1f1f23",
          primary: "#2563eb",
          primaryHover: "#1d4ed8",
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#f43f5e",
        },
        clivax: {
          bg: "#0b0f17",
          sidebar: "#0d131f",
          sidebarHover: "#131b2c",
          card: "#111827",
          cardElevated: "#1a2234",
          border: "#1e293b",
          borderLight: "#334155",
          primary: "#10b981", // KDOS Emerald
          primaryLight: "#34d399",
          primaryHover: "#059669",
          gold: "#eab308",
          muted: "#94a3b8",
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
