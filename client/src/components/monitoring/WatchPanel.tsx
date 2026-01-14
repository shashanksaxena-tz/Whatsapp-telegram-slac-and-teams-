import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  X,
  Send,
  UserPlus,
  AlertTriangle,
  PhoneOff,
  Eye,
  MessageSquare,
  StickyNote,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';
import { platformIcons, platformNames } from '../../lib/constants';
import { LiveIndicator, LiveStatus } from './LiveIndicator';
import { LiveConversation, Platform } from './LiveConversationCard';

/**
 * Represents a message in the live feed
 */
export interface LiveMessage {
  id: string;
  conversationId: string;
  senderType: 'customer' | 'agent' | 'bot' | 'system';
  senderId?: string;
  senderName?: string;
  content: string;
  sentimentScore?: number;
  createdAt: string;
}

/**
 * Represents an internal note on a conversation
 */
export interface InternalNote {
  id: string;
  conversationId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

/**
 * Props for the WatchPanel component
 */
export interface WatchPanelProps {
  /** The conversation being watched */
  conversation: LiveConversation;
  /** Messages in the conversation */
  messages: LiveMessage[];
  /** Internal notes on the conversation */
  notes: InternalNote[];
  /** Callback when panel is closed */
  onClose: () => void;
  /** Callback when a whisper message is sent */
  onWhisper: (message: string) => void;
  /** Callback when an internal note is added */
  onAddNote: (note: string) => void;
  /** Callback when take over action is triggered */
  onTakeOver: () => void;
  /** Callback when escalate action is triggered */
  onEscalate: () => void;
  /** Callback when end conversation action is triggered */
  onEndConversation: () => void;
}

/**
 * Get sentiment color based on score
 */
function getSentimentColor(score: number): string {
  if (score <= -2) return 'border-l-red-500';
  if (score < 0) return 'border-l-orange-500';
  if (score >= 2) return 'border-l-green-500';
  return 'border-l-transparent';
}

/**
 * LiveMessageBubble - Renders a single message in the live feed
 */
function LiveMessageBubble({ message }: { message: LiveMessage }) {
  const isCustomer = message.senderType === 'customer';
  const isSystem = message.senderType === 'system';
  const time = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex', isCustomer ? 'justify-start' : 'justify-end')}>
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-3 py-2 border-l-2',
          isCustomer
            ? 'bg-white/10 rounded-bl-none'
            : 'bg-primary/20 rounded-br-none border-l-primary/50',
          isCustomer && message.sentimentScore !== undefined && getSentimentColor(message.sentimentScore)
        )}
      >
        {!isCustomer && (
          <p className="text-xs text-gray-400 mb-0.5">
            {message.senderType === 'bot' ? 'Bot' : message.senderName || 'Agent'}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  );
}

/**
 * WatchPanel - Detailed view panel for monitoring a live conversation
 *
 * Features:
 * - Live message feed with auto-scroll
 * - Agent "whisper" input for private messages to the agent
 * - Internal notes section for supervisor notes
 * - Quick actions: Take over, Escalate, End conversation
 */
