import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/utils/cn';

export function SplashScreen({ onDone }) {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Hiện splash 1.5 giây
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setVisible(false);
        onDone?.();
      }, 400);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className={cn(
      'fixed inset-0 z-[100] flex flex-col items-center justify-center',
      'bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900',
      'transition-opacity duration-400',
      fadeOut ? 'opacity-0' : 'opacity-100'
    )}>
      {/* Logo */}
      <div className="flex flex-col items-center gap-4 animate-in zoom-in-50 duration-500">
        <div className="h-24 w-24 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm shadow-2xl border border-white/30">
          <MessageSquare className="h-12 w-12 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            ChatNoiBo
          </h1>
          <p className="text-blue-200 text-sm mt-1">
            Kết nối mọi lúc mọi nơi
          </p>
        </div>
      </div>

      {/* Loading dots */}
      <div className="absolute bottom-16 flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 bg-white/60 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}