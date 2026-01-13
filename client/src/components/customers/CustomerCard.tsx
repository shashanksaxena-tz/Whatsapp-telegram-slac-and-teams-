import React from 'react';
import { Mail, Phone, MessageCircle, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';

export interface CustomerIdentity {
  platform: 'WHATSAPP' | 'TELEGRAM' | 'SLACK' | 'TEAMS' | 'WEB';
  platformUserId: string;
  platformUsername?: string;
}

export interface Customer {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  identities: CustomerIdentity[];
  totalConversations: number;
  avgSentiment: number;
  lastContactAt: string;
  createdAt: string;
}

interface CustomerCardProps {
  customer: Customer;
  onClick?: () => void;
  isSelected?: boolean;
}

const platformIcons: Record<string, string> = {
  WHATSAPP: '📱',
  TELEGRAM: '✈️',
  SLACK: '💼',
  TEAMS: '🏢',
  WEB: '🌐',
};

export function CustomerCard({ customer, onClick, isSelected }: CustomerCardProps) {
  const displayName = customer.name || customer.email || customer.phone || 'Unknown Customer';
  const initials = displayName.charAt(0).toUpperCase();
  const lastContact = formatDistanceToNow(new Date(customer.lastContactAt), { addSuffix: true });

  const sentimentTrend = customer.avgSentiment >= 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 border border-white/10 rounded-xl transition-all cursor-pointer hover:bg-white/5',
        isSelected && 'ring-2 ring-primary bg-white/5'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        {customer.avatarUrl ? (
          <img
            src={customer.avatarUrl}
            alt={displayName}
            className="h-12 w-12 rounded-full"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/50 to-purple-500/50 flex items-center justify-center text-lg font-bold">
            {initials}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold truncate">{displayName}</h3>

          {/* Contact info */}
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
            {customer.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {customer.email}
              </span>
            )}
            {customer.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {customer.phone}
              </span>
            )}
          </div>

          {/* Platforms */}
          <div className="flex items-center gap-1 mt-2">
            {customer.identities.map((identity, idx) => (
              <span
                key={idx}
                title={`${identity.platform}: ${identity.platformUsername || identity.platformUserId}`}
                className="text-sm"
              >
                {platformIcons[identity.platform]}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="text-right text-xs">
          <div className="flex items-center gap-1 justify-end">
            <MessageCircle className="h-3 w-3 text-gray-400" />
            <span>{customer.totalConversations}</span>
          </div>
          <div className={cn(
            'flex items-center gap-1 justify-end mt-1',
            sentimentTrend ? 'text-green-400' : 'text-red-400'
          )}>
            {sentimentTrend ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{customer.avgSentiment.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1 justify-end mt-1 text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>{lastContact}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