export function WatchPanel({
  conversation,
  messages,
  notes,
  onClose,
  onWhisper,
  onAddNote,
  onTakeOver,
  onEscalate,
  onEndConversation,
}: WatchPanelProps) {
  const [activeTab, setActiveTab] = useState<'messages' | 'notes'>('messages');
  const [whisperText, setWhisperText] = useState('');
  const [noteText, setNoteText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (activeTab === 'messages') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleWhisperSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (whisperText.trim()) {
        onWhisper(whisperText.trim());
        setWhisperText('');
      }
    },
    [whisperText, onWhisper]
  );

  const handleNoteSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (noteText.trim()) {
        onAddNote(noteText.trim());
        setNoteText('');
      }
    },
    [noteText, onAddNote]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  const displayName = conversation.customerName || 'Unknown Customer';

  // Determine the display status
  const displayStatus: LiveStatus = conversation.isEscalated
    ? 'escalated'
    : conversation.isTyping
    ? 'typing'
    : conversation.status;

  return (
    <div
      className="flex flex-col h-full backdrop-blur-md bg-black/40 border-l border-white/10"
      role="region"
      aria-label={`Watch panel for conversation with ${displayName}`}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-white/10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Eye className="h-5 w-5 text-primary flex-shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold truncate">{displayName}</h2>
                <span
                  role="img"
                  aria-label={platformNames[conversation.platform] || conversation.platform}
                  className="flex-shrink-0"
                >
                  {platformIcons[conversation.platform]}
                </span>
                <LiveIndicator status={displayStatus} size="sm" />
              </div>
              {conversation.assignedAgentName && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Agent: {conversation.assignedAgentName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close watch panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={onTakeOver}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-colors text-sm"
            aria-label="Take over this conversation"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            <span>Take Over</span>
          </button>
          <button
            onClick={onEscalate}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm',
              conversation.isEscalated
                ? 'bg-red-500/30 text-red-300 cursor-not-allowed'
                : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400'
            )}
            disabled={conversation.isEscalated}
            aria-label={conversation.isEscalated ? 'Already escalated' : 'Escalate this conversation'}
          >
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <span>{conversation.isEscalated ? 'Escalated' : 'Escalate'}</span>
          </button>
          <button
            onClick={onEndConversation}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 transition-colors text-sm"
            aria-label="End this conversation"
          >
            <PhoneOff className="h-4 w-4" aria-hidden="true" />
            <span>End</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex-shrink-0 flex border-b border-white/10" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'messages'}
          aria-controls="messages-panel"
          onClick={() => setActiveTab('messages')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm transition-colors',
            activeTab === 'messages'
              ? 'text-white border-b-2 border-primary'
              : 'text-gray-400 hover:text-white'
          )}
        >
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          <span>Live Feed</span>
          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-white/10">
            {messages.length}
          </span>
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'notes'}
          aria-controls="notes-panel"
          onClick={() => setActiveTab('notes')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm transition-colors',
            activeTab === 'notes'
              ? 'text-white border-b-2 border-primary'
              : 'text-gray-400 hover:text-white'
          )}
        >
          <StickyNote className="h-4 w-4" aria-hidden="true" />
          <span>Notes</span>
          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-white/10">
            {notes.length}
          </span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div
            id="messages-panel"
            role="tabpanel"
            aria-label="Live message feed"
            className="flex flex-col h-full"
          >
            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageSquare className="h-8 w-8 mb-2" aria-hidden="true" />
                  <p className="text-sm">No messages yet</p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <LiveMessageBubble key={message.id} message={message} />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Typing indicator */}
            {conversation.isTyping && (
              <div
                className="flex-shrink-0 px-4 py-2 text-xs text-blue-400 flex items-center gap-1 border-t border-white/5"
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

            {/* Whisper Input */}
            <form
              onSubmit={handleWhisperSubmit}
              className="flex-shrink-0 p-4 border-t border-white/10 bg-black/20"
            >
              <label htmlFor="whisper-input" className="sr-only">
                Whisper message to agent
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    id="whisper-input"
                    type="text"
                    value={whisperText}
                    onChange={(e) => setWhisperText(e.target.value)}
                    placeholder="Whisper to agent (private)..."
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm placeholder-gray-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-yellow-500">
                    Private
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={!whisperText.trim()}
                  className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Send whisper message"
                >
                  <Send className="h-4 w-4 text-primary" aria-hidden="true" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Whisper messages are only visible to the agent, not the customer.
              </p>
            </form>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div
            id="notes-panel"
            role="tabpanel"
            aria-label="Internal notes"
            className="flex flex-col h-full"
          >
            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <StickyNote className="h-8 w-8 mb-2" aria-hidden="true" />
                  <p className="text-sm">No internal notes</p>
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-yellow-400">
                        {note.authorName}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Note Input */}
            <form
              onSubmit={handleNoteSubmit}
              className="flex-shrink-0 p-4 border-t border-white/10 bg-black/20"
            >
              <label htmlFor="note-input" className="sr-only">
                Add internal note
              </label>
              <div className="flex items-start gap-2">
                <textarea
                  id="note-input"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add internal note..."
                  rows={2}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 text-sm placeholder-gray-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={!noteText.trim()}
                  className="p-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Add note"
                >
                  <StickyNote className="h-4 w-4 text-yellow-400" aria-hidden="true" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Internal notes are only visible to supervisors and agents.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
