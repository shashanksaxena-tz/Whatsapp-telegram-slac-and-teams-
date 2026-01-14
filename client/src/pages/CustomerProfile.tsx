import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Search, Mail, Phone, Calendar, MessageCircle, TrendingUp, TrendingDown, User, Users } from 'lucide-react';
import { format } from 'date-fns';
import { CustomerCard, type Customer } from '../components/customers/CustomerCard';
import { CustomerTimeline, type TimelineEvent } from '../components/customers/CustomerTimeline';
import { platformIcons, platformNames, safeParseDate } from '../lib/constants';
import { cn } from '../lib/utils';

// Mock customer data with varied platforms and sentiment
const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    identities: [
      { platform: 'WHATSAPP', platformUserId: '+15551234567', platformUsername: 'John D' },
      { platform: 'SLACK', platformUserId: 'U12345', platformUsername: 'johndoe' },
    ],
    totalConversations: 12,
    avgSentiment: 1.5,
    lastContactAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
  },
  {
    id: 'cust-2',
    name: 'Sarah Miller',
    email: 'sarah.miller@company.org',
    phone: '+1 (555) 987-6543',
    identities: [
      { platform: 'TELEGRAM', platformUserId: '987654321', platformUsername: 'sarah_m' },
      { platform: 'TEAMS', platformUserId: 'sarah.miller@company.org' },
      { platform: 'WEB', platformUserId: 'web-session-abc123' },
    ],
    totalConversations: 28,
    avgSentiment: -1.2,
    lastContactAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString(),
  },
  {
    id: 'cust-3',
    name: 'Alex Johnson',
    email: 'alex.j@startup.io',
    identities: [
      { platform: 'SLACK', platformUserId: 'U67890', platformUsername: 'alexj' },
    ],
    totalConversations: 5,
    avgSentiment: 2.8,
    lastContactAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    id: 'cust-4',
    name: 'Emily Chen',
    email: 'emily.chen@enterprise.com',
    phone: '+1 (555) 456-7890',
    identities: [
      { platform: 'TEAMS', platformUserId: 'emily.chen@enterprise.com' },
      { platform: 'WHATSAPP', platformUserId: '+15554567890' },
    ],
    totalConversations: 42,
    avgSentiment: 0.3,
    lastContactAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
  },
  {
    id: 'cust-5',
    name: 'Chris Wilson',
    email: 'chris@freelance.dev',
    identities: [
      { platform: 'TELEGRAM', platformUserId: '123456789', platformUsername: 'chriswdev' },
      { platform: 'WEB', platformUserId: 'web-session-xyz789' },
    ],
    totalConversations: 8,
    avgSentiment: -3.5,
    lastContactAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
  },
  {
    id: 'cust-6',
    name: 'Maria Garcia',
    phone: '+34 612 345 678',
    identities: [
      { platform: 'WHATSAPP', platformUserId: '+34612345678', platformUsername: 'Maria G' },
    ],
    totalConversations: 15,
    avgSentiment: 1.8,
    lastContactAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
  },
];

