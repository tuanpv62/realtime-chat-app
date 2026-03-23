import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Send, Smile, X, Paperclip, Loader2,
} from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTheme } from '@/components/shared/ThemeProvider';

export function MessageInput({
  onSend,
  onTyping,
  replyTo,
  onCancelReply,
  disabled = false,
  placeholder = 'Nhập tin nhắn...',
}) {
  const { theme } = useTheme();
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [content]);

  // Focus khi có replyTo
  useEffect(() => {
    if (replyTo) textareaRef.current?.focus();
  }, [replyTo]);

  const handleChange = (e) => {
    setContent(e.target.value);

    // Typing indicator
    if (onTyping) {
      onTyping(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1500);
    }
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || isSending || disabled) return;

    setIsSending(true);
    try {
      await onSend({ content: trimmed, type: 'text', replyTo: replyTo?.id });
      setContent('');
      onCancelReply?.();
      textareaRef.current?.focus();
      if (onTyping) onTyping(false);
    } catch (err) {
      console.error('Send failed:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    // Enter gửi, Shift+Enter xuống dòng
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleEmojiSelect = (emoji) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newContent =
      content.substring(0, start) + emoji.native + content.substring(end);

    setContent(newContent);
    setShowEmoji(false);

    // Restore cursor position sau emoji
    setTimeout(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + emoji.native.length;
    }, 0);
  };

  const canSend = content.trim().length > 0 && !isSending && !disabled;

  return (
    <div className="border-t bg-background">
      {/* Reply Preview */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/50">
          <div className="flex-1 min-w-0 border-l-2 border-primary pl-3">
            <p className="text-xs font-medium text-primary">
              Trả lời {replyTo.sender?.displayName || replyTo.sender?.username}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {replyTo.content || 'Tin nhắn đã bị xóa'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={onCancelReply}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 p-3">
        {/* Emoji Picker */}
        <Popover open={showEmoji} onOpenChange={setShowEmoji}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
              disabled={disabled}
            >
              <Smile className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="start"
            className="p-0 border-0 shadow-xl w-auto"
          >
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              theme={theme === 'dark' ? 'dark' : 'light'}
              locale="vi"
              previewPosition="none"
              skinTonePosition="none"
            />
          </PopoverContent>
        </Popover>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Không thể gửi tin nhắn' : placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              'w-full resize-none rounded-xl border bg-muted px-4 py-2.5 text-sm',
              'focus:outline-none focus:ring-1 focus:ring-ring',
              'placeholder:text-muted-foreground',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'max-h-[200px] overflow-y-auto',
              'transition-colors'
            )}
          />
        </div>

        {/* Send Button */}
        <Button
          size="icon"
          className={cn(
            'h-9 w-9 shrink-0 rounded-xl transition-all',
            canSend ? 'opacity-100' : 'opacity-50'
          )}
          onClick={handleSubmit}
          disabled={!canSend}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Hint */}
      <p className="text-[10px] text-muted-foreground text-center pb-1.5">
        Enter để gửi · Shift+Enter để xuống dòng
      </p>
    </div>
  );
}