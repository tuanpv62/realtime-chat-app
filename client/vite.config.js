import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    server: {
      port: 5173,
      proxy: {
        "/api/v1": {
          target: "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      // Output directory
      outDir: "dist",
      // Source maps chỉ cho dev
      sourcemap: mode === "development",
      // Chunk splitting để tối ưu loading
      rollupOptions: {
        output: {
          manualChunks: {
            // Tách vendor libraries thành chunk riêng
            // → Browser cache lâu hơn vì không đổi thường xuyên
            react: ["react", "react-dom", "react-router-dom"],
            socket: ["socket.io-client"],
            ui: [
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-avatar",
              "@radix-ui/react-tooltip",
            ],
            emoji: ["@emoji-mart/react", "@emoji-mart/data"],
            utils: ["date-fns", "zod", "zustand", "axios"],
          },
        },
      },
      // Warn nếu chunk > 500KB
      chunkSizeWarningLimit: 500,
    },
    preview: {
      port: 4173,
    },
  };
});
