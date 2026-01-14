import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { sentimentColors } from '../../lib/constants';
import { cn } from '../../lib/utils';

/**
 * Data point for sentiment trend
 */
export interface SentimentDataPoint {
  date: string;
  score: number;
  label?: string;
}

interface SentimentTrendChartProps {
  data: SentimentDataPoint[];
  className?: string;
  title?: string;
  description?: string;
}

/**
 * Custom tooltip for sentiment chart
 */
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  const score = payload[0].value;
  const sentiment =
    score >= 0.5 ? 'Positive' : score >= 0 ? 'Neutral' : 'Negative';
  const sentimentColor =
    score >= 0.5
      ? sentimentColors.positive
      : score >= 0
      ? sentimentColors.neutral
      : sentimentColors.negative;

  return (
    <div className="bg-gray-900/95 border border-white/10 rounded-lg p-3 shadow-xl backdrop-blur-sm">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: sentimentColor }}
          aria-hidden="true"
        />
        <span className="text-white font-semibold">
          {score.toFixed(2)}
        </span>
        <span className="text-gray-400 text-sm">({sentiment})</span>
      </div>
    </div>
  );
}

/**
 * Get gradient ID based on whether value is positive or negative
 */
function getGradientColor(score: number): string {
  if (score >= 0.5) return sentimentColors.positive;
  if (score >= 0) return sentimentColors.neutral;
  return sentimentColors.negative;
}

/**
 * Sentiment Trend Chart Component
 * Displays sentiment scores over time with color-coded visualization
 */
export function SentimentTrendChart({
  data,
  className,
  title = 'Sentiment Trend',
  description,
}: SentimentTrendChartProps) {
  // Calculate average sentiment for the period
  const avgSentiment =
    data.length > 0
      ? data.reduce((sum, d) => sum + d.score, 0) / data.length
      : 0;

  return (
    <div
      className={cn(
        'bg-glass rounded-xl border border-white/10 p-6',
        className
      )}
      role="region"
      aria-label={title}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description && (
          <p className="text-gray-400 text-sm mt-1">{description}</p>
        )}
      </div>

      <div className="h-64" aria-label="Sentiment trend line chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={sentimentColors.positive}
                  stopOpacity={0.3}
                />
                <stop
                  offset="50%"
                  stopColor={sentimentColors.neutral}
                  stopOpacity={0.1}
                />
                <stop
                  offset="100%"
                  stopColor={sentimentColors.negative}
                  stopOpacity={0.3}
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
              domain={[-1, 1]}
              ticks={[-1, -0.5, 0, 0.5, 1]}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickFormatter={(value) => value.toFixed(1)}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={0}
              stroke="rgba(255,255,255,0.2)"
              strokeDasharray="3 3"
              label={{
                value: 'Neutral',
                position: 'right',
                fill: '#9CA3AF',
                fontSize: 10,
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke={getGradientColor(avgSentiment)}
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props;
                const color = getGradientColor(payload.score);
                return (
                  <circle
                    key={`dot-${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={color}
                    stroke={color}
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{
                r: 6,
                strokeWidth: 2,
                fill: '#fff',
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: sentimentColors.positive }}
            aria-hidden="true"
          />
          <span className="text-gray-400">Positive (0.5 to 1.0)</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: sentimentColors.neutral }}
            aria-hidden="true"
          />
          <span className="text-gray-400">Neutral (0 to 0.5)</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: sentimentColors.negative }}
            aria-hidden="true"
          />
          <span className="text-gray-400">Negative (-1.0 to 0)</span>
        </div>
      </div>
    </div>
  );
}

export default SentimentTrendChart;
