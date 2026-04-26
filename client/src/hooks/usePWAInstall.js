import { useState, useEffect } from 'react';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall]         = useState(false);
  const [isInstalled, setIsInstalled]       = useState(false);
  // ✅ Thêm state này — hiện nút dù chưa có event
  const [showManual, setShowManual]         = useState(false);

  useEffect(() => {
    // Kiểm tra đã cài chưa
    const installed =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (installed) {
      setIsInstalled(true);
      return;
    }

    // Nếu là Android Chrome → cho phép hiện nút thủ công
    const isAndroid  = /android/i.test(navigator.userAgent);
    const isChrome   = /chrome/i.test(navigator.userAgent);
    if (isAndroid && isChrome) {
      setShowManual(true);
    }

    // Lắng nghe event tự động
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
      setShowManual(false); // Ưu tiên dùng event chính thức
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setShowManual(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (deferredPrompt) {
      // Cài qua event chính thức (Chrome tự xử lý)
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setCanInstall(false);
      return outcome === 'accepted';
    }
    return false;
  };

  return {
    canInstall,
    isInstalled,
    showManual,   // ← dùng cái này để hiện hướng dẫn thủ công
    triggerInstall,
  };
}