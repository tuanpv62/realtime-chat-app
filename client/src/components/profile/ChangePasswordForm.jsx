import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { userAPI } from '@/api/user.api';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Nhập mật khẩu hiện tại'),
    newPassword: z.string().min(6, 'Mật khẩu mới ít nhất 6 ký tự'),
    confirmNewPassword: z.string().min(1, 'Xác nhận mật khẩu mới'),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: 'Mật khẩu mới không khớp',
    path: ['confirmNewPassword'],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
    path: ['newPassword'],
  });

export function ChangePasswordForm() {
  const navigate = useNavigate();
  const { signout } = useAuthStore();
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  });

  const toggleShow = (field) =>
    setShow((prev) => ({ ...prev, [field]: !prev[field] }));

  const onSubmit = async (data) => {
    setServerError('');
    setIsSaving(true);

    try {
      await userAPI.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setSuccess(true);
      reset();

      // Đổi mật khẩu thành công → force re-login sau 2 giây
      setTimeout(async () => {
        await signout();
        navigate('/signin');
      }, 2000);
    } catch (err) {
      setServerError(err.message || 'Đổi mật khẩu thất bại');
    } finally {
      setIsSaving(false);
    }
  };

  const PasswordField = ({ id, label, field, placeholder }) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show[field] ? 'text' : 'password'}
          placeholder={placeholder}
          {...register(id === 'confirmNewPassword' ? 'confirmNewPassword' : id === 'newPassword' ? 'newPassword' : 'currentPassword')}
          className={errors[id === 'confirmNewPassword' ? 'confirmNewPassword' : id === 'newPassword' ? 'newPassword' : 'currentPassword'] ? 'border-destructive pr-10' : 'pr-10'}
        />
        <button
          type="button"
          onClick={() => toggleShow(field)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          tabIndex={-1}
        >
          {show[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
        <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <p className="font-medium">Đổi mật khẩu thành công!</p>
        <p className="text-sm text-muted-foreground">
          Đang chuyển hướng về trang đăng nhập...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Current Password */}
      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={show.current ? 'text' : 'password'}
            placeholder="Nhập mật khẩu hiện tại"
            {...register('currentPassword')}
            className={errors.currentPassword ? 'border-destructive pr-10' : 'pr-10'}
          />
          <button type="button" onClick={() => toggleShow('current')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" tabIndex={-1}>
            {show.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.currentPassword && (
          <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
        )}
      </div>

      {/* New Password */}
      <div className="space-y-1.5">
        <Label htmlFor="newPassword">Mật khẩu mới</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={show.new ? 'text' : 'password'}
            placeholder="Ít nhất 6 ký tự"
            {...register('newPassword')}
            className={errors.newPassword ? 'border-destructive pr-10' : 'pr-10'}
          />
          <button type="button" onClick={() => toggleShow('new')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" tabIndex={-1}>
            {show.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.newPassword && (
          <p className="text-xs text-destructive">{errors.newPassword.message}</p>
        )}
      </div>

      {/* Confirm New Password */}
      <div className="space-y-1.5">
        <Label htmlFor="confirmNewPassword">Xác nhận mật khẩu mới</Label>
        <div className="relative">
          <Input
            id="confirmNewPassword"
            type={show.confirm ? 'text' : 'password'}
            placeholder="Nhập lại mật khẩu mới"
            {...register('confirmNewPassword')}
            className={errors.confirmNewPassword ? 'border-destructive pr-10' : 'pr-10'}
          />
          <button type="button" onClick={() => toggleShow('confirm')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" tabIndex={-1}>
            {show.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmNewPassword && (
          <p className="text-xs text-destructive">{errors.confirmNewPassword.message}</p>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-destructive">{serverError}</p>
      )}

      <Button type="submit" disabled={isSaving} className="w-full">
        {isSaving ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" />Đang đổi mật khẩu...</>
        ) : (
          'Đổi mật khẩu'
        )}
      </Button>
    </form>
  );
}