import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';

export interface Message {
  id: string;
  conversationId: string;
  senderType: 'customer' | 'agent' | 'bot';
  senderId?: string;
  senderName?: string;
  content: string;
  sentimentScore?: number;
  emotion?: string;
  createdAt: string;
}

interface MessageBubbleProps {
  message: Message;
  showSentiment?: boolean;
}

function getSentimentColor(score: number): string {
  if (score <= -2) return 'border-red-500/50';
  if (score < 0) return 'border-orange-500/50';
  if (score >= 2) return 'border-green-500/50';
  return 'border-transparent';
}

export function MessageBubble({ message, showSentiment = true }: MessageBubbleProps) {
  const isCustomer = message.senderType === 'customer';
  const isBot = message.senderType === 'bot';
  const time = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });

  return (
    <div className={cn('flex', isCustomer ? 'justify-start' : 'justify-end')}>
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2 border-2',
          isCustomer && 'bg-white/10 rounded-bl-md',
          !isCustomer && 'bg-primary/20 rounded-br-md',
          isBot && 'bg-purple-500/20 border-purple-500/30',
          showSentiment && message.sentimentScore !== undefined && getSentimentColor(message.sentimentScore)
        )}
      >
        {/* Sender name for agents/bots */}
        {!isCustomer && (
          <p className="text-xs text-gray-400 mb-1">
            {isBot ? '🤖 Bot' : message.senderName || 'Agent'}
          </p>
        )}

        {/* Message content */}
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <span className="text-xs text-gray-500">{time}</span>

          {/* Sentiment indicator for customer messages */}
          {isCustomer && showSentiment && message.sentimentScore !== undefined && (
            <span className="text-xs">
              {message.emotion && <span className="text-gray-400 mr-1">{message.emotion}</span>}
              <span className={cn(
                message.sentimentScore <= -2 && 'text-red-400',
                message.sentimentScore < 0 && message.sentimentScore > -2 && 'text-orange-400',
                message.sentimentScore >= 0 && message.sentimentScore < 2 && 'text-gray-400',
                message.sentimentScore >= 2 && 'text-green-400'
              )}>
                {message.sentimentScore.toFixed(1)}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
