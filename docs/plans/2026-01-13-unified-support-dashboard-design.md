# Unified Customer Support Dashboard - Design Document

**Date:** 2026-01-13
**Status:** Approved
**Author:** Design Brainstorm Session

---

## Executive Summary

A comprehensive customer support dashboard that unifies WhatsApp, Telegram, Slack, and Microsoft Teams into a single interface with AI-powered sentiment analysis and tiered escalation workflows.

### Key Decisions

| Decision | Choice |
|----------|--------|
| Target Users | Agents, Managers, Admins (3-tier hierarchy) |
| Core Features | Command Center, Unified Inbox, Live Monitoring, Analytics |
| Build Priority | Escalation-first (Sentiment → Inbox → Live → Analytics) |
| Design Theme | Professional dark with adaptive light mode option |
| Escalation Model | Tiered (Low→queue, Med→alert, High→auto-assign+manager) |
| Cross-platform View | Unified thread within customer profile |
| Notifications | Configurable per user |
| Data Retention | Tiered (hot/warm/cold) + GDPR compliance |
| Architecture | Monolithic React dashboard |

---

## 1. Page Structure & Navigation

### Main Navigation (Sidebar)

```
NEXUS SUPPORT
─────────────
📊 Command Center     ← Sentiment/Escalation
📥 Inbox              ← Unified message queue
💬 Live Conversations ← Real-time monitoring
👤 Customers          ← Customer profiles
📈 Analytics          ← Reports & metrics
─────────────
⚙️  Settings
👥 Team (Admin only)
─────────────
🌙/☀️ Theme Toggle
🔔 Notification Prefs
```

### Role-Based Visibility

| Page | Agent | Manager | Admin |
|------|-------|---------|-------|
| Command Center | View assigned | View all + assign | Full control |
| Inbox | Personal queue | Team queues | All queues |
| Live Conversations | Own chats | Team chats | All chats |
| Customers | View only | View + notes | Full CRUD |
| Analytics | Personal stats | Team stats | Org-wide |
| Team Management | ❌ | View team | Full CRUD |

### URL Structure

```
/                    → Redirects based on role
/command-center      → Escalation dashboard
/inbox               → Unified inbox
/conversations       → Live monitoring
/conversations/:id   → Single conversation view
/customers           → Customer list
/customers/:id       → Customer profile
/analytics           → Reports dashboard
/settings            → User preferences
/admin/team          → Team management (admin)
```

---

## 2. Command Center (Escalation Dashboard)

### Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│  COMMAND CENTER                                    [Filter ▼] [Today ▼]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                  │
│  │ 🔴 12    │ │ 🟠 34    │ │ 🟡 89    │ │ 🟢 156   │   ← KPI Cards    │
│  │ Critical │ │ High     │ │ Medium   │ │ Resolved │                  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                  │
│                                                                        │
│  ┌─────────────────────────────────┐ ┌────────────────────────────┐   │
│  │  PRIORITY QUEUE                 │ │  SENTIMENT HEATMAP         │   │
│  │  ───────────────                │ │  ────────────────          │   │
│  │  🔴 John D. - WhatsApp    2m    │ │  [Platform × Hour grid]    │   │
│  │     "This is unacceptable..."   │ │                            │   │
│  │     Sentiment: -4.2 | Angry     │ │  WhatsApp  ██░░██████░░    │   │
│  │     [View] [Assign] [Escalate]  │ │  Telegram  ░░██░░████░░    │   │
│  │  ───────────────                │ │  Slack     ████░░░░████    │   │
│  │  🟠 Sarah M. - Slack      5m    │ │  Teams     ░░░░██████░░    │   │
│  │     ...                         │ │                            │   │
│  └─────────────────────────────────┘ └────────────────────────────┘   │
│                                                                        │
│  ┌─────────────────────────────────┐ ┌────────────────────────────┐   │
│  │  ESCALATION TIMELINE            │ │  LIVE SENTIMENT FEED       │   │
│  │  [========== Today ==========]  │ │  10:42 WhatsApp ↓ -3.1     │   │
│  │  09:00 ●───●─●─────●●──●───●    │ │  10:41 Telegram ↑ +2.4     │   │
│  └─────────────────────────────────┘ └────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Priority Queue Behavior

