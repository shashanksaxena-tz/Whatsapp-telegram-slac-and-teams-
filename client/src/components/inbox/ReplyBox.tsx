import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface QuickReply {
  id: string;
  label: string;
  content: string;
}

interface ReplyBoxProps {
  onSend: (content: string) => Promise<void>;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
  quickReplies?: QuickReply[];
  aiSuggestion?: string;
  onAcceptSuggestion?: () => void;
}

export function ReplyBox({
  onSend,
  onTyping,
  disabled = false,
  placeholder = 'Type your message...',
  quickReplies = [],
  aiSuggestion,
  onAcceptSuggestion,
}: ReplyBoxProps) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [content]);

  const handleSend = async () => {
    if (!content.trim() || isSending || disabled) return;

    setIsSending(true);
    try {
      await onSend(content.trim());
      setContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onTyping?.();
  };

  const handleQuickReply = (reply: QuickReply) => {
    setContent(reply.content);
    setShowQuickReplies(false);
    textareaRef.current?.focus();
  };

  const handleAcceptSuggestion = () => {
    if (aiSuggestion) {
      setContent(aiSuggestion);
      onAcceptSuggestion?.();
    }
  };

  return (
    <div className="border-t border-white/10 bg-white/5 p-4">
      {/* AI Suggestion */}
      {aiSuggestion && (
        <div className="mb-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-purple-300 mb-1">AI Suggested Response</p>
              <p className="text-sm text-gray-300">{aiSuggestion}</p>
            </div>
            <button
              onClick={handleAcceptSuggestion}
              className="px-2 py-1 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded transition-colors"
            >
              Use
            </button>
          </div>
        </div>
      )}

      {/* Quick Replies */}
      {showQuickReplies && quickReplies.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {quickReplies.map((reply) => (
            <button
              key={reply.id}
              onClick={() => handleQuickReply(reply)}
              className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              {reply.label}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        {/* Quick reply toggle */}
        {quickReplies.length > 0 && (
          <button
            onClick={() => setShowQuickReplies(!showQuickReplies)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showQuickReplies ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/10'
            )}
            title="Quick replies"
          >
            <Sparkles className="h-5 w-5" />
          </button>
        )}

        {/* Attachment button */}
        <button
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending}
            rows={1}
            className={cn(
              'w-full px-4 py-2 bg-white/10 border border-white/10 rounded-lg resize-none',
              'focus:outline-none focus:border-primary text-sm',
              'placeholder:text-gray-500 disabled:opacity-50',
              'min-h-[40px] max-h-[150px]'
            )}
          />
        </div>

        {/* Emoji button */}
        <button
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Add emoji"
        >
          <Smile className="h-5 w-5" />
        </button>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!content.trim() || isSending || disabled}
          className={cn(
            'p-2 rounded-lg transition-colors',
            content.trim() && !isSending && !disabled
              ? 'bg-primary text-white hover:bg-primary/80'
              : 'bg-white/10 text-gray-500'
          )}
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Character count and helper text */}
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <span>Press Enter to send, Shift+Enter for new line</span>
        <span>{content.length} / 4096</span>
      </div>
    </div>
  );
}
