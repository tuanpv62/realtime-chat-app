import { cn } from '@/utils/cn';

export function UnreadBadge({ count, className }) {
  if (!count || count <= 0) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none',
        count > 99 ? 'h-5 min-w-[1.25rem] px-1' : 'h-4 min-w-[1rem] px-1',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}