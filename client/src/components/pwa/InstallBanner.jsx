import { useState } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { cn } from '@/utils/cn';

// Banner hướng dẫn cài app iOS
function IOSInstallGuide({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-card rounded-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-primary rounded-xl flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-sm">Cài ChatNoiBo</p>
              <p className="text-xs text-muted-foreground">lên màn hình chính</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {[
            {
              step: 1,
              icon: <Share className="h-4 w-4 text-blue-500" />,
              text: 'Nhấn nút',
              highlight: 'Chia sẻ (Share)',
              suffix: 'ở thanh dưới Safari',
            },
            {
              step: 2,
              icon: <span className="text-sm">➕</span>,
              text: 'Chọn',
              highlight: '"Thêm vào màn hình chính"',
              suffix: '',
            },
            {
              step: 3,
              icon: <span className="text-sm">✅</span>,
              text: 'Nhấn',
              highlight: '"Thêm"',
              suffix: 'ở góc trên phải',
            },
          ].map(({ step, icon, text, highlight, suffix }) => (
            <div key={step} className="flex items-center gap-3 p-3 rounded-xl bg-muted">
              <div className="h-7 w-7 rounded-full bg-background flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                {step}
              </div>
              <p className="text-sm">
                {text}{' '}
                <span className="font-semibold text-foreground">{highlight}</span>
                {suffix && ` ${suffix}`}
              </p>
              <div className="ml-auto shrink-0">{icon}</div>
            </div>
          ))}
        </div>

        {/* Arrow indicator */}
        <div className="flex items-center justify-center gap-2 mt-4 p-2 rounded-xl border border-dashed border-primary/50 bg-primary/5">
          <span className="text-xl animate-bounce">⬇️</span>
          <p className="text-xs text-muted-foreground">
            Nhìn xuống thanh dưới Safari
          </p>
        </div>

        <Button className="w-full mt-4" onClick={onClose}>
          Đã hiểu
        </Button>
      </div>
    </div>
  );
}

// Update available banner
function UpdateBanner({ onUpdate, onDismiss }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <div className="bg-card border rounded-xl shadow-lg p-3 flex items-center gap-3 animate-in slide-in-from-top-4">
        <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
          <Download className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Có bản cập nhật mới</p>
          <p className="text-xs text-muted-foreground">Tải lại để áp dụng</p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Button size="sm" className="h-7 text-xs px-2.5" onClick={onUpdate}>
            Cập nhật
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onDismiss}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main Install Banner — Hiện ở bottom màn hình
export function InstallBanner() {
  const {
    canInstall, isInstalled, isIOS,
    showIOSGuide, setShowIOSGuide,
    handleInstall, handleIOSInstall,
    needRefresh, updateServiceWorker, dismissUpdate,
  } = usePWA();

  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('pwa-banner-dismissed') === 'true'
  );

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  // Đã cài rồi → Không hiện gì
  if (isInstalled) {
    return needRefresh ? (
      <UpdateBanner
        onUpdate={() => updateServiceWorker(true)}
        onDismiss={dismissUpdate}
      />
    ) : null;
  }

  return (
    <>
      {/* Update notification */}
      {needRefresh && (
        <UpdateBanner
          onUpdate={() => updateServiceWorker(true)}
          onDismiss={dismissUpdate}
        />
      )}

      {/* iOS Install Guide */}
      {showIOSGuide && (
        <IOSInstallGuide onClose={() => setShowIOSGuide(false)} />
      )}

      {/* Install Banner */}
      {!dismissed && (canInstall || isIOS) && (
        <div className={cn(
          'fixed bottom-0 left-0 right-0 z-40',
          'bg-card border-t shadow-2xl',
          'p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]',
          'animate-in slide-in-from-bottom-4'
        )}>
          <div className="max-w-lg mx-auto flex items-center gap-3">
            {/* App icon */}
            <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center shrink-0 shadow-md">
              <Smartphone className="h-6 w-6 text-primary-foreground" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Cài ChatNoiBo</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Trải nghiệm tốt hơn — Không cần App Store
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                className="h-8 px-3 text-xs font-semibold"
                onClick={isIOS ? handleIOSInstall : handleInstall}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Cài ngay
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}