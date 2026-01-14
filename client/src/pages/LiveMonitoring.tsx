import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Filter,
  SortAsc,
  SortDesc,
  AlertTriangle,
  Users,
  TrendingUp,
  Activity,
  X,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { platformIcons, platformNames } from '../lib/constants';
import { LiveConversationCard, LiveConversation, Platform } from '../components/monitoring/LiveConversationCard';
import { WatchPanel, LiveMessage, InternalNote } from '../components/monitoring/WatchPanel';
import { LiveIndicator, LiveStatus } from '../components/monitoring/LiveIndicator';

/**
 * Sort options for the conversation grid
 */
type SortOption = 'newest' | 'oldest' | 'sentiment-low' | 'sentiment-high' | 'message-count';

/**
 * Filter state for the monitoring page
 */
interface FilterState {
  platforms: Platform[];
  statuses: LiveStatus[];
  agents: string[];
  sentimentMin: number;
  sentimentMax: number;
}

/**
 * Mock agents list
 */
const mockAgents = [
  { id: 'a1', name: 'Sarah Johnson' },
  { id: 'a2', name: 'Mike Chen' },
  { id: 'a3', name: 'Emily Rodriguez' },
  { id: 'a4', name: 'James Wilson' },
];

/**
 * Mock conversations data with varied states
 */
const mockConversations: LiveConversation[] = [
  {
    id: 'conv1',
    customerId: 'c1',
    customerName: 'John Smith',
    platform: 'WHATSAPP',
    assignedAgentId: 'a1',
    assignedAgentName: 'Sarah Johnson',
    startedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    messageCount: 12,
    sentimentScore: -2.5,
    status: 'active',
    isTyping: false,
    hasNewMessage: true,
    isEscalated: true,
  },
  {
    id: 'conv2',
    customerId: 'c2',
    customerName: 'Emily Davis',
    platform: 'SLACK',
    assignedAgentId: 'a2',
    assignedAgentName: 'Mike Chen',
    startedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    messageCount: 6,
    sentimentScore: 1.5,
    status: 'active',
    isTyping: true,
    hasNewMessage: false,
    isEscalated: false,
  },
  {
    id: 'conv3',
    customerId: 'c3',
    customerName: 'Michael Brown',
    platform: 'TELEGRAM',
    startedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    messageCount: 18,
    sentimentScore: -0.5,
    status: 'idle',
    isTyping: false,
    hasNewMessage: false,
    isEscalated: false,
  },
  {
    id: 'conv4',
    customerId: 'c4',
    customerName: 'Sarah Wilson',
    platform: 'TEAMS',
    assignedAgentId: 'a3',
    assignedAgentName: 'Emily Rodriguez',
    startedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    messageCount: 4,
    sentimentScore: 2.0,
    status: 'active',
    isTyping: false,
    hasNewMessage: true,
    isEscalated: false,
  },
  {
    id: 'conv5',
    customerId: 'c5',
    customerName: 'David Lee',
    platform: 'WHATSAPP',
    assignedAgentId: 'a4',
    assignedAgentName: 'James Wilson',
    startedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    messageCount: 32,
    sentimentScore: -3.5,
    status: 'escalated',
    isTyping: false,
    hasNewMessage: false,
    isEscalated: true,
  },
  {
    id: 'conv6',
    customerId: 'c6',
    customerName: 'Jennifer Martinez',
    platform: 'SLACK',
    startedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    messageCount: 2,
    sentimentScore: 0.0,
    status: 'active',
    isTyping: true,
    hasNewMessage: false,
    isEscalated: false,
  },
  {
    id: 'conv7',
    customerId: 'c7',
    customerName: 'Robert Taylor',
    platform: 'TELEGRAM',
    assignedAgentId: 'a1',
    assignedAgentName: 'Sarah Johnson',
    startedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    messageCount: 9,
    sentimentScore: 1.0,
    status: 'active',
    isTyping: false,
    hasNewMessage: false,
    isEscalated: false,
  },
  {
    id: 'conv8',
    customerId: 'c8',
    customerName: 'Amanda Thompson',
    platform: 'TEAMS',
    assignedAgentId: 'a2',
    assignedAgentName: 'Mike Chen',
    startedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    messageCount: 15,
    sentimentScore: -1.5,
    status: 'idle',
    isTyping: false,
    hasNewMessage: true,
    isEscalated: false,
  },
  {
    id: 'conv9',
    customerId: 'c9',
    customerName: 'Chris Anderson',
    platform: 'WHATSAPP',
    startedAt: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
    messageCount: 1,
    sentimentScore: 0.5,
    status: 'active',
    isTyping: true,
    hasNewMessage: true,
    isEscalated: false,
  },
  {
    id: 'conv10',
    customerId: 'c10',
    customerName: 'Patricia Garcia',
    platform: 'SLACK',
    assignedAgentId: 'a3',
    assignedAgentName: 'Emily Rodriguez',
    startedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    messageCount: 22,
    sentimentScore: 3.0,
    status: 'active',
    isTyping: false,
    hasNewMessage: false,
    isEscalated: false,
  },
];