| Severity | Trigger Condition | Auto-Action |
|----------|------------------|-------------|
| 🔴 Critical | Sentiment ≤ -4 OR emotion = "angry" | Auto-assign + Manager alert + Sound |
| 🟠 High | Sentiment ≤ -2 OR emotion = "frustrated" | Push notification to available agents |
| 🟡 Medium | Sentiment < 0 | Added to queue, no alert |
| 🟢 Resolved | Sentiment improved to ≥ 0 after handling | Auto-close after confirmation |

### Real-time Updates

- WebSocket connection for live sentiment feed
- Queue auto-refreshes every 5 seconds
- New critical items trigger browser notification + optional sound

---

## 3. Unified Inbox

### Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│  INBOX                         [All ▼] [All Platforms ▼] [Search... 🔍]│
├───────────────────┬────────────────────────────────────────────────────┤
│  CONVERSATIONS    │  CONVERSATION DETAIL                               │
│  ─────────────    │  ────────────────────                              │
│                   │                                                    │
│  ┌─────────────┐  │  ┌─ Customer Header ─────────────────────────────┐│
│  │ ● John D.   │  │  │ John Doe          [WhatsApp]  [View Profile]  ││
│  │   WhatsApp  │  │  │ Sentiment: 🔴 -3.2 Angry    Since: 10 min ago ││
│  │   "This is..│◀─│  └───────────────────────────────────────────────┘│
│  │   2m ago 🔴 │  │                                                    │
│  └─────────────┘  │  ┌─ Message Thread ──────────────────────────────┐│
│                   │  │  [10:30] 👤 John: I ordered 3 days ago...     ││
│  ┌─────────────┐  │  │  [10:31] 🤖 Bot: Let me check...              ││
│  │   Sarah M.  │  │  │  [10:32] 👤 John: This is unacceptable!       ││
│  │   Slack     │  │  │  📊 Sentiment: -4.2 | Emotion: Angry          ││
│  │   5m ago 🟠 │  │  │  [10:35] 👨‍💼 Agent (You): I apologize...       ││
│  └─────────────┘  │  └────────────────────────────────────────────────┘│
│                   │                                                    │
│                   │  ┌─ Reply Box ────────────────────────────────────┐│
│                   │  │ [Type your response...]                        ││
│                   │  │ [📎 Attach] [📝 Templates] [🤖 AI Suggest]     ││
│                   │  │                          [Send via WhatsApp ▼] ││
│                   │  └─────────────────────────────────────────────────┘│
└───────────────────┴────────────────────────────────────────────────────┘
```

### Features

| Feature | Description |
|---------|-------------|
| Filters | By status (Open/Pending/Resolved), platform, sentiment, assigned agent |
| Sorting | By time, sentiment severity, wait time |
| Quick Actions | Assign, snooze, mark resolved, escalate |
| AI Suggest | Button that generates response suggestion based on context |
| Templates | Saved response templates with variable substitution |

### Conversation List Item States

```
● Blue dot    = Unread messages
🔴 Red badge  = Critical sentiment
🟠 Orange     = High priority
🟡 Yellow     = Medium
🟢 Green      = Positive/Resolved
⏸️ Gray       = Snoozed
```

---

## 4. Customer Profile

### Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│  ← Back to Customers                                    [Edit] [Export]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─ Profile Header ──────────────────────────────────────────────────┐│
│  │  👤 John Doe                                                       ││
│  │  john.doe@email.com │ +1 555-123-4567                             ││
│  │                                                                    ││
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                      ││
│  │  │WhatsApp│ │Telegram│ │ Slack  │ │ Teams  │  ← Connected accounts││
│  │  │   ✓    │ │   ✓    │ │   ✗    │ │   ✗    │                      ││
│  │  └────────┘ └────────┘ └────────┘ └────────┘                      ││
│  └────────────────────────────────────────────────────────────────────┘│
│                                                                        │
│  ┌─ Stats Row ───────────────────────────────────────────────────────┐│
│  │  Total Chats: 12 │ Avg Sentiment: -0.8 │ Last Contact: 2h ago     ││
│  │  Resolution Rate: 83% │ Escalations: 3 │ Lifetime: 4 months       ││
│  └────────────────────────────────────────────────────────────────────┘│
│                                                                        │
│  ┌─ Tabs ────────────────────────────────────────────────────────────┐│
│  │  [Timeline] [Conversations] [Sentiment History] [Notes] [GDPR]    ││
│  └────────────────────────────────────────────────────────────────────┘│
│                                                                        │
│  ┌─ Unified Timeline ────────────────────────────────────────────────┐│
│  │  Today                                                             ││
│  │  10:42  📱 WhatsApp  "This is unacceptable..."        🔴 -4.2     ││
│  │  Yesterday                                                         ││
│  │  14:20  ✈️ Telegram  "Thanks for the update!"         🟢 +2.8     ││
│  └────────────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────┘
```

