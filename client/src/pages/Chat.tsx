import React, { useState, useEffect, useRef } from 'react';
import { Send, Cpu, Bot, User } from 'lucide-react';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const Chat = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Neural interface initialized. How can I assist you with the integration system today?',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Direct API call to the backend message endpoint
      // Assuming we treat this "web chat" as another platform or use a specific endpoint
      // For now, simulating response or using the generic message endpoint if applicable
      // But looking at server.ts, /api/message requires platform, chatId, text.
      // We'll mock it for the UI demo or implement a loopback.

      // Simulating a delay for "thinking"
      setTimeout(() => {
        const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `I've processed your request: "${userMsg.content}". (Note: Connect this to the real backend logic in production)`,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
      }, 1500);

    } catch (error) {
      console.error(error);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Neural Chat Interface
        </h1>
        <p className="text-gray-400">Direct uplink to the core AI model</p>
      </div>

      <div className="flex-1 bg-glass border border-glass-border rounded-xl overflow-hidden flex flex-col relative">
        {/* Terminal Header */}
        <div className="h-8 bg-black/50 border-b border-glass-border flex items-center px-4 gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500/50" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
            <div className="h-3 w-3 rounded-full bg-green-500/50" />
            <span className="ml-2 text-xs font-mono text-gray-500">root@nexus-ai:~</span>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm">
            {messages.map((msg) => (
                <div
                    key={msg.id}
                    className={cn(
                        "flex gap-4 max-w-3xl",
                        msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                    )}
                >
                    <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border",
                        msg.role === 'assistant'
                            ? "bg-primary/10 border-primary/30 text-primary"
                            : "bg-secondary/10 border-secondary/30 text-secondary"
                    )}>
                        {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                    </div>

                    <div className={cn(
                        "p-3 rounded-lg border",
                        msg.role === 'assistant'
                            ? "bg-black/40 border-primary/20 text-gray-200"
                            : "bg-secondary/5 border-secondary/20 text-gray-200"
                    )}>
                        <p>{msg.content}</p>
                        <span className="text-[10px] text-gray-600 block mt-2">
                            {msg.timestamp.toLocaleTimeString()}
                        </span>
                    </div>
                </div>
            ))}

            {isTyping && (
                <div className="flex gap-4 max-w-3xl">
                     <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 border bg-primary/10 border-primary/30 text-primary">
                        <Cpu size={16} className="animate-spin" />
                    </div>
                    <div className="flex items-center gap-1 h-8">
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
                    </div>
                </div>
            )}
            <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black/30 border-t border-glass-border">
            <form onSubmit={handleSend} className="flex gap-4">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter command or query..."
                    className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 font-mono transition-all"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 px-6 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <span className="hidden sm:inline">TRANSMIT</span>
                    <Send size={18} />
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
