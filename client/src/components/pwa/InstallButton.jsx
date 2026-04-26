import { useState } from 'react';
import { Download, X, Check, Smartphone, ChevronDown } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { cn } from '@/utils/cn';

// Hướng dẫn thủ công cho Android
function ManualGuide({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-card rounded-2xl p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-base">Cài ChatNóiBo về máy</p>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {[
            {
              num: 1,
              text: 'Nhấn vào biểu tượng',
              highlight: '⋮  (3 chấm)',
              sub: 'góc trên bên phải Chrome',
            },
            {
              num: 2,
              text: 'Chọn',
              highlight: '"Thêm vào màn hình chính"',
              sub: 'hoặc "Add to Home Screen"',
            },
            {
              num: 3,
              text: 'Nhấn',
              highlight: '"Thêm" hoặc "Add"',
              sub: 'để hoàn tất cài đặt',
            },
          ].map(({ num, text, highlight, sub }) => (
            <div
              key={num}
              className="flex gap-3 p-3 rounded-xl bg-muted items-start"
            >
              <div className="h-7 w-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {num}
              </div>
              <div>
                <p className="text-sm">
                  {text}{' '}
                  <span className="font-semibold text-foreground">
                    {highlight}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Arrow hint */}
        <div className="mt-4 flex items-center justify-center gap-2 py-2 border border-dashed border-primary/40 rounded-xl bg-primary/5">
          <span className="text-sm text-muted-foreground">
            Nhìn lên góc trên bên phải
          </span>
          <span className="text-lg">↗️</span>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full h-10 rounded-xl bg-primary text-white font-semibold text-sm"
        >
          Đã hiểu
        </button>
      </div>
    </div>
  );
}

export function InstallButton() {
  const { canInstall, isInstalled, showManual, triggerInstall } = usePWAInstall();

  const [dismissed,    setDismissed]    = useState(
    () => sessionStorage.getItem('install-dismissed') === '1'
  );
  const [loading,      setLoading]      = useState(false);
  const [success,      setSuccess]      = useState(false);
  const [showGuide,    setShowGuide]    = useState(false);

  // Ẩn nếu: đã cài / đã bấm X lần này
  if (isInstalled || dismissed) return null;

  // Không hiện nếu không phải Android và không có event
  if (!canInstall && !showManual) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('install-dismissed', '1');
  };

  const handleInstall = async () => {
    if (canInstall) {
      // Có event → cài tự động
      setLoading(true);
      const accepted = await triggerInstall();
      setLoading(false);
      if (accepted) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } else {
      // Không có event → hiện hướng dẫn thủ công
      setShowGuide(true);
    }
  };

  return (
    <>
      {/* Hướng dẫn thủ công */}
      {showGuide && <ManualGuide onClose={() => setShowGuide(false)} />}

      {/* Banner cài đặt */}
      <div
        className={cn(
          'fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-sm',
          'rounded-2xl border bg-card shadow-2xl p-4',
          'animate-in slide-in-from-bottom-4 duration-300',
        )}
      >
        {/* Row: icon + text + close */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 rounded-xl bg-primary flex items-center justify-center shadow-md">
            <Smartphone className="h-6 w-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight">
              Cài ChatNóiBo về máy
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dùng như app · Không cần App Store
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className="h-7 w-7 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nút cài */}
        <button
          onClick={handleInstall}
          disabled={loading}
          className={cn(
            'mt-3 w-full h-11 rounded-xl font-semibold text-sm',
            'flex items-center justify-center gap-2',
            'transition-all duration-200 active:scale-95',
            success
              ? 'bg-green-500 text-white'
              : 'bg-primary text-white hover:bg-primary/90',
          )}
        >
          {loading ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Đang cài...
            </>
          ) : success ? (
            <>
              <Check className="h-4 w-4" />
              Cài thành công!
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Tải về điện thoại
            </>
          )}
        </button>
      </div>
    </>
  );
}