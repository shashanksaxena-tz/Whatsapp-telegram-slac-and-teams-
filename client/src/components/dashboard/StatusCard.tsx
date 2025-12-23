import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface StatusCardProps {
  title: string;
  status: 'online' | 'offline' | 'error';
  icon: React.ElementType;
  description?: string;
  ping?: number;
}

const StatusCard: React.FC<StatusCardProps> = ({ title, status, icon: Icon, description, ping }) => {
  const statusConfig = {
    online: { color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20', glow: 'shadow-[0_0_15px_rgba(10,255,10,0.15)]' },
    offline: { color: 'text-gray-500', bg: 'bg-white/5', border: 'border-white/10', glow: '' },
    error: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]' },
  };

  const config = statusConfig[status];

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={cn(
        "relative p-6 rounded-xl border backdrop-blur-sm overflow-hidden group transition-all duration-300",
        "bg-glass",
        config.border,
        config.glow
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-lg", config.bg)}>
          <Icon className={cn("h-6 w-6", config.color)} />
        </div>
        <div className="flex items-center gap-2">
           {status === 'online' && (
             <span className="flex h-2 w-2 relative">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
             </span>
           )}
           <span className={cn("text-xs font-mono uppercase tracking-wider", config.color)}>
             {status}
           </span>
        </div>
      </div>

      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">{title}</h3>
      {description && <p className="text-gray-400 text-sm">{description}</p>}

      {status === 'online' && ping && (
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-500 font-mono">
          <span>LATENCY</span>
          <span className="text-accent">{ping}ms</span>
        </div>
      )}

      {/* Decorative Corner */}
      <div className="absolute top-0 right-0 p-2 opacity-50">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={cn("transition-colors", config.color)}>
          <path d="M0 0H20V20" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
    </motion.div>
  );
};

export default StatusCard;
