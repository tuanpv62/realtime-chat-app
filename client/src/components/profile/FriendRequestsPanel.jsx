/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { Check, X, Clock, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { friendAPI } from '@/api/chat.api';
import { formatDistanceToNowStrict } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNotificationStore } from '../../stores/notificationStore';

export function FriendRequestsPanel() {
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const { setPendingCount, decrementPending } = useNotificationStore();


 useEffect(() => {
    setIsLoading(true);
    friendAPI
      .getPendingRequests()
      .then(({ received: r, sent: s }) => {
        setReceived(r);
        setSent(s);
        // ✅ Sync đúng số thực tế từ server
        setPendingCount(r.length);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

 const handleAccept = async (request) => {
    const reqId = request._id || request.id;
    setProcessingId(reqId);
    try {
      await friendAPI.respondRequest(reqId, 'accept');
      setReceived((prev) => prev.filter((r) => (r._id || r.id) !== reqId));
      decrementPending(); // ✅ Giảm badge
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request) => {
    const reqId = request._id || request.id;
    setProcessingId(reqId);
    try {
      await friendAPI.respondRequest(reqId, 'reject');
      setReceived((prev) => prev.filter((r) => (r._id || r.id) !== reqId));
      decrementPending(); // ✅ Giảm badge
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (request) => {
    const reqId = request._id || request.id;
    setProcessingId(reqId);
    try {
      await friendAPI.cancelRequest(reqId);
      setSent((prev) => prev.filter((r) => (r._id || r.id) !== reqId));
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="received">
      <TabsList className="w-full mb-4">
        <TabsTrigger value="received" className="flex-1 gap-1.5">
          Nhận được
          {received.length > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {received.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="sent" className="flex-1 gap-1.5">
          Đã gửi
          {sent.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({sent.length})
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      {/* Received Requests */}
      <TabsContent value="received">
        {received.length === 0 ? (
          <EmptyRequests
            icon={<Users className="h-8 w-8 text-muted-foreground" />}
            text="Không có lời mời kết bạn nào"
          />
        ) : (
          <div className="space-y-2">
            {received.map((request) => {
              const reqId = request._id || request.id;
              const isProcessing = processingId === reqId;
              const sender = request.sender;

              return (
                <div
                  key={reqId}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                >
                  <UserAvatar user={sender} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {sender?.displayName || sender?.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{sender?.username} ·{' '}
                      {formatDistanceToNowStrict(
                        new Date(request.createdAt),
                        { locale: vi, addSuffix: true }
                      )}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      className="h-8 px-3"
                      onClick={() => handleAccept(request)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3"
                      onClick={() => handleReject(request)}
                      disabled={isProcessing}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </TabsContent>

      {/* Sent Requests */}
      <TabsContent value="sent">
        {sent.length === 0 ? (
          <EmptyRequests
            icon={<Clock className="h-8 w-8 text-muted-foreground" />}
            text="Chưa gửi lời mời kết bạn nào"
          />
        ) : (
          <div className="space-y-2">
            {sent.map((request) => {
              const reqId = request._id || request.id;
              const isProcessing = processingId === reqId;
              const receiver = request.receiver;

              return (
                <div
                  key={reqId}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                >
                  <UserAvatar user={receiver} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {receiver?.displayName || receiver?.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{receiver?.username} ·{' '}
                      {formatDistanceToNowStrict(
                        new Date(request.createdAt),
                        { locale: vi, addSuffix: true }
                      )}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 shrink-0 text-destructive border-destructive hover:bg-destructive/10"
                    onClick={() => handleCancel(request)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <X className="h-3 w-3 mr-1" />
                        Hủy
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function EmptyRequests({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
      {icon}
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}