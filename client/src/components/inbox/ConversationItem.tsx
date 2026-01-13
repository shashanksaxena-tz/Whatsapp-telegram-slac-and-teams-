import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';

export interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  platform: 'WHATSAPP' | 'TELEGRAM' | 'SLACK' | 'TEAMS' | 'WEB';
  status: 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED';
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  sentimentScore: number;
  assignedAgentId?: string;
  assignedAgentName?: string;
}

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

const platformIcons: Record<string, string> = {
  WHATSAPP: '📱',
  TELEGRAM: '✈️',
  SLACK: '💼',
  TEAMS: '🏢',
  WEB: '🌐',
};

const statusColors: Record<string, string> = {
  OPEN: 'bg-green-500',
  PENDING: 'bg-yellow-500',
  RESOLVED: 'bg-blue-500',
  CLOSED: 'bg-gray-500',
};

function getSentimentIndicator(score: number): { color: string; icon: string } {
  if (score <= -2) return { color: 'text-red-400', icon: '😠' };
  if (score < 0) return { color: 'text-orange-400', icon: '😕' };
  if (score === 0) return { color: 'text-gray-400', icon: '😐' };
  if (score < 2) return { color: 'text-green-400', icon: '🙂' };
  return { color: 'text-green-500', icon: '😊' };
}

export function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
  const sentiment = getSentimentIndicator(conversation.sentimentScore);
  const timeAgo = formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true });

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 border-b border-white/10 cursor-pointer transition-all hover:bg-white/5',
        isSelected && 'bg-white/10 border-l-2 border-l-primary'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {conversation.customerAvatar ? (
            <img
              src={conversation.customerAvatar}
              alt={conversation.customerName}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/50 to-purple-500/50 flex items-center justify-center text-sm font-bold">
              {conversation.customerName.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Platform badge */}
          <span className="absolute -bottom-1 -right-1 text-xs">
            {platformIcons[conversation.platform]}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium truncate">{conversation.customerName}</span>
            <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo}</span>
          </div>

          <p className="text-sm text-gray-400 truncate mt-0.5">{conversation.lastMessage}</p>

          <div className="flex items-center gap-2 mt-1.5">
            {/* Status */}
            <span className={cn('h-2 w-2 rounded-full', statusColors[conversation.status])} />

            {/* Sentiment */}
            <span className={cn('text-xs', sentiment.color)}>{sentiment.icon}</span>

            {/* Unread badge */}
            {conversation.unreadCount > 0 && (
              <span className="ml-auto bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
                {conversation.unreadCount}
              </span>
            )}

            {/* Assigned agent */}
            {conversation.assignedAgentName && (
              <span className="text-xs text-gray-500 ml-auto">
                → {conversation.assignedAgentName}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
