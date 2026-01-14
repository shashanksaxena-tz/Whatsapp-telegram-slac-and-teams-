import React, { useCallback } from 'react';
import { Clock, MessageCircle, User, AlertTriangle } from 'lucide-react';
import { formatDuration, intervalToDuration } from 'date-fns';
import { cn } from '../../lib/utils';
import { platformIcons, platformNames } from '../../lib/constants';
import { LiveIndicator, LiveStatus } from './LiveIndicator';

/**
 * Platform types supported by the system
 */
export type Platform = 'WHATSAPP' | 'TELEGRAM' | 'SLACK' | 'TEAMS' | 'WEB';

/**
 * Represents a live conversation for monitoring
 */
export interface LiveConversation {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  platform: Platform;
  assignedAgentId?: string;
  assignedAgentName?: string;
  startedAt: string;
  messageCount: number;
  sentimentScore: number;
  status: LiveStatus;
  isTyping: boolean;
  hasNewMessage: boolean;
  isEscalated: boolean;
}

/**
 * Props for the LiveConversationCard component
 */
export interface LiveConversationCardProps {
  conversation: LiveConversation;
  isSelected?: boolean;
  onClick?: () => void;
}

/**
 * Get sentiment color based on score
 */
function getSentimentConfig(score: number): { color: string; bgColor: string; label: string } {
  if (score <= -2) {
    return { color: 'text-red-400', bgColor: 'bg-red-500/20', label: 'Very Negative' };
  }
  if (score < 0) {
    return { color: 'text-orange-400', bgColor: 'bg-orange-500/20', label: 'Negative' };
  }
  if (score === 0) {
    return { color: 'text-gray-400', bgColor: 'bg-gray-500/20', label: 'Neutral' };
  }
  if (score < 2) {
    return { color: 'text-green-400', bgColor: 'bg-green-500/20', label: 'Positive' };
  }
  return { color: 'text-green-500', bgColor: 'bg-green-600/20', label: 'Very Positive' };
}

/**
 * Format duration from start time to now
 */
function formatConversationDuration(startedAt: string): string {
  try {
    const start = new Date(startedAt);
    const now = new Date();
    const duration = intervalToDuration({ start, end: now });

    if (duration.hours && duration.hours > 0) {
      return formatDuration(duration, { format: ['hours', 'minutes'] });
    }
    if (duration.minutes && duration.minutes > 0) {
      return formatDuration(duration, { format: ['minutes', 'seconds'] });
    }
    return formatDuration(duration, { format: ['seconds'] }) || '0 seconds';
  } catch {
    return 'Unknown';
  }
}

/**
 * LiveConversationCard - Displays a single live conversation in a compact card format
 *
 * Shows real-time indicators including:
 * - Customer name and platform icon
 * - Assigned agent
 * - Duration and message count
 * - Typing indicator and new message pulse
 * - Escalation alert
 * - Sentiment score with color coding
 */
export function LiveConversationCard({
  conversation,
  isSelected = false,
  onClick,
}: LiveConversationCardProps) {
  const displayName = conversation.customerName || 'Unknown Customer';
  const initials = displayName.charAt(0).toUpperCase();
  const duration = formatConversationDuration(conversation.startedAt);
  const sentiment = getSentimentConfig(conversation.sentimentScore);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if ((event.key === 'Enter' || event.key === ' ') && onClick) {
        event.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  // Determine the display status
  const displayStatus: LiveStatus = conversation.isEscalated
    ? 'escalated'
    : conversation.isTyping
    ? 'typing'
    : conversation.status;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Watch conversation with ${displayName}, ${conversation.messageCount} messages, ${duration}`}
      aria-selected={isSelected}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative p-4 rounded-xl border transition-all cursor-pointer',
        'backdrop-blur-sm bg-white/5 border-white/10',
        'hover:bg-white/10 hover:border-white/20',
        isSelected && 'ring-2 ring-primary bg-white/10 border-primary/50',
        conversation.isEscalated && 'border-red-500/50'
      )}
    >
      {/* New message pulse overlay */}
      {conversation.hasNewMessage && (
        <div
          className="absolute inset-0 rounded-xl bg-primary/10 animate-pulse pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Header row: Avatar, name, platform, status */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {conversation.customerAvatar ? (
            <img
              src={conversation.customerAvatar}
              alt={`${displayName}'s avatar`}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/50 to-purple-500/50 flex items-center justify-center text-sm font-bold">
              {initials}
            </div>
          )}
          {/* Platform badge */}
          <span
            className="absolute -bottom-1 -right-1 text-xs"
            role="img"
            aria-label={platformNames[conversation.platform] || conversation.platform}
          >
            {platformIcons[conversation.platform]}
          </span>
        </div>

        {/* Customer info and status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate text-sm">{displayName}</h3>
            <LiveIndicator status={displayStatus} size="sm" />
          </div>

          {/* Assigned agent */}
          {conversation.assignedAgentName ? (
            <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
              <User className="h-3 w-3" aria-hidden="true" />
              <span className="truncate">{conversation.assignedAgentName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 mt-0.5 text-xs text-yellow-400">
              <User className="h-3 w-3" aria-hidden="true" />
              <span>Unassigned</span>
            </div>
          )}
        </div>

        {/* Escalation indicator */}
        {conversation.isEscalated && (
          <div
            className="flex-shrink-0 p-1 rounded bg-red-500/20"
            role="status"
            aria-label="This conversation has been escalated"
          >
            <AlertTriangle className="h-4 w-4 text-red-400" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Stats row: Duration, messages, sentiment */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
        {/* Duration */}
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="h-3 w-3" aria-hidden="true" />
          <span>{duration}</span>
        </div>

        {/* Message count */}
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <MessageCircle className="h-3 w-3" aria-hidden="true" />
          <span>{conversation.messageCount}</span>
        </div>

        {/* Sentiment badge */}
        <div
          className={cn(
            'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
            sentiment.bgColor,
            sentiment.color
          )}
          role="status"
          aria-label={`Sentiment: ${sentiment.label}`}
        >
          <span>{conversation.sentimentScore.toFixed(1)}</span>
        </div>
      </div>

      {/* Typing indicator */}
      {conversation.isTyping && (
        <div
          className="mt-2 text-xs text-blue-400 flex items-center gap-1"
          role="status"
          aria-live="polite"
        >
          <span className="flex gap-0.5">
            <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
          <span>Customer is typing...</span>
        </div>
      )}
    </div>
  );
}
