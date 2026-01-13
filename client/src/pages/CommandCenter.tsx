import React, { useState } from 'react';
import { Filter, Calendar } from 'lucide-react';
import { KPICards } from '../components/command-center/KPICards';
import { PriorityQueue } from '../components/command-center/PriorityQueue';
import { SentimentHeatmap } from '../components/command-center/SentimentHeatmap';
import { useRealtimeStore } from '../stores';

// Mock data for initial development
const mockKPIData = {
  critical: 12,
  high: 34,
  medium: 89,
  resolved: 156,
  criticalChange: 15,
  highChange: -8,
  mediumChange: 5,
  resolvedChange: 23,
};

const mockHeatmapData = [
  { platform: 'WHATSAPP', hours: Array.from({ length: 24 }, () => Math.random() * 4 - 2) },
  { platform: 'TELEGRAM', hours: Array.from({ length: 24 }, () => Math.random() * 4 - 2) },
  { platform: 'SLACK', hours: Array.from({ length: 24 }, () => Math.random() * 4 - 2) },
  { platform: 'TEAMS', hours: Array.from({ length: 24 }, () => Math.random() * 4 - 2) },
];

const mockQueueItems = [
  {
    id: '1',
    customerName: 'John Doe',
    platform: 'WHATSAPP',
    lastMessage: 'This is absolutely unacceptable! I\'ve been waiting for 3 days and still no response!',
    sentimentScore: -4.2,
    emotion: 'angry',
    severity: 'CRITICAL' as const,
    waitTimeMinutes: 12,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    customerName: 'Sarah Miller',
    platform: 'SLACK',
    lastMessage: 'I\'m really frustrated with the service. When will someone help me?',
    sentimentScore: -2.8,
    emotion: 'frustrated',
    severity: 'HIGH' as const,
    waitTimeMinutes: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    customerName: 'Mike Thompson',
    platform: 'TEAMS',
    lastMessage: 'The product isn\'t working as expected. Can you assist?',
    sentimentScore: -1.2,
    emotion: 'worried',
    severity: 'MEDIUM' as const,
    waitTimeMinutes: 8,
    createdAt: new Date().toISOString(),
  },
];

export default function CommandCenter() {
  const { escalationQueue } = useRealtimeStore();
  const [dateRange, setDateRange] = useState('today');

  // Use real data if available, otherwise mock
  const queueItems = escalationQueue.length > 0
    ? escalationQueue.map(e => ({
        id: e.id,
        customerName: e.customerName,
        platform: e.platform,
        lastMessage: e.lastMessage,
        sentimentScore: e.sentimentScore,
        emotion: e.emotion,
        severity: e.severity,
        waitTimeMinutes: e.waitTime,
        createdAt: e.createdAt,
      }))
    : mockQueueItems;

  const handleView = (id: string) => {
    console.log('View escalation:', id);
    // TODO: Navigate to conversation
  };

  const handleAssign = (id: string) => {
    console.log('Assign escalation:', id);
    // TODO: Open assign modal
  };

  const handleEscalate = (id: string) => {
    console.log('Escalate:', id);
    // TODO: Escalate to manager
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            Command Center
          </h1>
          <p className="text-gray-400 mt-1">Sentiment-aware escalation monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm">
            <Filter className="h-4 w-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm">
            <Calendar className="h-4 w-4" />
            {dateRange === 'today' ? 'Today' : dateRange}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards data={mockKPIData} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Queue */}
        <PriorityQueue
          items={queueItems}
          onView={handleView}
          onAssign={handleAssign}
          onEscalate={handleEscalate}
        />

        {/* Sentiment Heatmap */}
        <SentimentHeatmap data={mockHeatmapData} />
      </div>

      {/* Live Sentiment Feed */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">Live Sentiment Feed</h3>
        <div className="space-y-2 font-mono text-sm max-h-48 overflow-y-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded transition-colors">
              <span className="text-gray-500">{new Date().toLocaleTimeString()}</span>
              <span className="text-primary">WhatsApp</span>
              <span className={i % 2 === 0 ? 'text-green-400' : 'text-red-400'}>
                {i % 2 === 0 ? '\u2191' : '\u2193'} {(Math.random() * 4 - 2).toFixed(1)}
              </span>
              <span className="text-gray-400 truncate">Customer message processed</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