/**
 * Mock messages for watch panel
 */
const mockMessages: LiveMessage[] = [
  {
    id: 'msg1',
    conversationId: 'conv1',
    senderType: 'customer',
    content: 'I\'ve been waiting for my refund for 2 weeks now!',
    sentimentScore: -3.0,
    createdAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
  },
  {
    id: 'msg2',
    conversationId: 'conv1',
    senderType: 'bot',
    senderName: 'Support Bot',
    content: 'I apologize for the delay. Let me check on your refund status right away.',
    createdAt: new Date(Date.now() - 1000 * 60 * 13).toISOString(),
  },
  {
    id: 'msg3',
    conversationId: 'conv1',
    senderType: 'customer',
    content: 'This is unacceptable! I want to speak to a manager!',
    sentimentScore: -4.0,
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: 'msg4',
    conversationId: 'conv1',
    senderType: 'system',
    content: 'Conversation escalated to supervisor',
    createdAt: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
  },
  {
    id: 'msg5',
    conversationId: 'conv1',
    senderType: 'agent',
    senderId: 'a1',
    senderName: 'Sarah Johnson',
    content: 'Hello John, I\'m Sarah, a supervisor here. I completely understand your frustration and I\'m here to help resolve this immediately.',
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: 'msg6',
    conversationId: 'conv1',
    senderType: 'customer',
    content: 'Finally! Someone who can actually help.',
    sentimentScore: -1.0,
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
];

/**
 * Mock internal notes
 */
const mockNotes: InternalNote[] = [
  {
    id: 'note1',
    conversationId: 'conv1',
    authorId: 'a1',
    authorName: 'Sarah Johnson',
    content: 'Customer has history of high-value orders. Prioritize resolution.',
    createdAt: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
  },
];

/**
 * Platform options for filtering
 */
const platformOptions: Platform[] = ['WHATSAPP', 'TELEGRAM', 'SLACK', 'TEAMS'];

/**
 * Status options for filtering
 */
const statusOptions: LiveStatus[] = ['active', 'typing', 'idle', 'escalated'];

/**
 * Sort option labels
 */
const sortLabels: Record<SortOption, string> = {
  'newest': 'Newest First',
  'oldest': 'Oldest First',
  'sentiment-low': 'Sentiment (Low to High)',
  'sentiment-high': 'Sentiment (High to Low)',
  'message-count': 'Message Count',
};

/**
 * LiveMonitoring - Real-time conversation monitoring page
 *
 * Features:
 * - Grid of live conversation cards with real-time updates
 * - Slide-out watch panel for detailed conversation view
 * - Filtering by platform, status, agent, and sentiment
 * - Sorting by various criteria
 * - Real-time summary statistics
 */
export default function LiveMonitoring() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    platforms: [],
    statuses: [],
    agents: [],
    sentimentMin: -5,
    sentimentMax: 5,
  });
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const gridRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Close sort menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus management for keyboard navigation in grid
  useEffect(() => {
    if (focusedIndex >= 0 && gridRef.current) {
      const cell = gridRef.current.querySelector(`[data-grid-index="${focusedIndex}"]`) as HTMLElement;
      cell?.focus();
    }
  }, [focusedIndex]);

  // Filter and sort conversations
  const filteredConversations = useMemo(() => {
    let result = [...mockConversations];

    // Apply platform filter
    if (filters.platforms.length > 0) {
      result = result.filter((c) => filters.platforms.includes(c.platform));
    }

    // Apply status filter
    if (filters.statuses.length > 0) {
      result = result.filter((c) => {
        const displayStatus: LiveStatus = c.isEscalated
          ? 'escalated'
          : c.isTyping
          ? 'typing'
          : c.status;
        return filters.statuses.includes(displayStatus);
      });
    }

    // Apply agent filter
    if (filters.agents.length > 0) {
      result = result.filter(
        (c) => c.assignedAgentId && filters.agents.includes(c.assignedAgentId)
      );
    }

    // Apply sentiment filter
    result = result.filter(
      (c) => c.sentimentScore >= filters.sentimentMin && c.sentimentScore <= filters.sentimentMax
    );

    // Apply sorting
    switch (sortOption) {
      case 'newest':
        result.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
        break;
      case 'sentiment-low':
        result.sort((a, b) => a.sentimentScore - b.sentimentScore);
        break;
      case 'sentiment-high':
        result.sort((a, b) => b.sentimentScore - a.sentimentScore);
        break;
      case 'message-count':
        result.sort((a, b) => b.messageCount - a.messageCount);
        break;
    }

    return result;
  }, [filters, sortOption]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const active = mockConversations.filter(
      (c) => c.status === 'active' || c.isTyping
    ).length;
    const escalated = mockConversations.filter((c) => c.isEscalated).length;
    const avgSentiment =
      mockConversations.reduce((sum, c) => sum + c.sentimentScore, 0) /
      mockConversations.length;
    return { active, escalated, avgSentiment, total: mockConversations.length };
  }, []);

  const selectedConversation = useMemo(() => {
    return mockConversations.find((c) => c.id === selectedId) || null;
  }, [selectedId]);

  // Handlers
  const handleSelectConversation = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedId(null);
  }, []);

  const handleWhisper = useCallback((message: string) => {
    console.log('Whisper sent:', message);
  }, []);

  const handleAddNote = useCallback((note: string) => {
    console.log('Note added:', note);
  }, []);

  const handleTakeOver = useCallback(() => {
    console.log('Taking over conversation');
  }, []);

  const handleEscalate = useCallback(() => {
    console.log('Escalating conversation');
  }, []);

  const handleEndConversation = useCallback(() => {
    console.log('Ending conversation');
  }, []);

  const togglePlatformFilter = useCallback((platform: Platform) => {
    setFilters((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  }, []);

  const toggleStatusFilter = useCallback((status: LiveStatus) => {
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }));
  }, []);

  const toggleAgentFilter = useCallback((agentId: string) => {
    setFilters((prev) => ({
      ...prev,
      agents: prev.agents.includes(agentId)
        ? prev.agents.filter((a) => a !== agentId)
        : [...prev.agents, agentId],
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      platforms: [],
      statuses: [],
      agents: [],
      sentimentMin: -5,
      sentimentMax: 5,
    });
  }, []);

  const hasActiveFilters =
    filters.platforms.length > 0 ||
    filters.statuses.length > 0 ||
    filters.agents.length > 0 ||
    filters.sentimentMin > -5 ||
    filters.sentimentMax < 5;

  // Keyboard navigation for grid
  const handleGridKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const conversationCount = filteredConversations.length;
      if (conversationCount === 0) return;

      let newIndex = focusedIndex;

      switch (event.key) {
        case 'ArrowRight':
          newIndex = Math.min(focusedIndex + 1, conversationCount - 1);
          break;
        case 'ArrowLeft':
          newIndex = Math.max(focusedIndex - 1, 0);
          break;
        case 'ArrowDown':
          // Estimate columns based on container width (assumes ~300px per card)
          const cols = Math.floor((gridRef.current?.offsetWidth || 1200) / 300);
          newIndex = Math.min(focusedIndex + cols, conversationCount - 1);
          break;
        case 'ArrowUp':
          const colsUp = Math.floor((gridRef.current?.offsetWidth || 1200) / 300);
          newIndex = Math.max(focusedIndex - colsUp, 0);
          break;
        case 'Enter':
        case ' ':
          if (focusedIndex >= 0 && focusedIndex < conversationCount) {
            event.preventDefault();
            handleSelectConversation(filteredConversations[focusedIndex].id);
          }
          return;
        case 'Escape':
          handleClosePanel();
          return;
        default:
          return;
      }

      if (newIndex !== focusedIndex) {
        event.preventDefault();
        setFocusedIndex(newIndex);
      }
    },
    [focusedIndex, filteredConversations, handleSelectConversation, handleClosePanel]
  );

  return (
    <div className="flex h-[calc(100vh-64px)] -m-6">
      {/* Main Content Area */}
      <div className={cn('flex-1 flex flex-col min-w-0 transition-all', selectedId && 'mr-96')}>
        {/* Header with Stats and Filters */}
        <header className="flex-shrink-0 p-6 border-b border-white/10 bg-black/20 backdrop-blur-sm">
          {/* Title and Live Indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                Live Monitoring
              </h1>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
                <LiveIndicator status="active" size="sm" />
                <span className="text-xs font-medium text-green-400">LIVE</span>
              </div>
            </div>

            {/* Filter and Sort Controls */}
            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <div className="relative" ref={sortMenuRef}>
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
                    showSortMenu
                      ? 'bg-white/10 border-white/20'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  )}
                  aria-expanded={showSortMenu}
                  aria-haspopup="listbox"
                >
                  {sortOption.includes('low') || sortOption === 'oldest' ? (
                    <SortAsc className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <SortDesc className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="text-sm">{sortLabels[sortOption]}</span>
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', showSortMenu && 'rotate-180')}
                    aria-hidden="true"
                  />
                </button>

                {showSortMenu && (
                  <div
                    role="listbox"
                    className="absolute right-0 mt-2 w-48 py-1 rounded-lg bg-gray-900 border border-white/10 shadow-xl z-20"
                  >
                    {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                      <button
                        key={option}
                        role="option"
                        aria-selected={sortOption === option}
                        onClick={() => {
                          setSortOption(option);
                          setShowSortMenu(false);
                        }}
                        className={cn(
                          'w-full text-left px-4 py-2 text-sm transition-colors',
                          sortOption === option
                            ? 'bg-primary/20 text-primary'
                            : 'hover:bg-white/5'
                        )}
                      >
                        {sortLabels[option]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
                  showFilters || hasActiveFilters
                    ? 'bg-primary/20 border-primary/30 text-primary'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                )}
                aria-expanded={showFilters}
                aria-label={`${showFilters ? 'Hide' : 'Show'} filters${hasActiveFilters ? ' (active)' : ''}`}
              >
                <Filter className="h-4 w-4" aria-hidden="true" />
                <span className="text-sm">Filters</span>
                {hasActiveFilters && (
                  <span className="flex items-center justify-center h-5 w-5 text-xs rounded-full bg-primary text-black">
                    {filters.platforms.length +
                      filters.statuses.length +
                      filters.agents.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Users className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{summaryStats.total}</p>
                  <p className="text-xs text-gray-400">Total Active</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Activity className="h-5 w-5 text-green-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{summaryStats.active}</p>
                  <p className="text-xs text-gray-400">Currently Active</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{summaryStats.escalated}</p>
                  <p className="text-xs text-gray-400">Escalated</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <TrendingUp className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{summaryStats.avgSentiment.toFixed(1)}</p>
                  <p className="text-xs text-gray-400">Avg Sentiment</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
              {/* Platform Filters */}
              <div>
                <p className="text-xs font-medium text-gray-400 mb-2">Platform</p>
                <div className="flex flex-wrap gap-2">
                  {platformOptions.map((platform) => (
                    <button
                      key={platform}
                      onClick={() => togglePlatformFilter(platform)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors',
                        filters.platforms.includes(platform)
                          ? 'bg-primary/20 border-primary/30 text-primary'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      )}
                      aria-pressed={filters.platforms.includes(platform)}
                    >
                      <span role="img" aria-label={platformNames[platform]}>
                        {platformIcons[platform]}
                      </span>
                      <span>{platformNames[platform]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filters */}
              <div>
                <p className="text-xs font-medium text-gray-400 mb-2">Status</p>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      onClick={() => toggleStatusFilter(status)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors capitalize',
                        filters.statuses.includes(status)
                          ? 'bg-primary/20 border-primary/30 text-primary'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      )}
                      aria-pressed={filters.statuses.includes(status)}
                    >
                      <LiveIndicator status={status} size="sm" />
                      <span>{status}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Agent Filters */}
              <div>
                <p className="text-xs font-medium text-gray-400 mb-2">Agent</p>
                <div className="flex flex-wrap gap-2">
                  {mockAgents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => toggleAgentFilter(agent.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg border text-sm transition-colors',
                        filters.agents.includes(agent.id)
                          ? 'bg-primary/20 border-primary/30 text-primary'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      )}
                      aria-pressed={filters.agents.includes(agent.id)}
                    >
                      {agent.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sentiment Range */}
              <div>
                <p className="text-xs font-medium text-gray-400 mb-2">
                  Sentiment Range: {filters.sentimentMin.toFixed(1)} to {filters.sentimentMax.toFixed(1)}
                </p>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    step="0.5"
                    value={filters.sentimentMin}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        sentimentMin: Math.min(parseFloat(e.target.value), prev.sentimentMax - 0.5),
                      }))
                    }
                    className="flex-1 accent-primary"
                    aria-label="Minimum sentiment"
                  />
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    step="0.5"
                    value={filters.sentimentMax}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        sentimentMax: Math.max(parseFloat(e.target.value), prev.sentimentMin + 0.5),
                      }))
                    }
                    className="flex-1 accent-primary"
                    aria-label="Maximum sentiment"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  <span>Clear all filters</span>
                </button>
              )}
            </div>
          )}
        </header>

        {/* Conversation Grid */}
        <main className="flex-1 overflow-y-auto p-6">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Users className="h-12 w-12 mb-4" aria-hidden="true" />
              <p className="text-lg font-medium mb-2">No conversations found</p>
              <p className="text-sm">
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'Waiting for new conversations...'}
              </p>
            </div>
          ) : (
            <div
              ref={gridRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              role="grid"
              aria-label="Live conversations grid"
              onKeyDown={handleGridKeyDown}
              tabIndex={0}
            >
              {filteredConversations.map((conversation, index) => (
                <div
                  key={conversation.id}
                  role="gridcell"
                  tabIndex={focusedIndex === index ? 0 : -1}
                  data-grid-index={index}
                  className={cn(
                    'outline-none',
                    focusedIndex === index && 'ring-2 ring-primary rounded-xl'
                  )}
                >
                  <LiveConversationCard
                    conversation={conversation}
                    isSelected={selectedId === conversation.id}
                    onClick={() => {
                      setFocusedIndex(index);
                      handleSelectConversation(conversation.id);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Watch Panel Sidebar */}
      {selectedConversation && (
        <aside
          className="fixed right-0 top-16 bottom-0 w-96 z-10"
          aria-label="Conversation watch panel"
        >
          <WatchPanel
            conversation={selectedConversation}
            messages={mockMessages.filter((m) => m.conversationId === selectedConversation.id)}
            notes={mockNotes.filter((n) => n.conversationId === selectedConversation.id)}
            onClose={handleClosePanel}
            onWhisper={handleWhisper}
            onAddNote={handleAddNote}
            onTakeOver={handleTakeOver}
            onEscalate={handleEscalate}
            onEndConversation={handleEndConversation}
          />
        </aside>
      )}
    </div>
  );
}
