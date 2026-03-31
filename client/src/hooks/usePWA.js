/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export function usePWA() {
  // ── Install state ───────────────────────────────────────────
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // ── Service Worker update ───────────────────────────────────
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("✅ Service Worker registered:", r);
    },
    onRegisterError(error) {
      console.error("❌ SW registration error:", error);
    },
  });

  // ── MAIN LOGIC ───────────────────────────────────────────────
  useEffect(() => {
    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Detect standalone (đã cài)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    setIsInstalled(isStandalone);

    // Khi Chrome cho phép cài
    const handlePrompt = (e) => {
      e.preventDefault(); // 🔥 QUAN TRỌNG
      console.log("🔥 READY INSTALL");
      setInstallPrompt(e);
    };

    // Khi user đã cài xong
    const handleInstalled = () => {
      console.log("🎉 PWA INSTALLED");
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  // ── Trigger install (Android) ────────────────────────────────
  const handleInstall = async () => {
    if (!installPrompt) {
      console.log("❌ No install prompt available");
      return;
    }

    const result = await installPrompt.prompt();

    console.log("👉 User choice:", result.outcome);

    if (result.outcome === "accepted") {
      console.log("✅ User accepted install");
      setInstallPrompt(null);
    }
  };

  // ── iOS fallback ─────────────────────────────────────────────
  const handleIOSInstall = () => {
    setShowIOSGuide(true);
  };

  return {
    // Install
    canInstall: !!installPrompt && !isInstalled,
    isInstalled,
    isIOS,
    showIOSGuide,
    setShowIOSGuide,
    handleInstall,
    handleIOSInstall,

    // Update SW
    needRefresh,
    updateServiceWorker,
    dismissUpdate: () => setNeedRefresh(false),
  };
}
