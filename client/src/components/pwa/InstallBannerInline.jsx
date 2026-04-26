import { useState } from 'react';
import { Download, Smartphone, X, ChevronRight } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function InstallBannerInline() {
  const { canInstall, isInstalled, showManual, triggerInstall } = usePWAInstall();
  // eslint-disable-next-line no-unused-vars
  const [hidden,     setHidden]     = useState(false);
  const [showGuide,  setShowGuide]  = useState(false);
  const [loading,    setLoading]    = useState(false);

  if (isInstalled || hidden) return null;
  if (!canInstall && !showManual) return null;

  const handleClick = async () => {
    if (canInstall) {
      setLoading(true);
      await triggerInstall();
      setLoading(false);
    } else {
      setShowGuide(!showGuide);
    }
  };

  return (
    <div className="mt-4">
      {/* Nút chính */}
      <button
        onClick={handleClick}
        className="w-full flex items-center gap-3 p-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left group"
      >
        <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Smartphone className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            📲 Cài app về điện thoại
          </p>
          <p className="text-xs text-muted-foreground">
            {canInstall ? 'Nhấn để cài ngay' : 'Xem hướng dẫn cài đặt'}
          </p>
        </div>
        {loading ? (
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
        ) : (
          <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${showGuide ? 'rotate-90' : ''}`} />
        )}
      </button>

      {/* Hướng dẫn thủ công — mở rộng khi nhấn */}
      {showGuide && !canInstall && (
        <div className="mt-2 rounded-xl border bg-muted/50 p-4 space-y-3 text-sm">
          <p className="font-medium text-center text-foreground">
            Cách cài trên Android Chrome:
          </p>
          {[
            { n: 1, t: 'Nhấn ⋮ (3 chấm) góc trên phải' },
            { n: 2, t: 'Chọn "Thêm vào màn hình chính"' },
            { n: 3, t: 'Nhấn "Thêm" để hoàn tất' },
          ].map(({ n, t }) => (
            <div key={n} className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                {n}
              </span>
              <span className="text-muted-foreground">{t}</span>
            </div>
          ))}
          <p className="text-center text-xs text-muted-foreground pt-1">
            Sau đó mở app từ màn hình chính 🎉
          </p>
        </div>
      )}
    </div>
  );
}