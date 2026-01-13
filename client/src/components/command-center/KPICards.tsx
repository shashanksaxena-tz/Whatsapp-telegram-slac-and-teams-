import React from 'react';
import { AlertCircle, AlertTriangle, Clock, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface KPIData {
  critical: number;
  high: number;
  medium: number;
  resolved: number;
  criticalChange?: number;
  highChange?: number;
  mediumChange?: number;
  resolvedChange?: number;
}

interface KPICardsProps {
  data: KPIData;
}

interface CardProps {
  label: string;
  value: number;
  change?: number;
  icon: React.ElementType;
  color: 'red' | 'orange' | 'yellow' | 'green';
}

const colorConfig = {
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: 'text-red-500',
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    icon: 'text-orange-500',
  },
  yellow: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    icon: 'text-yellow-500',
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    icon: 'text-green-500',
  },
};

function KPICard({ label, value, change, icon: Icon, color }: CardProps) {
  const config = colorConfig[color];
  const isPositiveChange = change !== undefined && change > 0;
  const isNegativeChange = change !== undefined && change < 0;

  return (
    <div className={cn(
      'rounded-xl border p-4 transition-all hover:scale-[1.02]',
      config.bg,
      config.border
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className={cn('text-sm', config.text)}>{label}</p>
        </div>
        <Icon className={cn('h-6 w-6', config.icon)} />
      </div>

      {change !== undefined && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          {isPositiveChange ? (
            <>
              <TrendingUp className="h-3 w-3 text-red-400" />
              <span className="text-red-400">+{change}%</span>
            </>
          ) : isNegativeChange ? (
            <>
              <TrendingDown className="h-3 w-3 text-green-400" />
              <span className="text-green-400">{change}%</span>
            </>
          ) : (
            <span className="text-gray-400">No change</span>
          )}
          <span className="text-gray-500 ml-1">vs last period</span>
        </div>
      )}
    </div>
  );
}

export function KPICards({ data }: KPICardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KPICard
        label="Critical"
        value={data.critical}
        change={data.criticalChange}
        icon={AlertCircle}
        color="red"
      />
      <KPICard
        label="High"
        value={data.high}
        change={data.highChange}
        icon={AlertTriangle}
        color="orange"
      />
      <KPICard
        label="Medium"
        value={data.medium}
        change={data.mediumChange}
        icon={Clock}
        color="yellow"
      />
      <KPICard
        label="Resolved"
        value={data.resolved}
        change={data.resolvedChange}
        icon={CheckCircle}
        color="green"
      />
    </div>
  );
}
