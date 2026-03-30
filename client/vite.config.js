/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "icons/*.png", "screenshots/*.png"],
        manifest: false, // Dùng manifest.json riêng
        workbox: {
          // Cache strategies
          runtimeCaching: [
            {
              // Cache API calls ngắn hạn
              urlPattern: /^https:\/\/.*\/api\/v1\/auth\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "auth-cache",
                expiration: { maxEntries: 10, maxAgeSeconds: 300 },
              },
            },
            {
              // Cache static assets lâu dài
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
              handler: "CacheFirst",
              options: {
                cacheName: "images-cache",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 ngày
                },
              },
            },
            {
              // Cache Cloudinary images
              urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "cloudinary-cache",
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 ngày
                },
              },
            },
            {
              // Cache Google Fonts nếu có
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "fonts-cache",
                expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
          // Skip waiting — Update ngay khi có service worker mới
          skipWaiting: true,
          clientsClaim: true,
          // Không cache API calls (trừ những cái đã config trên)
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api/],
        },
        devOptions: {
          enabled: true, // Test PWA khi development
          type: "module",
        },
      }),
    ],
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
          manualChunks: {
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
      chunkSizeWarningLimit: 500,
    },
  };
});
