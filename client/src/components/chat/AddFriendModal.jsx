import { useState } from 'react';
import { Search, UserPlus, Check, Clock, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { friendAPI } from '@/api/chat.api';
import { useDebounce } from '@/hooks/useDebounce';
import { useEffect } from 'react';

export function AddFriendModal({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState(new Set());

  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    friendAPI
      .searchUsers(debouncedQuery)
      .then(setResults)
      .catch(console.error)
      .finally(() => setIsSearching(false));
  }, [debouncedQuery]);

  const handleSendRequest = async (userId) => {
    try {
      await friendAPI.sendRequest(userId);
      setSentRequests((prev) => new Set([...prev, userId]));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setSentRequests(new Set());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm bạn bè</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo username hoặc email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="mt-2 space-y-1 max-h-80 overflow-y-auto">
          {isSearching ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 && debouncedQuery.length >= 2 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Không tìm thấy người dùng
            </p>
          ) : (
            results.map((user) => {
              const userId = user.id || user._id;
              const isSent =
                sentRequests.has(userId) ||
                user.relationshipStatus === 'request_sent';
              const isFriend = user.relationshipStatus === 'friends';
              const isReceived = user.relationshipStatus === 'request_received';

              return (
                <div
                  key={userId}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted"
                >
                  <UserAvatar user={user} size="md" showStatus />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.displayName || user.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{user.username}
                    </p>
                  </div>

                  {isFriend ? (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Check className="h-3 w-3" /> Bạn bè
                    </span>
                  ) : isSent ? (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Đã gửi
                    </span>
                  ) : isReceived ? (
                    <Button size="sm" variant="outline">
                      Phản hồi
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleSendRequest(userId)}
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1" />
                      Kết bạn
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}