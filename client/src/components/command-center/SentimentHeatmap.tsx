import React from 'react';
import { cn } from '../../lib/utils';

interface HeatmapData {
  platform: string;
  hours: number[]; // 24 values, one per hour, sentiment scores averaged
}

interface SentimentHeatmapProps {
  data: HeatmapData[];
}

const platformLabels: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  TELEGRAM: 'Telegram',
  SLACK: 'Slack',
  TEAMS: 'Teams',
};

function getSentimentColor(score: number): string {
  if (score >= 2) return 'bg-green-500';
  if (score >= 1) return 'bg-green-400/70';
  if (score >= 0) return 'bg-gray-500/50';
  if (score >= -1) return 'bg-orange-400/70';
  if (score >= -2) return 'bg-orange-500';
  return 'bg-red-500';
}

function getSentimentOpacity(score: number): string {
  const abs = Math.abs(score);
  if (abs >= 3) return 'opacity-100';
  if (abs >= 2) return 'opacity-80';
  if (abs >= 1) return 'opacity-60';
  return 'opacity-40';
}

export function SentimentHeatmap({ data }: SentimentHeatmapProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const displayHours = [0, 6, 12, 18, 23];

  return (
    <div className="bg-glass border border-glass-border rounded-xl p-6">
      <h3 className="text-lg font-bold mb-4">Sentiment Heatmap</h3>

      <div className="space-y-3">
        {/* Hour labels */}
        <div className="flex items-center">
          <div className="w-20" />
          <div className="flex-1 flex justify-between text-xs text-gray-400 px-1">
            {displayHours.map((h) => (
              <span key={h}>{h.toString().padStart(2, '0')}:00</span>
            ))}
          </div>
        </div>

        {/* Platform rows */}
        {data.map((row) => (
          <div key={row.platform} className="flex items-center gap-2">
            <div className="w-20 text-sm text-gray-300 truncate">
              {platformLabels[row.platform] || row.platform}
            </div>
            <div className="flex-1 flex gap-0.5">
              {row.hours.map((score, hour) => (
                <div
                  key={hour}
                  className={cn(
                    'flex-1 h-6 rounded-sm transition-all hover:scale-110 cursor-pointer',
                    getSentimentColor(score),
                    getSentimentOpacity(score)
                  )}
                  title={`${hour}:00 - Sentiment: ${score.toFixed(1)}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-green-500" />
          <span className="text-gray-400">Positive</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-gray-500/50" />
          <span className="text-gray-400">Neutral</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-red-500" />
          <span className="text-gray-400">Negative</span>
        </div>
      </div>
    </div>
  );
}
