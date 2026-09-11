import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cmgc: {
          navy: "#0a2540",
          primary: "#0f4c81",
          secondary: "#0284c7",
          accent: "#0d9488",
          light: "#f8fafc",
          surface: "#ffffff",
          muted: "#64748b",
          border: "#e2e8f0",
          dark: "#0f172a",
        },
        status: {
          pending: {
            bg: "#fef3c7",
            text: "#92400e",
            border: "#fcd34d",
          },
          confirmed: {
            bg: "#dbeafe",
            text: "#1e40af",
            border: "#93c5fd",
          },
          ready: {
            bg: "#dcfce7",
            text: "#166534",
            border: "#86efac",
          },
          completed: {
            bg: "#f0fdf4",
            text: "#15803d",
            border: "#bbf7d0",
          },
          rejected: {
            bg: "#fee2e2",
            text: "#991b1b",
            border: "#fca5a5",
          },
          cancelled: {
            bg: "#f1f5f9",
            text: "#475569",
            border: "#cbd5e1",
          },
          rescheduled: {
            bg: "#fae8ff",
            text: "#86198f",
            border: "#f0abfc",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
