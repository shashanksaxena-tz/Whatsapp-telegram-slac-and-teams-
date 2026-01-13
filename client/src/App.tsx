import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import CommandCenter from './pages/CommandCenter';
import UnifiedInbox from './pages/UnifiedInbox';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="command-center" element={<CommandCenter />} />
          <Route path="inbox" element={<UnifiedInbox />} />
          <Route path="chat" element={<Chat />} />
          <Route path="settings" element={<Settings />} />
          <Route path="logs" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
