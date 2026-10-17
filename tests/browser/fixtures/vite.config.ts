import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const root = fileURLToPath(new URL(".", import.meta.url));
const appRoot = path.resolve(root, "../../..");

export default defineConfig({
  root,
  publicDir: path.join(appRoot, "public"),
  cacheDir: path.join(appRoot, "node_modules/.vite-personal-report-tests"),
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.join(appRoot, "src") } },
  server: { fs: { allow: [appRoot] } },
});
