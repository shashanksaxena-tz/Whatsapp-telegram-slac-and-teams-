import React, { useEffect, useState } from 'react';
import { MessageCircle, Send, Slack, Command } from 'lucide-react';
import StatusCard from '../components/dashboard/StatusCard';
import NeuralNetwork from '../components/dashboard/NeuralNetwork';

const Dashboard = () => {
  // Mock data for now, real data will come from API
  const [platforms, setPlatforms] = useState({
    whatsapp: { enabled: false, status: 'offline' },
    telegram: { enabled: true, status: 'online' },
    slack: { enabled: false, status: 'offline' },
    teams: { enabled: false, status: 'offline' },
  });

  useEffect(() => {
    // Fetch real status
    fetch('/api/platforms')
      .then(res => res.json())
      .then(data => {
          // Map backend response to UI state
          setPlatforms({
              whatsapp: { enabled: data.whatsapp.enabled, status: data.whatsapp.enabled ? 'online' : 'offline' },
              telegram: { enabled: data.telegram.enabled, status: data.telegram.enabled ? 'online' : 'offline' },
              slack: { enabled: data.slack.enabled, status: data.slack.enabled ? 'online' : 'offline' },
              teams: { enabled: data.teams.enabled, status: data.teams.enabled ? 'online' : 'offline' },
          });
      })
      .catch(err => console.error("Failed to fetch status", err));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            System Overview
          </h1>
          <p className="text-gray-400 mt-1">Real-time neural bridge monitoring</p>
        </div>
        <div className="text-right">
            <div className="text-xs text-primary font-mono animate-pulse">LIVE FEED ACTIVE</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="WhatsApp"
          status={platforms.whatsapp.status as any}
          icon={MessageCircle}
          description="Business API Integration"
          ping={45}
        />
        <StatusCard
          title="Telegram"
          status={platforms.telegram.status as any}
          icon={Send}
          description="Bot API Gateway"
          ping={23}
        />
        <StatusCard
          title="Slack"
          status={platforms.slack.status as any}
          icon={Slack}
          description="Workspace Events"
          ping={120}
        />
        <StatusCard
          title="Teams"
          status={platforms.teams.status as any}
          icon={Command}
          description="Azure Bot Service"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <NeuralNetwork />

          <div className="bg-glass border border-glass-border rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">Recent Ingestions</h3>
            <div className="space-y-2 font-mono text-sm">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded transition-colors">
                        <span className="text-gray-500">10:42:0{i}</span>
                        <span className="text-secondary">[INTENT_RECOGNIZED]</span>
                        <span className="text-gray-300">User request processed via Telegram</span>
                    </div>
                ))}
            </div>
          </div>
        </div>

        <div className="bg-glass border border-glass-border rounded-xl p-6">
           <h3 className="text-lg font-bold mb-4">System Health</h3>
           <div className="space-y-6">
             {/* Mock Health Bars */}
             <div>
               <div className="flex justify-between text-sm mb-1">
                 <span className="text-gray-400">CPU Usage</span>
                 <span className="text-primary">12%</span>
               </div>
               <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                 <div className="h-full bg-primary w-[12%] rounded-full shadow-[0_0_10px_theme('colors.primary.DEFAULT')]" />
               </div>
             </div>

             <div>
               <div className="flex justify-between text-sm mb-1">
                 <span className="text-gray-400">Memory</span>
                 <span className="text-secondary">48%</span>
               </div>
               <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                 <div className="h-full bg-secondary w-[48%] rounded-full shadow-[0_0_10px_theme('colors.secondary.DEFAULT')]" />
               </div>
             </div>

             <div>
               <div className="flex justify-between text-sm mb-1">
                 <span className="text-gray-400">API Quota</span>
                 <span className="text-accent">65%</span>
               </div>
               <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                 <div className="h-full bg-accent w-[65%] rounded-full shadow-[0_0_10px_theme('colors.accent.DEFAULT')]" />
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
