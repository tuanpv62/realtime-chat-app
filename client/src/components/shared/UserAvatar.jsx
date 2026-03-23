import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/utils/cn';

// Lấy initials từ tên: "John Doe" → "JD"
function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

// Màu avatar dựa trên username (consistent mỗi user)
const AVATAR_COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500',
  'bg-yellow-500', 'bg-lime-500', 'bg-green-500',
  'bg-teal-500', 'bg-cyan-500', 'bg-sky-500',
  'bg-blue-500', 'bg-indigo-500', 'bg-violet-500',
  'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
];

function getAvatarColor(username = '') {
  let sum = 0;
  for (let i = 0; i < username.length; i++) {
    sum += username.charCodeAt(i);
  }
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export function UserAvatar({ user, size = 'md', showStatus = false, className }) {
  const sizeClasses = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  const statusSizes = {
    xs: 'h-1.5 w-1.5',
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-3.5 w-3.5',
  };

  const name = user?.displayName || user?.username || '?';
  const initials = getInitials(name);
  const colorClass = getAvatarColor(user?.username || '');

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      <Avatar className={sizeClasses[size]}>
        {user?.avatar && (
          <AvatarImage src={user.avatar} alt={name} />
        )}
        <AvatarFallback className={cn(colorClass, 'text-white font-semibold')}>
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Online Status Badge */}
      {showStatus && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-background',
            statusSizes[size],
            user?.isOnline ? 'bg-green-500' : 'bg-muted-foreground'
          )}
        />
      )}
    </div>
  );
}