### Tab Contents

| Tab | Description |
|-----|-------------|
| Timeline | Unified chronological view of all interactions across platforms |
| Conversations | List of individual conversation threads |
| Sentiment History | Line chart showing sentiment trend over time |
| Notes | Internal notes from agents (not visible to customer) |
| GDPR | Data export button + deletion request workflow |

### Customer Identification

Customers are linked across platforms via:
1. Email match
2. Phone match
3. Manual merge by agent
4. AI-suggested matches for review

---

## 5. Live Conversations

### Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│  LIVE CONVERSATIONS                    [All Agents ▼] [All Platforms ▼]│
│  ● 23 Active Now                                                       │
├────────────────────────────────────────────────────────────────────────┤
│  ┌─ Active Conversations Grid ───────────────────────────────────────┐│
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ ││
│  │  │ 📱 WhatsApp      │  │ ✈️ Telegram       │  │ 💼 Slack         │ ││
│  │  │ John D. ↔ Sarah  │  │ Mike T. ↔ Bot    │  │ Lisa K. ↔ James  │ ││
│  │  │ "I want a refund"│  │ "How do I reset..│  │ "The API is down"│ ││
│  │  │ 🔴 -4.2  ⏱️ 12m  │  │ 🟢 +1.1  ⏱️ 3m  │  │ 🟠 -2.0  ⏱️ 8m  │ ││
│  │  │ [👁️ Watch] [Join]│  │ [👁️ Watch]       │  │ [👁️ Watch] [Join]│ ││
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘ ││
│  └────────────────────────────────────────────────────────────────────┘│
│                                                                        │
│  ┌─ Watch Mode (Expanded) ───────────────────────────────────────────┐│
│  │  👁️ Watching: John D. ↔ Sarah (WhatsApp)           [× Close Watch]││
│  │  [10:42] John: I want a refund now!                               ││
│  │  [10:43] Sarah: I understand your frustration...                  ││
│  │  [10:44] Sarah: (typing...)                          ● Live       ││
│  │  ─────────────────────────────────────────────────────────────────││
│  │  [💬 Whisper to Agent] [🚨 Take Over] [📝 Add Note]               ││
│  └────────────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────┘
```

### Manager/Admin Actions

| Action | Description | Who Can Use |
|--------|-------------|-------------|
| Watch | Silent observation of live conversation | Manager, Admin |
| Whisper | Send private message to agent (customer can't see) | Manager, Admin |
| Take Over | Transfer conversation to yourself | Manager, Admin |
| Join | Enter as second agent (customer sees both) | Agent, Manager, Admin |
| Add Note | Add internal note to conversation | All roles |

### Real-time Indicators

```
● Green pulse  = Actively typing
○ Gray         = Idle > 2 min
⚠️ Yellow      = Customer waiting > 5 min (SLA warning)
🔴 Red flash   = Sentiment dropping rapidly
```

---

## 6. Analytics Dashboard

### Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│  ANALYTICS                    [Last 7 Days ▼] [All Platforms ▼] [Export]│
├────────────────────────────────────────────────────────────────────────┤
│  ┌─ KPI Cards ───────────────────────────────────────────────────────┐│
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  ││
│  │  │ 1,247       │ │ 94.2%       │ │ 2m 34s      │ │ +0.8        │  ││
│  │  │ Total Chats │ │ Resolution  │ │ Avg Response│ │ Avg Sentiment│  ││
│  │  │ ↑ 12% ▲     │ │ ↑ 3% ▲      │ │ ↓ 15% ▼     │ │ ↑ 0.3 ▲     │  ││
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  ││
│  └────────────────────────────────────────────────────────────────────┘│
│                                                                        │
│  ┌─ Sentiment Trend ─────────────────┐ ┌─ Volume by Platform ────────┐│
│  │  [Line chart over time]           │ │  [Donut chart]              ││
│  │  ── Avg  ── Positive  ── Negative │ │  WhatsApp 42% Telegram 28%  ││
│  └───────────────────────────────────┘ │  Slack 18%    Teams 12%     ││
│                                        └─────────────────────────────┘│
│  ┌─ Escalation Funnel ───────────────┐ ┌─ Agent Leaderboard ─────────┐│
│  │  Total Conversations    1,247     │ │  1. Sarah J.  ⭐ 98.2%  234 ││
│  │  Negative Sentiment       312     │ │  2. David L.  ⭐ 96.8%  198 ││
│  │  Escalated to Agent       89      │ │  3. Emma K.   ⭐ 95.4%  187 ││
│  │  Escalated to Manager     12      │ │  [Resolution %] [Volume]    ││
│  └───────────────────────────────────┘ └─────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────┘
```

