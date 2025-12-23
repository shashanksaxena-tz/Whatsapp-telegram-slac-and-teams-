import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
  return (
    <div className="flex h-screen w-full bg-background text-white selection:bg-primary/30">
      {/* Background Grid Animation */}
      <div className="fixed inset-0 bg-cyber-grid bg-[length:40px_40px] opacity-20 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(188,19,254,0.1),transparent_70%)] pointer-events-none" />

      <Sidebar />

      <main className="flex-1 overflow-auto relative z-10 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
