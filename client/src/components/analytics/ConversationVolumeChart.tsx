import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { platformColors, platformNames, statusColors } from '../../lib/constants';
import { cn } from '../../lib/utils';

/**
 * Data point for conversation volume by platform
 */
export interface ConversationVolumeDataPoint {
  platform: string;
  resolved: number;
  open: number;
}

interface ConversationVolumeChartProps {
  data: ConversationVolumeDataPoint[];
  className?: string;
  title?: string;
  description?: string;
}

/**
 * Custom tooltip for volume chart
 */
const CustomTooltip = React.memo(function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; fill: string }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  const platformName = platformNames[label?.toUpperCase() || ''] || label;
  const total = payload.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="bg-gray-900/95 border border-white/10 rounded-lg p-3 shadow-xl backdrop-blur-sm">
      <p className="text-white font-semibold mb-2">{platformName}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.fill }}
                aria-hidden="true"
              />
              <span className="text-gray-400 capitalize">{entry.name}</span>
            </div>
            <span className="text-white font-medium">{entry.value}</span>
          </div>
        ))}
        <div className="border-t border-white/10 mt-2 pt-2 flex justify-between">
          <span className="text-gray-400 text-sm">Total</span>
          <span className="text-white font-semibold">{total}</span>
        </div>
      </div>
    </div>
  );
});

/**
 * Custom legend component
 */
const CustomLegend = React.memo(function CustomLegend() {
  return (
    <div className="flex items-center justify-center gap-6 mt-4 text-sm">
      <div className="flex items-center gap-2">
        <span
          className="w-3 h-3 rounded"
          style={{ backgroundColor: statusColors.resolved }}
          aria-hidden="true"
        />
        <span className="text-gray-400">Resolved</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="w-3 h-3 rounded"
          style={{ backgroundColor: statusColors.open }}
          aria-hidden="true"
        />
        <span className="text-gray-400">Open</span>
      </div>
    </div>
  );
});

/**
 * Conversation Volume Chart Component
 * Displays stacked bar chart showing conversation volume by platform
 */
export const ConversationVolumeChart = React.memo(function ConversationVolumeChart({
  data,
  className,
  title = 'Conversation Volume by Platform',
  description,
}: ConversationVolumeChartProps) {
  // Format data to use platform display names
  const formattedData = data.map((item) => ({
    ...item,
    displayName: platformNames[item.platform.toUpperCase()] || item.platform,
  }));

  // Calculate totals
  const totalResolved = data.reduce((sum, d) => sum + d.resolved, 0);
  const totalOpen = data.reduce((sum, d) => sum + d.open, 0);

  return (
    <div
      className={cn(
        'bg-glass rounded-xl border border-white/10 p-6',
        className
      )}
      role="region"
      aria-label={title}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {description && (
            <p className="text-gray-400 text-sm mt-1">{description}</p>
          )}
        </div>
        <div className="text-right text-sm">
          <div className="text-gray-400">
            Total: <span className="text-white font-semibold">{totalResolved + totalOpen}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {totalResolved} resolved, {totalOpen} open
          </div>
        </div>
      </div>

      <div className="h-64" aria-label="Conversation volume stacked bar chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="displayName"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Bar
              dataKey="resolved"
              stackId="a"
              fill={statusColors.resolved}
              radius={[0, 0, 0, 0]}
              name="Resolved"
            />
            <Bar
              dataKey="open"
              stackId="a"
              fill={statusColors.open}
              radius={[4, 4, 0, 0]}
              name="Open"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <CustomLegend />
    </div>
  );
});

export default ConversationVolumeChart;