### Report Types

| Report | Metrics Included | Export Formats |
|--------|-----------------|----------------|
| Executive Summary | KPIs, trends, highlights | PDF, Email |
| Sentiment Report | Emotion breakdown, escalation rate | CSV, PDF |
| Agent Performance | Response time, resolution rate | CSV, PDF |
| Platform Breakdown | Volume, sentiment per platform | CSV, PDF |
| SLA Compliance | Response time vs targets | CSV, PDF |

### Role-Based Views

| Role | Default View | Available Data |
|------|-------------|----------------|
| Agent | Personal stats + team comparison | Own metrics only |
| Manager | Team dashboard + drill-down | Team metrics |
| Admin | Org-wide + comparisons | All data |

---

## 7. Settings & Preferences

### Notification Preferences

```
In-App Notifications
┌───────────────────────────────────────────┐
│ 🔴 Critical Escalations    [On ●    Off] │
│ 🟠 High Priority           [On ●    Off] │
│ 🟡 New Assignments         [On ●    Off] │
│ 💬 New Messages            [On ●    Off] │
│ 📊 Daily Summary           [On ●    Off] │
└───────────────────────────────────────────┘

Browser Notifications
┌───────────────────────────────────────────┐
│ Enable browser push        [On ●    Off] │
│ Only when tab inactive     [  ●  On Off] │
└───────────────────────────────────────────┘

External Notifications
┌───────────────────────────────────────────┐
│ Email for critical only    [On ●    Off] │
│ Slack webhook              [Configure]   │
│ Teams webhook              [Configure]   │
└───────────────────────────────────────────┘
```

### Theme Options

```
Theme Mode
┌────────┐ ┌────────┐ ┌────────┐
│  🌙    │ │  ☀️    │ │  🔄    │
│  Dark  │ │  Light │ │  Auto  │
└────────┘ └────────┘ └────────┘

Auto switches at: [Sunset/Sunrise] or custom times
```

### Settings Sections

| Section | Contents |
|---------|----------|
| Profile | Name, email, avatar, password |
| Notifications | All notification preferences |
| Appearance | Theme, density, accent color |
| Sounds | Alert sounds, volume, quiet hours |
| Templates | Saved response templates |
| Team (Admin) | User management, roles |
| Integrations | API keys, webhooks |
| Data/GDPR | Export data, request deletion |

---

## 8. Technical Architecture

### Frontend Component Structure

