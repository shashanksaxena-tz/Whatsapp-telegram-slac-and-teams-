import React from 'react';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Color variant for metric card
 */
export type MetricCardVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: number; // Percentage change, positive = up, negative = down
  trendLabel?: string;
  variant?: MetricCardVariant;
  className?: string;
  description?: string;
  invertTrend?: boolean; // If true, negative trend is good (e.g., for response time)
}

/**
 * Color configurations for different variants
 */
const variantConfig: Record<
  MetricCardVariant,
  { bg: string; border: string; text: string; icon: string }
> = {
  default: {
    bg: 'bg-white/5',
    border: 'border-white/10',
    text: 'text-white',
    icon: 'text-gray-400',
  },
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    text: 'text-green-400',
    icon: 'text-green-500',
  },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    text: 'text-yellow-400',
    icon: 'text-yellow-500',
  },
  danger: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    text: 'text-red-400',
    icon: 'text-red-500',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    icon: 'text-blue-500',
  },
};

/**
 * Get trend display properties
 */
function getTrendDisplay(
  trend: number,
  invertTrend: boolean
): { icon: LucideIcon; color: string; label: string } {
  if (trend === 0) {
    return {
      icon: Minus,
      color: 'text-gray-400',
      label: 'No change',
    };
  }

  const isPositive = trend > 0;
  const isGoodTrend = invertTrend ? !isPositive : isPositive;

  return {
    icon: isPositive ? TrendingUp : TrendingDown,
    color: isGoodTrend ? 'text-green-400' : 'text-red-400',
    label: `${isPositive ? '+' : ''}${trend.toFixed(1)}%`,
  };
}

/**
 * Metric Card Component
 * A reusable card for displaying a single metric with optional trend indicator
 */
export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel = 'vs last period',
  variant = 'default',
  className,
  description,
  invertTrend = false,
}: MetricCardProps) {
  const config = variantConfig[variant];
  const trendDisplay = trend !== undefined ? getTrendDisplay(trend, invertTrend) : null;

  return (
    <div
      className={cn(
        'relative rounded-xl border p-5 transition-all duration-200',
        'hover:scale-[1.02] hover:shadow-lg',
        config.bg,
        config.border,
        className
      )}
      role="region"
      aria-label={`${label}: ${value}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-1">{label}</p>
          <p className={cn('text-3xl font-bold', config.text)}>{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        {Icon && (
          <div className={cn('p-2 rounded-lg', config.bg)}>
            <Icon className={cn('h-6 w-6', config.icon)} aria-hidden="true" />
          </div>
        )}
      </div>

      {trendDisplay && (
        <div
          className="mt-3 flex items-center gap-1.5 text-sm"
          aria-label={`Trend: ${trendDisplay.label} ${trendLabel}`}
        >
          <trendDisplay.icon
            className={cn('h-4 w-4', trendDisplay.color)}
            aria-hidden="true"
          />
          <span className={trendDisplay.color}>{trendDisplay.label}</span>
          <span className="text-gray-500">{trendLabel}</span>
        </div>
      )}

      {/* Decorative corner element */}
      <div className="absolute top-0 right-0 p-1.5 opacity-30">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={config.icon}
          aria-hidden="true"
        >
          <path d="M0 0H16V16" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
    </div>
  );
}

/**
 * Metric Card Grid Component
 * A container for displaying multiple metric cards in a grid layout
 */
interface MetricCardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function MetricCardGrid({
  children,
  columns = 4,
  className,
}: MetricCardGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
}

export default MetricCard;
