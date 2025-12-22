import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    plugins: [vue()],
    server: {
      proxy: {
        "/api": {
          target: "https://visicos-backend.onrender.com",
          changeOrigin: true
        }
      }
    },
    build: {
      minify: "esbuild",
      cssCodeSplit: true,
      sourcemap: false,
      assetsInlineLimit: 4096,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("vue")) return "vue";
            if (id.includes("vue-router")) return "router";
            if (id.includes("pinia")) return "pinia";
            if (id.includes("socket.io-client")) return "socket";
            if (id.includes("axios")) return "axios";
            return "vendor";
          }
        }
      }
    },
    esbuild: isProd ? { drop: ["console", "debugger"] } : undefined
  };
});