```
client/src/
├── components/
│   ├── common/           # Button, Card, Badge, Modal, Toast, ThemeProvider
│   ├── layout/           # Sidebar, Header, DashboardLayout
│   ├── command-center/   # PriorityQueue, SentimentHeatmap, LiveFeed
│   ├── inbox/            # ConversationList, ConversationDetail, ReplyBox
│   ├── customers/        # CustomerList, CustomerProfile, UnifiedTimeline
│   ├── live/             # ConversationGrid, WatchPanel, WhisperInput
│   └── analytics/        # KPICards, SentimentTrend, AgentLeaderboard
├── pages/
│   ├── CommandCenter.tsx
│   ├── Inbox.tsx
│   ├── LiveConversations.tsx
│   ├── Customers.tsx
│   ├── CustomerDetail.tsx
│   ├── Analytics.tsx
│   └── Settings.tsx
├── hooks/
│   ├── useWebSocket.ts
│   ├── useAuth.ts
│   ├── useNotifications.ts
│   └── useTheme.ts
├── stores/
│   └── index.ts          # Zustand store
└── lib/
    ├── api.ts
    ├── socket.ts
    └── utils.ts
```

### Database Schema (PostgreSQL)

```sql
-- Users & Auth
users (id, email, name, role, avatar_url, created_at)
user_preferences (user_id, notifications_json, theme, sounds_json)

-- Customers
customers (id, email, phone, name, created_at, merged_into_id)
customer_identities (id, customer_id, platform, platform_user_id)

-- Conversations
conversations (id, customer_id, platform, status, assigned_agent_id,
               created_at, updated_at, resolved_at)

-- Messages
messages (id, conversation_id, sender_type, sender_id, content,
          sentiment_score, emotion, platform_message_id, created_at)

-- Escalations
escalations (id, conversation_id, severity, triggered_by,
             assigned_to, resolved_at, created_at)

-- Notes & Templates
internal_notes (id, conversation_id, user_id, content, created_at)
response_templates (id, user_id, title, content, is_global)

-- Analytics (materialized)
daily_metrics (date, platform, total_conversations, avg_sentiment,
               resolution_rate, avg_response_time_seconds)
```

### API Endpoints

```
Authentication
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

Conversations
GET    /api/conversations
GET    /api/conversations/:id
POST   /api/conversations/:id/assign
POST   /api/conversations/:id/resolve
POST   /api/conversations/:id/reply

Customers
GET    /api/customers
GET    /api/customers/:id
POST   /api/customers/:id/merge
DELETE /api/customers/:id

Escalations
GET    /api/escalations
POST   /api/escalations/:id/assign
POST   /api/escalations/:id/resolve

Analytics
GET    /api/analytics/summary
GET    /api/analytics/sentiment
GET    /api/analytics/agents
GET    /api/analytics/export

Real-time
WS     /ws
```

### State Management (Zustand)

```typescript
interface AppStore {
  // Auth
  user: User | null;
  role: 'agent' | 'manager' | 'admin';

  // Real-time
  liveConversations: Map<string, Conversation>;
  escalationQueue: Escalation[];

  // Preferences
  theme: 'dark' | 'light' | 'auto';
  notifications: NotificationPrefs;

  // Actions
  assignConversation: (id: string, agentId: string) => void;
  resolveEscalation: (id: string) => void;
}
```

---

## Implementation Prerequisites

Before implementation, the following must be completed:

1. **Merge `copilot/check-mock-implementations` branch** - Brings sentiment analyzer, voice transcription, vector memory
2. **Set up PostgreSQL** - Database for conversation persistence
3. **Add authentication system** - JWT-based auth with role management
4. **Set up WebSocket server** - For real-time updates

---

## Build Priority Order

1. **Phase 1: Sentiment Command Center** (Core differentiator)
   - Priority queue with sentiment-based sorting
   - Sentiment heatmap
   - Real-time feed
   - Tiered escalation logic

2. **Phase 2: Unified Inbox**
   - Conversation list with filters
   - Message thread view
   - Reply functionality
   - AI suggest integration

3. **Phase 3: Live Monitoring**
   - Active conversations grid
   - Watch mode
   - Whisper functionality
   - Real-time indicators

4. **Phase 4: Analytics**
   - KPI dashboard
   - Sentiment trends
   - Agent performance
   - Export functionality

---

## Success Criteria

- [ ] All 4 platforms connected and receiving messages
- [ ] Sentiment analysis running on all incoming messages
- [ ] Tiered escalation routing working correctly
- [ ] Customer profiles merging cross-platform identities
- [ ] Real-time updates via WebSocket
- [ ] Role-based access control enforced
- [ ] GDPR export/deletion functional
- [ ] Analytics dashboards with accurate metrics
