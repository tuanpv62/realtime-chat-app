import { useState, useEffect } from 'react';
import { Users, X, Loader2, Check } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { chatAPI, friendAPI } from '@/api/chat.api';

export function CreateGroupModal({ open, onClose, onCreated }) {
  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    friendAPI
      .getFriends()
      .then(setFriends)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [open]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    setError('');
    if (!groupName.trim()) return setError('Vui lòng nhập tên nhóm');
    if (selected.size < 2) return setError('Chọn ít nhất 2 thành viên');

    setIsCreating(true);
    try {
      const conv = await chatAPI.createGroup({
        name: groupName.trim(),
        participantIds: [...selected],
      });
      onCreated?.(conv);
      handleClose();
    } catch (err) {
      setError(err.message || 'Tạo nhóm thất bại');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setSelected(new Set());
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo nhóm mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Group Name */}
          <div className="space-y-1.5">
            <Label>Tên nhóm</Label>
            <Input
              placeholder="Nhập tên nhóm..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Member selection */}
          <div className="space-y-1.5">
            <Label>
              Thêm thành viên{' '}
              {selected.size > 0 && (
                <span className="text-primary">({selected.size} đã chọn)</span>
              )}
            </Label>

            {/* Selected badges */}
            {selected.size > 0 && (
              <div className="flex flex-wrap gap-1 p-2 bg-muted rounded-lg">
                {[...selected].map((id) => {
                  const friend = friends.find(
                    (f) => (f.id || f._id) === id
                  );
                  return friend ? (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 bg-background rounded-full pl-1 pr-2 py-0.5 text-xs border"
                    >
                      <UserAvatar user={friend} size="xs" />
                      {friend.displayName || friend.username}
                      <button
                        onClick={() => toggleSelect(id)}
                        className="ml-0.5 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}

            <div className="max-h-52 overflow-y-auto space-y-0.5">
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : friends.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Chưa có bạn bè để thêm vào nhóm
                </p>
              ) : (
                friends.map((friend) => {
                  const id = friend.id || friend._id;
                  const isSelected = selected.has(id);
                  return (
                    <button
                      key={id}
                      onClick={() => toggleSelect(id)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                        isSelected ? 'bg-primary/10' : 'hover:bg-muted'
                      }`}
                    >
                      <UserAvatar user={friend} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {friend.displayName || friend.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{friend.username}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Huỷ
            </Button>
            <Button className="flex-1" onClick={handleCreate} disabled={isCreating}>
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Users className="h-4 w-4 mr-2" />
              )}
              Tạo nhóm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}