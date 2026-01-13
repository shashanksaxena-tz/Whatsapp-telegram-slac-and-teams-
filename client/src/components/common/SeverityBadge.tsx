import React from 'react';
import { cn } from '../../lib/utils';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface SeverityBadgeProps {
  severity: Severity;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

const severityConfig = {
  CRITICAL: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/50',
    text: 'text-red-400',
    dot: 'bg-red-500',
    label: 'Critical',
  },
  HIGH: {
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/50',
    text: 'text-orange-400',
    dot: 'bg-orange-500',
    label: 'High',
  },
  MEDIUM: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/50',
    text: 'text-yellow-400',
    dot: 'bg-yellow-500',
    label: 'Medium',
  },
  LOW: {
    bg: 'bg-green-500/20',
    border: 'border-green-500/50',
    text: 'text-green-400',
    dot: 'bg-green-500',
    label: 'Low',
  },
};

const sizeConfig = {
  sm: { dot: 'h-2 w-2', text: 'text-xs', padding: 'px-2 py-0.5' },
  md: { dot: 'h-2.5 w-2.5', text: 'text-sm', padding: 'px-2.5 py-1' },
  lg: { dot: 'h-3 w-3', text: 'text-base', padding: 'px-3 py-1.5' },
};

export function SeverityBadge({
  severity,
  showLabel = true,
  size = 'md',
  pulse = false
}: SeverityBadgeProps) {
  const config = severityConfig[severity];
  const sizes = sizeConfig[size];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.bg,
        config.border,
        config.text,
        sizes.padding,
        sizes.text
      )}
    >
      <span
        className={cn(
          'rounded-full',
          config.dot,
          sizes.dot,
          pulse && 'animate-pulse'
        )}
      />
      {showLabel && config.label}
    </span>
  );
}
