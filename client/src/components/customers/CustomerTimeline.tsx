import React from 'react';
import { MessageCircle, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '../../lib/utils';

export interface TimelineEvent {
  id: string;
  type: 'conversation_started' | 'conversation_resolved' | 'escalation' | 'message';
  platform: string;
  title: string;
  description?: string;
  sentimentScore?: number;
  createdAt: string;
}

interface CustomerTimelineProps {
  events: TimelineEvent[];
  isLoading?: boolean;
}

const eventIcons: Record<string, React.ElementType> = {
  conversation_started: MessageCircle,
  conversation_resolved: CheckCircle,
  escalation: AlertCircle,
  message: MessageCircle,
};

const eventColors: Record<string, string> = {
  conversation_started: 'bg-blue-500',
  conversation_resolved: 'bg-green-500',
  escalation: 'bg-red-500',
  message: 'bg-gray-500',
};

const platformIcons: Record<string, string> = {
  WHATSAPP: '📱',
  TELEGRAM: '✈️',
  SLACK: '💼',
  TEAMS: '🏢',
  WEB: '🌐',
};

export function CustomerTimeline({ events, isLoading }: CustomerTimelineProps) {
  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-400">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
        Loading timeline...
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const Icon = eventIcons[event.type] || MessageCircle;
        const colorClass = eventColors[event.type] || eventColors.message;
        const time = formatDistanceToNow(new Date(event.createdAt), { addSuffix: true });
        const fullDate = format(new Date(event.createdAt), 'PPp');

        return (
          <div key={event.id} className="flex gap-3">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={cn('h-8 w-8 rounded-full flex items-center justify-center', colorClass)}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              {index < events.length - 1 && (
                <div className="w-px flex-1 bg-white/10 my-1" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">{platformIcons[event.platform]}</span>
                <span className="font-medium text-sm">{event.title}</span>
                {event.sentimentScore !== undefined && (
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded',
                    event.sentimentScore >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  )}>
                    {event.sentimentScore.toFixed(1)}
                  </span>
                )}
              </div>

              {event.description && (
                <p className="text-sm text-gray-400 mt-1">{event.description}</p>
              )}

              <p className="text-xs text-gray-500 mt-1" title={fullDate}>{time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
