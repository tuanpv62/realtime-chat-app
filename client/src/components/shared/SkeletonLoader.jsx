import { cn } from '@/utils/cn';

// Base skeleton shimmer
function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
      {...props}
    />
  );
}

// Skeleton cho 1 ChatCard trong sidebar
export function ChatCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

// Skeleton cho sidebar list
export function ConversationListSkeleton({ count = 6 }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <ChatCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Skeleton cho 1 tin nhắn
export function MessageSkeleton({ isOwn = false }) {
  return (
    <div className={cn('flex items-end gap-2 px-4 py-1', isOwn && 'flex-row-reverse')}>
      {!isOwn && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
      <div className={cn('space-y-1', isOwn ? 'items-end' : 'items-start', 'flex flex-col')}>
        <Skeleton className={cn('h-10 rounded-2xl', isOwn ? 'w-48' : 'w-56')} />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

// Skeleton cho message list
export function MessageListSkeleton() {
  return (
    <div className="space-y-2 p-4">
      <MessageSkeleton isOwn={false} />
      <MessageSkeleton isOwn={true} />
      <MessageSkeleton isOwn={false} />
      <MessageSkeleton isOwn={true} />
      <MessageSkeleton isOwn={false} />
      <MessageSkeleton isOwn={true} />
    </div>
  );
}

// Skeleton cho chat header
export function ChatHeaderSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 border-b">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export { Skeleton };