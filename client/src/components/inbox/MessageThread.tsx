import React, { useEffect, useRef } from 'react';
import { MessageCircle, Bot, User, MoreVertical, Phone, Video } from 'lucide-react';
import { MessageBubble, type Message } from './MessageBubble';
import { type Conversation } from './ConversationItem';
import { cn } from '../../lib/utils';

interface MessageThreadProps {
  conversation: Conversation | null;
  messages: Message[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const platformColors: Record<string, string> = {
  WHATSAPP: 'from-green-500 to-green-600',
  TELEGRAM: 'from-blue-400 to-blue-500',
  SLACK: 'from-purple-500 to-purple-600',
  TEAMS: 'from-indigo-500 to-indigo-600',
  WEB: 'from-gray-500 to-gray-600',
};

export function MessageThread({ conversation, messages, isLoading, onLoadMore, hasMore }: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white/5">
        <div className="text-center text-gray-400">
          <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Select a conversation</p>
          <p className="text-sm">Choose a conversation from the list to view messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white/5">
      {/* Header */}
      <div className={cn(
        'p-4 border-b border-white/10 bg-gradient-to-r',
        platformColors[conversation.platform] || platformColors.WEB
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            {conversation.customerAvatar ? (
              <img
                src={conversation.customerAvatar}
                alt={conversation.customerName}
                className="h-10 w-10 rounded-full border-2 border-white/20"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                {conversation.customerName.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <h3 className="font-bold">{conversation.customerName}</h3>
              <p className="text-xs opacity-80">
                {conversation.platform} • {conversation.status}
                {conversation.assignedAgentName && ` • Assigned to ${conversation.assignedAgentName}`}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <Phone className="h-4 w-4" />
            </button>
            <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <Video className="h-4 w-4" />
            </button>
            <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Load more button */}
        {hasMore && (
          <div className="text-center">
            <button
              onClick={onLoadMore}
              disabled={isLoading}
              className="text-sm text-primary hover:underline disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Load earlier messages'}
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              Loading messages...
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No messages yet</p>
            </div>
          </div>
        )}

        {/* Messages list */}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} showSentiment />
        ))}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
