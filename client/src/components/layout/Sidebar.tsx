import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Settings, Activity, BrainCircuit } from 'lucide-react';
import { cn } from '../../lib/utils';

const Sidebar = () => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: MessageSquare, label: 'Neural Chat', path: '/chat' },
    { icon: Activity, label: 'Live Logs', path: '/logs' },
    { icon: Settings, label: 'System Config', path: '/settings' },
  ];

  return (
    <div className="h-screen w-20 lg:w-64 bg-surface/50 border-r border-glass-border backdrop-blur-xl flex flex-col transition-all duration-300 z-50">
      <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-glass-border">
        <BrainCircuit className="h-8 w-8 text-primary animate-pulse-slow" />
        <span className="hidden lg:block ml-3 font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          NEXUS
        </span>
      </div>

      <nav className="flex-1 py-8 flex flex-col gap-2 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center p-3 rounded-lg transition-all duration-200 group relative overflow-hidden",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(0,243,255,0.2)]"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )
            }
          >
            <item.icon className="h-6 w-6 shrink-0 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all" />
            <span className="hidden lg:block ml-3 font-medium tracking-wide">
              {item.label}
            </span>
            {/* Hover Glitch Effect Line */}
            <div className="absolute inset-y-0 left-0 w-0.5 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-glass-border">
        <div className="flex items-center justify-center lg:justify-start gap-3 text-xs text-gray-500">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
          <span className="hidden lg:block">System Online</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
