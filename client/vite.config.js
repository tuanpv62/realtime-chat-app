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
      outDir: "dist",
      sourcemap: mode === "development",

      rollupOptions: {
        output: {
          // ✅ FIX: chuyển từ object → function
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react")) return "react";
              if (id.includes("socket.io-client")) return "socket";
              if (id.includes("@radix-ui")) return "ui";
              if (id.includes("@emoji-mart")) return "emoji";
              if (
                id.includes("date-fns") ||
                id.includes("zod") ||
                id.includes("zustand") ||
                id.includes("axios")
              ) {
                return "utils";
              }
              return "vendor"; // fallback
            }
          },
        },
      },

      chunkSizeWarningLimit: 500,
    },
    preview: {
      port: 4173,
    },
  };
});
