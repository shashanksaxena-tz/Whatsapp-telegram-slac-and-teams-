import React from 'react';
import { Clock, MessageCircle, User, ArrowRight } from 'lucide-react';
import { SeverityBadge, type Severity } from '../common/SeverityBadge';
import { cn } from '../../lib/utils';

interface QueueItem {
  id: string;
  customerName: string;
  platform: string;
  lastMessage: string;
  sentimentScore: number;
  emotion: string;
  severity: Severity;
  waitTimeMinutes: number;
  createdAt: string;
}

interface PriorityQueueProps {
  items: QueueItem[];
  onView: (id: string) => void;
  onAssign: (id: string) => void;
  onEscalate?: (id: string) => void;
}

const platformIcons: Record<string, string> = {
  WHATSAPP: '📱',
  TELEGRAM: '✈️',
  SLACK: '💼',
  TEAMS: '🏢',
  WEB: '🌐',
};

export function PriorityQueue({ items, onView, onAssign, onEscalate }: PriorityQueueProps) {
  if (items.length === 0) {
    return (
      <div className="bg-glass border border-glass-border rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">Priority Queue</h3>
        <div className="text-center py-8 text-gray-400">
          <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No escalations in queue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-glass border border-glass-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Priority Queue</h3>
        <span className="text-sm text-gray-400">{items.length} items</span>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'p-4 rounded-lg border transition-all hover:bg-white/5',
              item.severity === 'CRITICAL' && 'border-red-500/30 bg-red-500/5',
              item.severity === 'HIGH' && 'border-orange-500/30 bg-orange-500/5',
              item.severity === 'MEDIUM' && 'border-yellow-500/30 bg-yellow-500/5',
              item.severity === 'LOW' && 'border-glass-border'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <SeverityBadge
                    severity={item.severity}
                    size="sm"
                    pulse={item.severity === 'CRITICAL'}
                  />
                  <span className="text-lg">{platformIcons[item.platform] || '💬'}</span>
                  <span className="font-medium truncate">{item.customerName}</span>
                </div>

                <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                  "{item.lastMessage}"
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {item.waitTimeMinutes}m
                  </span>
                  <span>
                    Sentiment: {item.sentimentScore.toFixed(1)} | {item.emotion}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onView(item.id)}
                  className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
                >
                  View
                </button>
                <button
                  onClick={() => onAssign(item.id)}
                  className="px-3 py-1.5 text-xs bg-primary/20 hover:bg-primary/30 text-primary rounded transition-colors"
                >
                  Assign
                </button>
                {onEscalate && item.severity !== 'CRITICAL' && (
                  <button
                    onClick={() => onEscalate(item.id)}
                    className="px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors flex items-center gap-1"
                  >
                    Escalate <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
