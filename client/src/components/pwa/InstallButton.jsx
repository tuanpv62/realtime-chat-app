import { useState } from 'react';
import { Download, X, Smartphone, Check } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { cn } from '@/utils/cn';

export function InstallButton() {
  const { canInstall, isInstalled, install } = usePWAInstall();
  const [dismissed, setDismissed]             = useState(false);
  const [installing, setInstalling]           = useState(false);
  const [justInstalled, setJustInstalled]     = useState(false);

  // Không hiện nếu: đã cài, đã dismiss, hoặc trình duyệt không hỗ trợ
  if (isInstalled || dismissed || !canInstall) return null;

  const handleInstall = async () => {
    setInstalling(true);
    const accepted = await install();
    setInstalling(false);
    if (accepted) {
      setJustInstalled(true);
      setTimeout(() => setJustInstalled(false), 3000);
    }
  };

  return (
    // Banner xuất hiện ở dưới màn hình
    <div
      className={cn(
        'fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm',
        'bg-card border border-border rounded-2xl shadow-2xl',
        'p-4 animate-in slide-in-from-bottom-4 duration-300',
      )}
    >
      <div className="flex items-center gap-3">
        {/* Icon app */}
        <div className="h-12 w-12 shrink-0 bg-primary rounded-xl flex items-center justify-center shadow-md">
          <Smartphone className="h-6 w-6 text-white" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">
            Cài ChatNóiBo về máy
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dùng như app thật · Không cần App Store
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 h-6 w-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nút cài */}
      <button
        onClick={handleInstall}
        disabled={installing}
        className={cn(
          'mt-3 w-full h-10 rounded-xl font-semibold text-sm',
          'flex items-center justify-center gap-2 transition-all',
          justInstalled
            ? 'bg-green-500 text-white'
            : 'bg-primary text-white hover:bg-primary/90 active:scale-95',
          installing && 'opacity-70 cursor-wait',
        )}
      >
        {justInstalled ? (
          <>
            <Check className="h-4 w-4" />
            Đã cài thành công!
          </>
        ) : installing ? (
          <>
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Đang cài...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Tải về điện thoại
          </>
        )}
      </button>
    </div>
  );
}