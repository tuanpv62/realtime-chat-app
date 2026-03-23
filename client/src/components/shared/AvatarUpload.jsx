import { useState, useRef } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { userAPI } from '@/api/user.api';
import { useAuthStore } from '@/stores/authStore';

export function AvatarUpload({ user, size = 'xl', editable = true }) {
  const { updateUser } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const sizeMap = {
    lg: 'h-20 w-20',
    xl: 'h-24 w-24',
    '2xl': 'h-32 w-32',
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Ảnh không được vượt quá 5MB');
      return;
    }

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Chỉ hỗ trợ JPEG, PNG, WebP');
      return;
    }

    setError('');

    // Preview ngay
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result);
    reader.readAsDataURL(file);

    // Upload
    setIsUploading(true);
    setProgress(10);

    try {
      // Simulate progress (Cloudinary không trả progress)
      const progressTimer = setInterval(() => {
        setProgress((p) => Math.min(p + 15, 85));
      }, 200);

      const data = await userAPI.uploadAvatar(file);
      clearInterval(progressTimer);
      setProgress(100);

      // Update store
      updateUser({ avatar: data.avatar });
      setPreview(null);

      setTimeout(() => setProgress(0), 500);
    } catch (err) {
      setError(err.message || 'Upload thất bại');
      setPreview(null);
      setProgress(0);
    } finally {
      setIsUploading(false);
      // Reset input
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const displayUser = preview
    ? { ...user, avatar: preview }
    : user;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <UserAvatar
          user={displayUser}
          size={size}
          className={cn(
            sizeMap[size],
            isUploading && 'opacity-70'
          )}
        />

        {/* Upload overlay */}
        {editable && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className={cn(
              'absolute inset-0 rounded-full flex items-center justify-center',
              'bg-black/0 hover:bg-black/40 transition-colors group',
              isUploading && 'cursor-not-allowed'
            )}
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 text-white animate-spin opacity-0 group-hover:opacity-100" />
            ) : (
              <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
        )}

        {/* Progress ring */}
        {isUploading && progress > 0 && (
          <svg
            className="absolute inset-0 -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50" cy="50" r="46"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 46}`}
              strokeDashoffset={`${2 * Math.PI * 46 * (1 - progress / 100)}`}
              className="transition-all duration-300"
            />
          </svg>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <X className="h-3 w-3" />
          {error}
        </p>
      )}

      {/* Upload button */}
      {editable && !isUploading && (
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7"
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="h-3 w-3 mr-1" />
          Đổi ảnh
        </Button>
      )}
    </div>
  );
}