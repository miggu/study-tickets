import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendPort = Number(env.BACKEND_PORT || env.PORT || 3001);

  return {
    plugins: [react()],
    // Keep Vite build output separate from the server build (Vite clears dist/).
    build: {
      outDir: "dist/client",
    },
    // Dev-only: proxy /api to the backend to avoid CORS and keep relative URLs.
    server: {
      proxy: {
        "/api": {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
        },
      },
      host: true,
    },
    test: {
      environment: "jsdom",
      setupFiles: "test/setup.ts",
    },
  };
});
