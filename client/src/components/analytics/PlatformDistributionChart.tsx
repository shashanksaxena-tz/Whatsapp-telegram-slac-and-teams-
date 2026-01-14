import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { platformColors, platformNames } from '../../lib/constants';
import { cn } from '../../lib/utils';

/**
 * Data point for platform distribution
 */
export interface PlatformDistributionDataPoint {
  platform: string;
  count: number;
}

interface PlatformDistributionChartProps {
  data: PlatformDistributionDataPoint[];
  className?: string;
  title?: string;
  description?: string;
  variant?: 'pie' | 'donut';
}

/**
 * Get color for platform
 */
function getPlatformColor(platform: string): string {
  return platformColors[platform.toUpperCase()] || '#6B7280';
}

/**
 * Custom tooltip for distribution chart
 */
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { percentage: number } }>;
}) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0];
  const platformName = platformNames[data.name.toUpperCase()] || data.name;

  return (
    <div className="bg-gray-900/95 border border-white/10 rounded-lg p-3 shadow-xl backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: getPlatformColor(data.name) }}
          aria-hidden="true"
        />
        <span className="text-white font-semibold">{platformName}</span>
      </div>
      <div className="text-sm text-gray-400">
        <span className="text-white">{data.value}</span> conversations
        <span className="ml-2">({data.payload.percentage.toFixed(1)}%)</span>
      </div>
    </div>
  );
}

/**
 * Custom legend component
 */
function CustomLegendContent({
  payload,
}: {
  payload?: Array<{ value: string; color: string; payload: { percentage: number; count: number } }>;
}) {
  if (!payload) return null;

  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry) => {
        const platformName = platformNames[entry.value.toUpperCase()] || entry.value;
        return (
          <div key={entry.value} className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
              aria-hidden="true"
            />
            <span className="text-gray-400">{platformName}</span>
            <span className="text-white font-medium">
              {entry.payload.percentage.toFixed(0)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Platform Distribution Chart Component
 * Displays pie/donut chart showing conversation distribution by platform
 */
export function PlatformDistributionChart({
  data,
  className,
  title = 'Platform Distribution',
  description,
  variant = 'donut',
}: PlatformDistributionChartProps) {
  // Calculate total and percentages
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const dataWithPercentage = data.map((item) => ({
    ...item,
    percentage: total > 0 ? (item.count / total) * 100 : 0,
  }));

  // Sort by count descending
  const sortedData = [...dataWithPercentage].sort((a, b) => b.count - a.count);

  // Inner and outer radius for donut/pie
  const innerRadius = variant === 'donut' ? 60 : 0;
  const outerRadius = 100;

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
            Total: <span className="text-white font-semibold">{total}</span>
          </div>
        </div>
      </div>

      <div className="h-64" aria-label="Platform distribution chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sortedData}
              dataKey="count"
              nameKey="platform"
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth={1}
            >
              {sortedData.map((entry) => (
                <Cell
                  key={`cell-${entry.platform}`}
                  fill={getPlatformColor(entry.platform)}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegendContent />} />
            {variant === 'donut' && (
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white"
              >
                <tspan x="50%" dy="-0.5em" fontSize="24" fontWeight="bold">
                  {total}
                </tspan>
                <tspan x="50%" dy="1.5em" fontSize="12" fill="#9CA3AF">
                  Total
                </tspan>
              </text>
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Platform breakdown list */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {sortedData.map((item) => {
            const platformName = platformNames[item.platform.toUpperCase()] || item.platform;
            return (
              <div
                key={item.platform}
                className="flex items-center justify-between p-2 rounded-lg bg-white/5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getPlatformColor(item.platform) }}
                    aria-hidden="true"
                  />
                  <span className="text-gray-300">{platformName}</span>
                </div>
                <span className="text-white font-medium">{item.count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PlatformDistributionChart;