// Mock timeline events for each customer
const mockTimelineEvents: Record<string, TimelineEvent[]> = {
  'cust-1': [
    { id: 'ev1-1', type: 'conversation_started', platform: 'WHATSAPP', title: 'New conversation via WhatsApp', description: 'Customer inquired about product availability', createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { id: 'ev1-2', type: 'message', platform: 'WHATSAPP', title: 'Customer message received', sentimentScore: 0.5, createdAt: new Date(Date.now() - 1000 * 60 * 28).toISOString() },
    { id: 'ev1-3', type: 'conversation_resolved', platform: 'WHATSAPP', title: 'Conversation resolved', description: 'Agent provided product information', sentimentScore: 2.0, createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString() },
    { id: 'ev1-4', type: 'conversation_started', platform: 'SLACK', title: 'New conversation via Slack', description: 'Follow-up question about shipping', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() },
    { id: 'ev1-5', type: 'conversation_resolved', platform: 'SLACK', title: 'Conversation resolved', sentimentScore: 1.5, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 45).toISOString() },
  ],
  'cust-2': [
    { id: 'ev2-1', type: 'escalation', platform: 'TELEGRAM', title: 'Escalated to supervisor', description: 'Customer requested manager intervention', sentimentScore: -2.5, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
    { id: 'ev2-2', type: 'message', platform: 'TELEGRAM', title: 'Supervisor response sent', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString() },
    { id: 'ev2-3', type: 'conversation_started', platform: 'TEAMS', title: 'New conversation via Teams', description: 'Billing inquiry', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString() },
    { id: 'ev2-4', type: 'conversation_resolved', platform: 'TEAMS', title: 'Conversation resolved', sentimentScore: 0.5, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 + 1000 * 60 * 120).toISOString() },
    { id: 'ev2-5', type: 'conversation_started', platform: 'WEB', title: 'New conversation via Web', description: 'Password reset request', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString() },
  ],
  'cust-3': [
    { id: 'ev3-1', type: 'conversation_started', platform: 'SLACK', title: 'New conversation via Slack', description: 'Product demo request', sentimentScore: 2.0, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
    { id: 'ev3-2', type: 'message', platform: 'SLACK', title: 'Demo scheduled', sentimentScore: 3.0, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString() },
    { id: 'ev3-3', type: 'conversation_resolved', platform: 'SLACK', title: 'Conversation resolved', description: 'Customer satisfied with demo', sentimentScore: 3.5, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString() },
  ],
  'cust-4': [
    { id: 'ev4-1', type: 'conversation_started', platform: 'TEAMS', title: 'New conversation via Teams', description: 'Enterprise pricing inquiry', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
    { id: 'ev4-2', type: 'message', platform: 'TEAMS', title: 'Pricing details shared', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4.5).toISOString() },
    { id: 'ev4-3', type: 'escalation', platform: 'TEAMS', title: 'Escalated to sales team', description: 'Customer interested in enterprise plan', sentimentScore: 1.0, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() },
    { id: 'ev4-4', type: 'conversation_started', platform: 'WHATSAPP', title: 'New conversation via WhatsApp', description: 'Quick question about features', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString() },
  ],
  'cust-5': [
    { id: 'ev5-1', type: 'escalation', platform: 'TELEGRAM', title: 'Urgent escalation', description: 'Customer extremely dissatisfied with service', sentimentScore: -4.5, createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
    { id: 'ev5-2', type: 'conversation_started', platform: 'TELEGRAM', title: 'New conversation via Telegram', description: 'Complaint about delayed order', sentimentScore: -3.0, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { id: 'ev5-3', type: 'conversation_started', platform: 'WEB', title: 'New conversation via Web', description: 'Initial product inquiry', sentimentScore: 0, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString() },
  ],
  'cust-6': [
    { id: 'ev6-1', type: 'conversation_started', platform: 'WHATSAPP', title: 'New conversation via WhatsApp', description: 'Product recommendation request', sentimentScore: 1.5, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
    { id: 'ev6-2', type: 'message', platform: 'WHATSAPP', title: 'Recommendations provided', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString() },
    { id: 'ev6-3', type: 'conversation_resolved', platform: 'WHATSAPP', title: 'Conversation resolved', description: 'Customer purchased recommended product', sentimentScore: 2.5, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 46).toISOString() },
  ],
};

export default function CustomerProfile() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Map of refs for customer list items for keyboard navigation focus management
  const customerItemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return mockCustomers;

    const query = searchQuery.toLowerCase();
    return mockCustomers.filter(customer => {
      const name = customer.name?.toLowerCase() || '';
      const email = customer.email?.toLowerCase() || '';
      const phone = customer.phone || '';
      return name.includes(query) || email.includes(query) || phone.includes(query);
    });
  }, [searchQuery]);

  // Get selected customer
  const selectedCustomer = useMemo(() => {
    return mockCustomers.find(c => c.id === selectedCustomerId) || null;
  }, [selectedCustomerId]);

  // Get timeline events for selected customer
  const timelineEvents = useMemo(() => {
    return selectedCustomerId ? (mockTimelineEvents[selectedCustomerId] || []) : [];
  }, [selectedCustomerId]);

  // Handle customer selection
  const handleSelectCustomer = useCallback((customerId: string) => {
    setSelectedCustomerId(customerId);
  }, []);

  // Handle keyboard navigation in customer list
  const handleKeyDown = useCallback((event: React.KeyboardEvent, customerId: string, index: number) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = Math.min(index + 1, filteredCustomers.length - 1);
      const nextCustomer = filteredCustomers[nextIndex];
      if (nextCustomer) {
        setSelectedCustomerId(nextCustomer.id);
        // Focus next item using ref
        customerItemRefs.current.get(nextIndex)?.focus();
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prevIndex = Math.max(index - 1, 0);
      const prevCustomer = filteredCustomers[prevIndex];
      if (prevCustomer) {
        setSelectedCustomerId(prevCustomer.id);
        // Focus previous item using ref
        customerItemRefs.current.get(prevIndex)?.focus();
      }
    }
  }, [filteredCustomers]);

  const displayName = selectedCustomer?.name || selectedCustomer?.email || selectedCustomer?.phone || 'Unknown Customer';
  const initials = displayName.charAt(0).toUpperCase();
  const customerSince = selectedCustomer ? safeParseDate(selectedCustomer.createdAt) : null;
  const sentimentTrend = selectedCustomer ? selectedCustomer.avgSentiment >= 0 : true;

  return (
    <div className="flex h-[calc(100vh-64px)] -m-6">
      {/* Customer List Sidebar */}
      <aside
        className="w-80 flex-shrink-0 border-r border-white/10 bg-black/20 backdrop-blur-sm flex flex-col"
        aria-label="Customer list"
      >
        {/* Search Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Customers</h2>
            <span className="ml-auto text-xs text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">
              {filteredCustomers.length}
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 placeholder-gray-500"
              aria-label="Search customers"
            />
          </div>
        </div>

        {/* Customer List */}
        <div
          className="flex-1 overflow-y-auto p-2 space-y-2"
          role="listbox"
          aria-label="Customer list"
        >
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No customers found</p>
              {searchQuery && (
                <p className="text-sm mt-1">Try a different search term</p>
              )}
            </div>
          ) : (
            filteredCustomers.map((customer, index) => (
              <div
                key={customer.id}
                ref={(el) => {
                  if (el) {
                    customerItemRefs.current.set(index, el);
                  } else {
                    customerItemRefs.current.delete(index);
                  }
                }}
                tabIndex={0}
                role="option"
                aria-selected={selectedCustomerId === customer.id}
                onKeyDown={(e) => handleKeyDown(e, customer.id, index)}
              >
                <CustomerCard
                  customer={customer}
                  isSelected={selectedCustomerId === customer.id}
                  onClick={() => handleSelectCustomer(customer.id)}
                />
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Customer Detail View */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!selectedCustomer ? (
          // Empty state
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Customer Selected</h3>
              <p className="text-sm">Select a customer from the list to view their profile</p>
            </div>
          </div>
        ) : (
          <>
            {/* Customer Header */}
            <header className="p-6 border-b border-white/10 bg-black/20 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                {selectedCustomer.avatarUrl ? (
                  <img
                    src={selectedCustomer.avatarUrl}
                    alt={displayName}
                    className="h-16 w-16 rounded-full"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/50 to-purple-500/50 flex items-center justify-center text-2xl font-bold">
                    {initials}
                  </div>
                )}

                {/* Customer Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold truncate">{displayName}</h1>

                  {/* Contact Info */}
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-400">
                    {selectedCustomer.email && (
                      <a
                        href={`mailto:${selectedCustomer.email}`}
                        className="flex items-center gap-1.5 hover:text-primary transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                        {selectedCustomer.email}
                      </a>
                    )}
                    {selectedCustomer.phone && (
                      <a
                        href={`tel:${selectedCustomer.phone}`}
                        className="flex items-center gap-1.5 hover:text-primary transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                        {selectedCustomer.phone}
                      </a>
                    )}
                    {customerSince && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        Customer since {format(customerSince, 'MMM yyyy')}
                      </span>
                    )}
                  </div>

                  {/* Platform Identities */}
                  <div className="mt-3">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Connected Platforms
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCustomer.identities.map((identity) => (
                        <div
                          key={`${identity.platform}-${identity.platformUserId}`}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm"
                        >
                          <span
                            role="img"
                            aria-label={platformNames[identity.platform] || identity.platform}
                          >
                            {platformIcons[identity.platform]}
                          </span>
                          <span className="text-gray-300">
                            {platformNames[identity.platform] || identity.platform}
                          </span>
                          {identity.platformUsername && (
                            <span className="text-gray-500">
                              @{identity.platformUsername}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
                    <MessageCircle className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">{selectedCustomer.totalConversations}</span>
                    <span className="text-xs text-gray-500">conversations</span>
                  </div>

                  <div className={cn(
                    'flex items-center gap-2 px-3 py-2 border rounded-lg',
                    sentimentTrend
                      ? 'bg-green-500/10 border-green-500/30 text-green-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  )}>
                    {sentimentTrend ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">
                      {selectedCustomer.avgSentiment.toFixed(1)}
                    </span>
                    <span className="text-xs opacity-70">avg sentiment</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Activity Timeline */}
            <section className="flex-1 overflow-y-auto p-6">
              <h2 className="text-lg font-semibold mb-4">Activity Timeline</h2>
              <CustomerTimeline events={timelineEvents} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
