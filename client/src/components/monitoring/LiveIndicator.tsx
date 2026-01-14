import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Live status states for conversation monitoring
 */
export type LiveStatus = 'active' | 'typing' | 'idle' | 'escalated';

/**
 * Props for the LiveIndicator component
 */
export interface LiveIndicatorProps {
  /** The current status of the live conversation */
  status: LiveStatus;
  /** Size of the indicator dot */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show a label next to the indicator */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Configuration for each live status state
 */
const statusConfig: Record<LiveStatus, {
  color: string;
  pulseColor: string;
  label: string;
  ariaLabel: string;
}> = {
  active: {
    color: 'bg-green-500',
    pulseColor: 'bg-green-400',
    label: 'Active',
    ariaLabel: 'Conversation is active',
  },
  typing: {
    color: 'bg-blue-500',
    pulseColor: 'bg-blue-400',
    label: 'Typing',
    ariaLabel: 'Someone is typing',
  },
  idle: {
    color: 'bg-yellow-500',
    pulseColor: 'bg-yellow-400',
    label: 'Idle',
    ariaLabel: 'Conversation is idle',
  },
  escalated: {
    color: 'bg-red-500',
    pulseColor: 'bg-red-400',
    label: 'Escalated',
    ariaLabel: 'Conversation has been escalated',
  },
};

/**
 * Size configuration for the indicator dot
 */
const sizeConfig = {
  sm: { dot: 'h-2 w-2', pulse: 'h-2 w-2', text: 'text-xs', gap: 'gap-1' },
  md: { dot: 'h-2.5 w-2.5', pulse: 'h-2.5 w-2.5', text: 'text-sm', gap: 'gap-1.5' },
  lg: { dot: 'h-3 w-3', pulse: 'h-3 w-3', text: 'text-base', gap: 'gap-2' },
};

/**
 * LiveIndicator - A pulsing dot indicator for live conversation status
 *
 * Displays a color-coded pulsing indicator to show the current state of a
 * live conversation. Different colors represent different states:
 * - Green: Active conversation
 * - Blue: Someone is typing
 * - Yellow: Idle/waiting
 * - Red: Escalated/urgent
 */
export function LiveIndicator({
  status,
  size = 'md',
  showLabel = false,
  className,
}: LiveIndicatorProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];

  return (
    <span
      className={cn('inline-flex items-center', sizes.gap, className)}
      role="status"
      aria-label={config.ariaLabel}
    >
      <span className="relative inline-flex">
        {/* Pulsing background */}
        <span
          className={cn(
            'absolute inline-flex rounded-full opacity-75 animate-ping',
            config.pulseColor,
            sizes.pulse
          )}
          aria-hidden="true"
        />
        {/* Solid dot */}
        <span
          className={cn(
            'relative inline-flex rounded-full',
            config.color,
            sizes.dot
          )}
          aria-hidden="true"
        />
      </span>
      {showLabel && (
        <span className={cn('font-medium text-gray-300', sizes.text)}>
          {config.label}
        </span>
      )}
    </span>
  );
}
