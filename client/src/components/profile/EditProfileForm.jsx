import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { userAPI } from '@/api/user.api';

const editProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Tên hiển thị không được để trống')
    .max(50, 'Tối đa 50 ký tự')
    .trim(),
  bio: z.string().max(200, 'Bio tối đa 200 ký tự').optional(),
});

export function EditProfileForm({ user }) {
  const { updateUser } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      bio: user?.bio || '',
    },
  });

  const bioValue = watch('bio') || '';

  const onSubmit = async (data) => {
    setServerError('');
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      const updated = await userAPI.updateProfile(data);
      updateUser(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setServerError(err.message || 'Cập nhật thất bại');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Display Name */}
      <div className="space-y-1.5">
        <Label htmlFor="displayName">Tên hiển thị</Label>
        <Input
          id="displayName"
          placeholder="Tên của bạn"
          {...register('displayName')}
          className={errors.displayName ? 'border-destructive' : ''}
        />
        {errors.displayName && (
          <p className="text-xs text-destructive">{errors.displayName.message}</p>
        )}
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="bio">Giới thiệu</Label>
          <span className="text-xs text-muted-foreground">
            {bioValue.length}/200
          </span>
        </div>
        <textarea
          id="bio"
          placeholder="Viết gì đó về bản thân..."
          rows={3}
          {...register('bio')}
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />
        {errors.bio && (
          <p className="text-xs text-destructive">{errors.bio.message}</p>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-destructive">{serverError}</p>
      )}

      <Button
        type="submit"
        disabled={isSaving || !isDirty}
        className="w-full"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Đang lưu...
          </>
        ) : saveSuccess ? (
          <>
            <Check className="h-4 w-4 mr-2 text-green-500" />
            Đã lưu!
          </>
        ) : (
          'Lưu thay đổi'
        )}
      </Button>
    </form>
  );
}