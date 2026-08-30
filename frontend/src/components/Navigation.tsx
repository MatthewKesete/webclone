import React, { useState, useEffect } from 'react';
import { Search, Database } from 'lucide-react';
import { api } from '../services/api';

export type ActiveTab = 'students' | 'classes' | 'employees' | 'inventory' | 'users';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const [sidebarSearch, setSidebarSearch] = useState<string>('');
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; engine: string }>({
    connected: false,
    engine: 'connecting...'
  });

  useEffect(() => {
    api.getHealth()
      .then(res => {
        setDbStatus({ connected: res.status === 'ok', engine: res.dbEngine || 'SQLite' });
      })
      .catch(() => {
        setDbStatus({ connected: false, engine: 'Offline' });
      });
  }, []);

  const navItems = [
    { id: 'students', label: 'Student Profiles' },
    { id: 'classes', label: 'Class Profiles' },
    { id: 'employees', label: 'Employee Profiles' },
    { id: 'inventory', label: 'Inventory Profiles' },
    { id: 'users', label: 'User Profiles' },
  ];

  const filteredItems = navItems.filter(item =>
    item.label.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  return (
    <aside className="w-64 tit-sidebar flex flex-col justify-between p-4 flex-shrink-0 h-screen sticky top-0 z-40 select-none">
      <div className="space-y-6">
        {/* Top Keyword Search Input */}
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Type keywords here"
            value={sidebarSearch}
            onChange={e => setSidebarSearch(e.target.value)}
            className="w-full bg-[#181818] border border-[#3f3f46] rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-300"
          />
        </div>

        {/* Vertical Profile Section Buttons */}
        <div className="space-y-3 pt-2">
          {filteredItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`tit-btn-sidebar ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer System Status */}
      <div className="bg-[#181818] border border-[#333333] p-2.5 rounded text-xs flex items-center justify-between text-zinc-400">
        <div className="flex items-center gap-2">
          <Database className="h-3.5 w-3.5 text-zinc-400" />
          <span className="font-mono text-[11px] text-zinc-300">{dbStatus.engine}</span>
        </div>
        <span className={`h-2 w-2 rounded-full ${dbStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
      </div>
    </aside>
  );
};


