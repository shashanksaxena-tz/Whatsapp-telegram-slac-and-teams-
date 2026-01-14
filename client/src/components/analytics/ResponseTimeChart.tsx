import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { chartColors } from '../../lib/constants';
import { cn } from '../../lib/utils';

/**
 * Data point for response time trend
 */
export interface ResponseTimeDataPoint {
  date: string;
  avgResponseTime: number; // in minutes
  label?: string;
}

interface ResponseTimeChartProps {
  data: ResponseTimeDataPoint[];
  className?: string;
  title?: string;
  description?: string;
  slaThreshold?: number; // SLA threshold in minutes
}

/**
 * Format time for display
 */
function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Custom tooltip for response time chart
 */
const CustomTooltip = React.memo(function CustomTooltip({
  active,
  payload,
  label,
  slaThreshold,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  slaThreshold?: number;
}) {
  if (!active || !payload || !payload.length) return null;

  const avgTime = payload[0].value;
  const isWithinSLA = slaThreshold ? avgTime <= slaThreshold : true;

  return (
    <div className="bg-gray-900/95 border border-white/10 rounded-lg p-3 shadow-xl backdrop-blur-sm">
      <p className="text-gray-400 text-xs mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: chartColors.primary }}
            aria-hidden="true"
          />
          <span className="text-white font-semibold">{formatTime(avgTime)}</span>
        </div>
        {slaThreshold && (
          <div className="flex items-center gap-2 text-sm">
            <span className={isWithinSLA ? 'text-green-400' : 'text-red-400'}>
              {isWithinSLA ? 'Within SLA' : 'Exceeds SLA'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * Response Time Chart Component
 * Displays area chart showing average response time trends with optional SLA threshold
 */
export const ResponseTimeChart = React.memo(function ResponseTimeChart({
  data,
  className,
  title = 'Response Time Trend',
  description,
  slaThreshold,
}: ResponseTimeChartProps) {
  // Calculate average response time
  const avgOverall =
    data.length > 0
      ? data.reduce((sum, d) => sum + d.avgResponseTime, 0) / data.length
      : 0;

  // Calculate SLA compliance percentage
  const slaCompliance = slaThreshold
    ? (data.filter((d) => d.avgResponseTime <= slaThreshold).length / data.length) * 100
    : null;

  // Calculate max value for Y axis with graceful handling of empty datasets
  const dataValues = data.map((d) => d.avgResponseTime);
  const maxDataValue = dataValues.length > 0 ? Math.max(...dataValues) : 0;
  const maxValue = Math.max(maxDataValue, slaThreshold || 0, 1); // Minimum of 1 to prevent collapsed axis
  const yAxisMax = Math.ceil(maxValue * 1.2);

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
            Avg: <span className="text-white font-semibold">{formatTime(avgOverall)}</span>
          </div>
          {slaCompliance !== null && (
            <div className={cn(
              'text-xs mt-1',
              slaCompliance >= 90 ? 'text-green-400' : slaCompliance >= 70 ? 'text-yellow-400' : 'text-red-400'
            )}>
              {slaCompliance.toFixed(1)}% SLA compliance
            </div>
          )}
        </div>
      </div>

      <div className="h-64" aria-label="Response time area chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="responseTimeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={chartColors.primary}
                  stopOpacity={0.4}
                />
                <stop
                  offset="100%"
                  stopColor={chartColors.primary}
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis
              domain={[0, yAxisMax]}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickFormatter={(value) => formatTime(value)}
            />
            <Tooltip
              content={({ active, payload, label }) => (
                <CustomTooltip
                  active={active}
                  payload={payload as Array<{ value: number }>}
                  label={label}
                  slaThreshold={slaThreshold}
                />
              )}
            />
            {slaThreshold && (
              <ReferenceLine
                y={slaThreshold}
                stroke={chartColors.warning}
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `SLA: ${formatTime(slaThreshold)}`,
                  position: 'right',
                  fill: chartColors.warning,
                  fontSize: 11,
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="avgResponseTime"
              stroke={chartColors.primary}
              strokeWidth={2}
              fill="url(#responseTimeGradient)"
              dot={false}
              activeDot={{
                r: 6,
                strokeWidth: 2,
                fill: '#fff',
                stroke: chartColors.primary,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded"
            style={{ backgroundColor: chartColors.primary }}
            aria-hidden="true"
          />
          <span className="text-gray-400">Avg Response Time</span>
        </div>
        {slaThreshold && (
          <div className="flex items-center gap-2">
            <span
              className="w-6 h-0.5"
              style={{
                backgroundColor: chartColors.warning,
                backgroundImage: `repeating-linear-gradient(90deg, ${chartColors.warning} 0, ${chartColors.warning} 5px, transparent 5px, transparent 10px)`,
              }}
              aria-hidden="true"
            />
            <span className="text-gray-400">SLA Threshold ({formatTime(slaThreshold)})</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default ResponseTimeChart;
