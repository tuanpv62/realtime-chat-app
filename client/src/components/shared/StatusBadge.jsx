import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";

export function StatusBadge({ isOnline, lastSeen, showLabel = false, className }) {
  const [now, setNow] = useState(Date.now());

  // ⏱ update mỗi phút
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const formatLastSeen = () => {
    if (!lastSeen) return "Offline";

    const diff = now - new Date(lastSeen).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "Vừa xong";
    if (mins < 60) return `${mins} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    return `${days} ngày trước`;
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          isOnline ? "bg-green-500 animate-pulse" : "bg-muted-foreground"
        )}
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {isOnline ? "Online" : formatLastSeen()}
        </span>
      )}
    </div>
  );
}