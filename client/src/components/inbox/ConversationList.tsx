import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { ConversationItem, type Conversation } from './ConversationItem';
import { cn } from '../../lib/utils';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

type FilterStatus = 'all' | 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED';
type FilterPlatform = 'all' | 'WHATSAPP' | 'TELEGRAM' | 'SLACK' | 'TEAMS' | 'WEB';
type SortBy = 'recent' | 'sentiment' | 'unread';

export function ConversationList({ conversations, selectedId, onSelect, isLoading }: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPlatform, setFilterPlatform] = useState<FilterPlatform>('all');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [showFilters, setShowFilters] = useState(false);

  const filteredConversations = useMemo(() => {
    let result = [...conversations];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.customerName.toLowerCase().includes(query) ||
        c.lastMessage.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(c => c.status === filterStatus);
    }

    // Platform filter
    if (filterPlatform !== 'all') {
      result = result.filter(c => c.platform === filterPlatform);
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        result.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
        break;
      case 'sentiment':
        result.sort((a, b) => a.sentimentScore - b.sentimentScore);
        break;
      case 'unread':
        result.sort((a, b) => b.unreadCount - a.unreadCount);
        break;
    }

    return result;
  }, [conversations, searchQuery, filterStatus, filterPlatform, sortBy]);

  return (
    <div className="flex flex-col h-full bg-white/5 border-r border-white/10">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-bold mb-3">Conversations</h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'mt-2 flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors',
            showFilters ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>

        {/* Filters panel */}
        {showFilters && (
          <div className="mt-3 p-3 bg-white/5 rounded-lg space-y-3">
            {/* Status filter */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Status</label>
              <div className="flex gap-1 flex-wrap">
                {(['all', 'OPEN', 'PENDING', 'RESOLVED', 'CLOSED'] as FilterStatus[]).map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={cn(
                      'px-2 py-1 text-xs rounded transition-colors',
                      filterStatus === status ? 'bg-primary text-white' : 'bg-white/10 hover:bg-white/20'
                    )}
                  >
                    {status === 'all' ? 'All' : status}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform filter */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Platform</label>
              <div className="flex gap-1 flex-wrap">
                {(['all', 'WHATSAPP', 'TELEGRAM', 'SLACK', 'TEAMS'] as FilterPlatform[]).map(platform => (
                  <button
                    key={platform}
                    onClick={() => setFilterPlatform(platform)}
                    className={cn(
                      'px-2 py-1 text-xs rounded transition-colors',
                      filterPlatform === platform ? 'bg-primary text-white' : 'bg-white/10 hover:bg-white/20'
                    )}
                  >
                    {platform === 'all' ? 'All' : platform}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Sort by</label>
              <div className="flex gap-1">
                {([
                  { value: 'recent', label: 'Recent' },
                  { value: 'sentiment', label: 'Sentiment' },
                  { value: 'unread', label: 'Unread' },
                ] as { value: SortBy; label: string }[]).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setSortBy(value)}
                    className={cn(
                      'px-2 py-1 text-xs rounded transition-colors',
                      sortBy === value ? 'bg-primary text-white' : 'bg-white/10 hover:bg-white/20'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-400">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
            Loading conversations...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            {searchQuery || filterStatus !== 'all' || filterPlatform !== 'all'
              ? 'No conversations match your filters'
              : 'No conversations yet'}
          </div>
        ) : (
          filteredConversations.map(conversation => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={conversation.id === selectedId}
              onClick={() => onSelect(conversation.id)}
            />
          ))
        )}
      </div>

      {/* Footer stats */}
      <div className="p-3 border-t border-white/10 text-xs text-gray-400">
        {filteredConversations.length} of {conversations.length} conversations
      </div>
    </div>
  );
}
