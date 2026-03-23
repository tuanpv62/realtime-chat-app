import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MessageSquare, UserPlus, UserCheck,
  UserX, Clock, MoreHorizontal, Calendar,
  Loader2, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AvatarUpload } from '@/components/shared/AvatarUpload';
import { EditProfileForm } from '@/components/profile/EditProfileForm';
import { ChangePasswordForm } from '@/components/profile/ChangePasswordForm';
import { FriendRequestsPanel } from '@/components/profile/FriendRequestsPanel';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { userAPI } from '@/api/user.api';
import { friendAPI } from '@/api/chat.api';
import { chatAPI } from '@/api/chat.api';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { setActiveConversation, isUserOnline } = useChatStore();

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState('');

  const isOwnProfile = !userId || userId === currentUser?.id || userId === currentUser?._id;
  const targetUserId = isOwnProfile ? currentUser?.id : userId;

  useEffect(() => {
    if (!targetUserId) return;

    setIsLoading(true);
    userAPI
      .getProfile(targetUserId)
      .then(setProfile)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [targetUserId]);

  // ── Friend Actions ─────────────────────────────────────────────
  const handleSendRequest = async () => {
    setIsActionLoading(true);
    try {
      await friendAPI.sendRequest(targetUserId);
      setProfile((p) => ({ ...p, relationshipStatus: 'request_sent' }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    setIsActionLoading(true);
    try {
      await friendAPI.respondRequest(profile.requestId, 'accept');
      setProfile((p) => ({ ...p, relationshipStatus: 'friends' }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUnfriend = async () => {
    setIsActionLoading(true);
    try {
      await friendAPI.unfriend(targetUserId);
      setProfile((p) => ({ ...p, relationshipStatus: 'none' }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStartChat = async () => {
    setIsActionLoading(true);
    try {
      const conversation = await chatAPI.getOrCreateDirect(targetUserId);
      setActiveConversation(conversation);
      navigate('/chat');
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">
            {error || 'Không tìm thấy người dùng'}
          </p>
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  const isOnline = isUserOnline(targetUserId);
  const displayUser = isOwnProfile ? currentUser : profile;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b bg-card/80 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold">
          {isOwnProfile ? 'Trang cá nhân' : 'Hồ sơ'}
        </h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* ── Profile Header Card ─────────────────────────────── */}
        <div className="rounded-xl border bg-card overflow-hidden">
          {/* Cover gradient */}
          <div className="h-28 bg-gradient-to-br from-primary/30 via-primary/20 to-background" />

          <div className="px-6 pb-6">
            {/* Avatar — offset from cover */}
            <div className="-mt-12 mb-4">
              {isOwnProfile ? (
                <AvatarUpload
                  user={displayUser}
                  size="xl"
                  editable={true}
                />
              ) : (
                <UserAvatar
                  user={{ ...profile, isOnline }}
                  size="xl"
                  showStatus
                  className="h-24 w-24 ring-4 ring-background"
                />
              )}
            </div>

            {/* Name + Status */}
            <div className="space-y-1 mb-4">
              <h2 className="text-xl font-bold">
                {profile.displayName || profile.username}
              </h2>
              <p className="text-sm text-muted-foreground">
                @{profile.username}
              </p>
              <StatusBadge
                isOnline={isOwnProfile ? currentUser?.isOnline : isOnline}
                lastSeen={profile.lastSeen}
                showLabel
              />
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Joined date */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                Tham gia{' '}
                {format(new Date(profile.createdAt), 'MMMM yyyy', { locale: vi })}
              </span>
            </div>

            {/* Action Buttons (other user's profile) */}
            {!isOwnProfile && (
              <div className="flex gap-2 flex-wrap">
                {/* Start Chat */}
                <Button
                  onClick={handleStartChat}
                  disabled={isActionLoading}
                  className="flex-1 sm:flex-none"
                >
                  {isActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <MessageSquare className="h-4 w-4 mr-2" />
                  )}
                  Nhắn tin
                </Button>

                {/* Friend action based on status */}
                {profile.relationshipStatus === 'none' && (
                  <Button
                    variant="outline"
                    onClick={handleSendRequest}
                    disabled={isActionLoading}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Kết bạn
                  </Button>
                )}

                {profile.relationshipStatus === 'request_sent' && (
                  <Button variant="outline" disabled>
                    <Clock className="h-4 w-4 mr-2" />
                    Đã gửi lời mời
                  </Button>
                )}

                {profile.relationshipStatus === 'request_received' && (
                  <Button
                    variant="outline"
                    onClick={handleAcceptRequest}
                    disabled={isActionLoading}
                    className="border-primary text-primary hover:bg-primary/10"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Chấp nhận
                  </Button>
                )}

                {profile.relationshipStatus === 'friends' && (
                  <Button
                    variant="outline"
                    onClick={handleUnfriend}
                    disabled={isActionLoading}
                    className="text-destructive border-destructive hover:bg-destructive/10"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Hủy kết bạn
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────── */}
        {isOwnProfile ? (
          <OwnProfileTabs user={currentUser} />
        ) : (
          <OtherProfileInfo profile={profile} />
        )}
      </div>
    </div>
  );
}

// ── Own Profile: Tabs với Settings ────────────────────────────────
function OwnProfileTabs({ user }) {
  return (
    <Tabs defaultValue="edit">
      <TabsList className="w-full">
        <TabsTrigger value="edit" className="flex-1">Chỉnh sửa</TabsTrigger>
        <TabsTrigger value="requests" className="flex-1">Lời mời</TabsTrigger>
        <TabsTrigger value="security" className="flex-1">Bảo mật</TabsTrigger>
      </TabsList>

      <TabsContent value="edit">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">Thông tin cá nhân</h3>
          <EditProfileForm user={user} />
        </div>
      </TabsContent>

      <TabsContent value="requests">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">Lời mời kết bạn</h3>
          <FriendRequestsPanel />
        </div>
      </TabsContent>

      <TabsContent value="security">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">Đổi mật khẩu</h3>
          <ChangePasswordForm />
        </div>
      </TabsContent>
    </Tabs>
  );
}

// ── Other User: Mutual info ────────────────────────────────────────
function OtherProfileInfo({ profile }) {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-3">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Thông tin
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between py-2 border-b">
          <span className="text-muted-foreground">Username</span>
          <span className="font-medium">@{profile.username}</span>
        </div>
        {profile.bio && (
          <div className="flex items-start justify-between py-2 border-b gap-4">
            <span className="text-muted-foreground shrink-0">Giới thiệu</span>
            <span className="font-medium text-right">{profile.bio}</span>
          </div>
        )}
        <div className="flex items-center justify-between py-2">
          <span className="text-muted-foreground">Trạng thái</span>
          <span
            className={
              profile.isOnline
                ? 'text-green-500 font-medium'
                : 'text-muted-foreground'
            }
          >
            {profile.isOnline ? '● Online' : '● Offline'}
          </span>
        </div>
      </div>
    </div>
  );
}