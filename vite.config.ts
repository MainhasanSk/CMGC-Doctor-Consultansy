import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ["NEXT_PUBLIC_", "VITE_"]);

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "next/link": path.resolve(__dirname, "./src/lib/router/Link.tsx"),
        "next/navigation": path.resolve(__dirname, "./src/lib/router/navigation.ts"),
      },
    },
    define: {
      "process.env": JSON.stringify(env),
    },
  };
});
