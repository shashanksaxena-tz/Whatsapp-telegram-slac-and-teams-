import { create } from 'zustand';

export type EscalationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Escalation {
  id: string;
  conversationId: string;
  severity: EscalationSeverity;
  customerName: string;
  platform: string;
  lastMessage: string;
  sentimentScore: number;
  emotion: string;
  waitTime: number;
  createdAt: string;
}

export interface LiveConversation {
  id: string;
  customerId: string;
  customerName: string;
  platform: string;
  agentId?: string;
  agentName?: string;
  lastMessage: string;
  sentimentScore: number;
  status: string;
  isTyping: boolean;
  updatedAt: string;
}

export interface RealtimeState {
  escalationQueue: Escalation[];
  liveConversations: Map<string, LiveConversation>;
  wsConnected: boolean;

  setEscalationQueue: (queue: Escalation[]) => void;
  addEscalation: (escalation: Escalation) => void;
  removeEscalation: (id: string) => void;
  updateEscalation: (id: string, updates: Partial<Escalation>) => void;

  setLiveConversation: (conv: LiveConversation) => void;
  removeLiveConversation: (id: string) => void;

  setWsConnected: (connected: boolean) => void;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  escalationQueue: [],
  liveConversations: new Map(),
  wsConnected: false,

  setEscalationQueue: (queue) => set({ escalationQueue: queue }),

  addEscalation: (escalation) => set((state) => ({
    escalationQueue: [escalation, ...state.escalationQueue].sort(
      (a, b) => {
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
    ),
  })),

  removeEscalation: (id) => set((state) => ({
    escalationQueue: state.escalationQueue.filter((e) => e.id !== id),
  })),

  updateEscalation: (id, updates) => set((state) => ({
    escalationQueue: state.escalationQueue.map((e) =>
      e.id === id ? { ...e, ...updates } : e
    ),
  })),

  setLiveConversation: (conv) => set((state) => {
    const newMap = new Map(state.liveConversations);
    newMap.set(conv.id, conv);
    return { liveConversations: newMap };
  }),

  removeLiveConversation: (id) => set((state) => {
    const newMap = new Map(state.liveConversations);
    newMap.delete(id);
    return { liveConversations: newMap };
  }),

  setWsConnected: (connected) => set({ wsConnected: connected }),
}));
