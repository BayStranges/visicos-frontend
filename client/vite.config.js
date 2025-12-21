import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/api": {
        target: "https://visicos-backend.onrender.com",
        changeOrigin: true
      }
    }
  }
});
