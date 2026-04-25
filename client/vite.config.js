import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  // eslint-disable-next-line no-unused-vars
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",

        // Đưa manifest vào trong plugin (không cần file riêng)
        manifest: {
          name: "ChatNóiBo",
          short_name: "ChatNóiBo",
          description: "Ứng dụng chat realtime — Kết nối mọi lúc mọi nơi",
          start_url: "/",
          scope: "/",
          display: "standalone",
          background_color: "#0f172a",
          theme_color: "#2563eb",
          orientation: "portrait",
          lang: "vi",
          icons: [
            {
              src: "/icons/icon-72x72.png",
              sizes: "72x72",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/icons/icon-96x96.png",
              sizes: "96x96",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/icons/icon-128x128.png",
              sizes: "128x128",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/icons/icon-144x144.png",
              sizes: "144x144",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/icons/icon-152x152.png",
              sizes: "152x152",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/icons/icon-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "/icons/icon-384x384.png",
              sizes: "384x384",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "/icons/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
          shortcuts: [
            {
              name: "Mở Chat",
              url: "/chat",
              icons: [{ src: "/icons/icon-96x96.png", sizes: "96x96" }],
            },
          ],
        },

        workbox: {
          // Cache app shell
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],

          runtimeCaching: [
            {
              // Cache ảnh Cloudinary
              urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "cloudinary-images",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
              },
            },
            {
              // NetworkFirst cho API — luôn lấy data mới nhất
              urlPattern: /^https:\/\/.*\/api\/v1\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "api-cache",
                networkTimeoutSeconds: 10,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 300,
                },
              },
            },
          ],

          skipWaiting: true,
          clientsClaim: true,
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api/],
        },

        devOptions: {
          enabled: false, // Tắt khi dev để tránh conflict
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
        },
      },
    },

    build: {
      outDir: "dist",
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
    },
  };
});
