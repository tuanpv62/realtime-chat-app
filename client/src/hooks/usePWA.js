/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export function usePWA() {
  // ── Install prompt ───────────────────────────────────────────
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // ── Service Worker update ────────────────────────────────────
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
useEffect(() => {
  window.addEventListener("beforeinstallprompt", (e) => {
    console.log("🔥 READY INSTALL");
  });

  document.addEventListener("click", () => {
    console.log("User interacted");
  });
}, []);
    window.addEventListener("load", () => {
      setTimeout(() => {
        window.dispatchEvent(new Event("beforeinstallprompt"));
      }, 2000);
    });
    
  useEffect(() => {
    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Detect đã cài chưa
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setIsInstalled(isStandalone);

    // Lắng nghe beforeinstallprompt (Android/Chrome)
    const handlePrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    // Lắng nghe khi đã cài xong
    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      console.log("🎉 PWA installed!");
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
    if (!installPrompt) return;
    const result = await installPrompt.prompt();
    if (result.outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  // ── Show iOS guide ───────────────────────────────────────────
  const handleIOSInstall = () => setShowIOSGuide(true);

  return {
    // Install
    canInstall: !!installPrompt && !isInstalled,
    isInstalled,
    isIOS,
    showIOSGuide,
    setShowIOSGuide,
    handleInstall,
    handleIOSInstall,
    // Update
    needRefresh,
    updateServiceWorker,
    dismissUpdate: () => setNeedRefresh(false),
  };
}
