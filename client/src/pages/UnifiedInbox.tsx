import React, { useState, useMemo } from 'react';
import { ConversationList } from '../components/inbox/ConversationList';
import { type Conversation } from '../components/inbox/ConversationItem';
import { MessageThread } from '../components/inbox/MessageThread';
import { ReplyBox } from '../components/inbox/ReplyBox';
import { type Message } from '../components/inbox/MessageBubble';

// Mock conversations data
const mockConversations: Conversation[] = [
  {
    id: '1',
    customerId: 'c1',
    customerName: 'John Doe',
    platform: 'WHATSAPP',
    status: 'OPEN',
    lastMessage: 'I need help with my order #12345',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    unreadCount: 3,
    sentimentScore: -1.5,
  },
  {
    id: '2',
    customerId: 'c2',
    customerName: 'Sarah Miller',
    platform: 'SLACK',
    status: 'PENDING',
    lastMessage: 'When will my refund be processed?',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    unreadCount: 1,
    sentimentScore: -2.5,
    assignedAgentName: 'Mike T.',
  },
  {
    id: '3',
    customerId: 'c3',
    customerName: 'Alex Johnson',
    platform: 'TELEGRAM',
    status: 'OPEN',
    lastMessage: 'Thanks for the quick response!',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    unreadCount: 0,
    sentimentScore: 2.0,
  },
  {
    id: '4',
    customerId: 'c4',
    customerName: 'Emily Chen',
    platform: 'TEAMS',
    status: 'RESOLVED',
    lastMessage: 'That solved my issue, thank you!',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    unreadCount: 0,
    sentimentScore: 3.0,
  },
  {
    id: '5',
    customerId: 'c5',
    customerName: 'Chris Wilson',
    platform: 'WHATSAPP',
    status: 'OPEN',
    lastMessage: 'This is unacceptable! I demand a full refund immediately!',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    unreadCount: 5,
    sentimentScore: -4.5,
  },
];

// Mock messages for selected conversation
const mockMessagesMap: Record<string, Message[]> = {
  '1': [
    { id: 'm1', conversationId: '1', senderType: 'customer', content: 'Hi, I placed an order yesterday but haven\'t received any confirmation.', sentimentScore: -0.5, emotion: 'worried', createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
    { id: 'm2', conversationId: '1', senderType: 'bot', senderName: 'Support Bot', content: 'Hello! I\'m here to help. Let me look up your order. Could you provide your order number?', createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString() },
    { id: 'm3', conversationId: '1', senderType: 'customer', content: 'It\'s order #12345', sentimentScore: 0, emotion: 'neutral', createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString() },
    { id: 'm4', conversationId: '1', senderType: 'agent', senderName: 'Support Agent', content: 'I found your order! It was processed successfully. Your confirmation email may have gone to spam. I\'ll resend it now.', createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString() },
    { id: 'm5', conversationId: '1', senderType: 'customer', content: 'I need help with my order #12345', sentimentScore: -1.5, emotion: 'frustrated', createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  ],
  '5': [
    { id: 'm10', conversationId: '5', senderType: 'customer', content: 'I ordered a product 2 weeks ago and it still hasn\'t arrived!', sentimentScore: -3, emotion: 'angry', createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { id: 'm11', conversationId: '5', senderType: 'bot', senderName: 'Support Bot', content: 'I apologize for the delay. Let me check the status of your order right away.', createdAt: new Date(Date.now() - 1000 * 60 * 28).toISOString() },
    { id: 'm12', conversationId: '5', senderType: 'customer', content: 'This is unacceptable! I demand a full refund immediately!', sentimentScore: -4.5, emotion: 'angry', createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString() },
  ],
};

const quickReplies = [
  { id: 'qr1', label: 'Greeting', content: 'Hello! Thank you for reaching out. How can I help you today?' },
  { id: 'qr2', label: 'Checking', content: 'Let me check that for you. Please hold on a moment.' },
  { id: 'qr3', label: 'Apologize', content: 'I sincerely apologize for any inconvenience this may have caused.' },
  { id: 'qr4', label: 'Resolved', content: 'I\'m glad we could resolve this for you. Is there anything else I can help with?' },
];

export default function UnifiedInbox() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedConversation = useMemo(() => {
    return mockConversations.find(c => c.id === selectedId) || null;
  }, [selectedId]);

  const messages = useMemo(() => {
    return selectedId ? (mockMessagesMap[selectedId] || []) : [];
  }, [selectedId]);

  // Simulate AI suggestion based on last customer message
  const aiSuggestion = useMemo(() => {
    if (!selectedConversation) return undefined;
    if (selectedConversation.sentimentScore <= -3) {
      return "I completely understand your frustration, and I sincerely apologize for this experience. Let me personally look into this matter and find a resolution for you right away.";
    }
    if (selectedConversation.sentimentScore < 0) {
      return "I understand this situation is concerning. Let me help you get this resolved as quickly as possible.";
    }
    return undefined;
  }, [selectedConversation]);

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
  };

  const handleSendMessage = async (content: string) => {
    console.log('Sending message:', content);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  return (
    <div className="flex h-[calc(100vh-64px)] -m-6">
      {/* Conversation List */}
      <div className="w-80 flex-shrink-0">
        <ConversationList
          conversations={mockConversations}
          selectedId={selectedId}
          onSelect={handleSelectConversation}
          isLoading={isLoading}
        />
      </div>

      {/* Message Thread and Reply */}
      <div className="flex-1 flex flex-col min-w-0">
        <MessageThread
          conversation={selectedConversation}
          messages={messages}
          isLoading={isLoading}
        />

        {selectedConversation && (
          <ReplyBox
            onSend={handleSendMessage}
            quickReplies={quickReplies}
            aiSuggestion={aiSuggestion}
            placeholder={`Reply to ${selectedConversation.customerName}...`}
          />
        )}
      </div>
    </div>
  );
}
