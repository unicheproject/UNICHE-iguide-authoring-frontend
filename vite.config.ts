import path from "node:path";
import vue from "@vitejs/plugin-vue";
import { defineConfig, lazyPlugins } from "vite-plus";

export default defineConfig({
  fmt: {},
  plugins: lazyPlugins(() => [vue()]),
  // Fixed so the Keycloak redirect URI and the backend CORS origin (http://localhost:5173) always match.
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
