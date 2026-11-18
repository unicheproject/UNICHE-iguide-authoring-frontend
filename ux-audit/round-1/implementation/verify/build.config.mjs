import path from "node:path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
const root = "C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend";
export default defineConfig({ root, plugins: [vue()], resolve: { alias: { "@": path.resolve(root, "src") } }, build: { emptyOutDir: true } });
