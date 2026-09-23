import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base 用 './' 相对路径，保证 github.io 的 /<repo>/ 子路径下资源也能加载。
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./",
  resolve: {
    alias: { "@": "/src" },
  },
});
