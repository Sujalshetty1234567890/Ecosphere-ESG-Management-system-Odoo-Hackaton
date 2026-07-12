import React from 'react';
import { 
  Leaf, LayoutDashboard, Database, TreeDeciduous, Users, 
  ShieldAlert, Trophy, FileBarChart, LogOut, Settings, Bell 
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  companyName: string;
  notificationsCount: number;
}

export default function Sidebar({ user, activeTab, setActiveTab, onLogout, companyName, notificationsCount }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'dept_head', 'employee', 'auditor'] },
    { id: 'master', label: 'Master Registry', icon: Database, roles: ['admin'] },
    { id: 'environment', label: 'Environmental', icon: TreeDeciduous, roles: ['admin', 'dept_head', 'employee'] },
    { id: 'social', label: 'Social & CSR', icon: Users, roles: ['admin', 'dept_head', 'employee'] },
    { id: 'governance', label: 'Governance', icon: ShieldAlert, roles: ['admin', 'dept_head', 'employee', 'auditor'] },
    { id: 'gamification', label: 'Gamification', icon: Trophy, roles: ['admin', 'dept_head', 'employee'] },
    { id: 'reports', label: 'ESG Reports', icon: FileBarChart, roles: ['admin', 'dept_head', 'employee', 'auditor'] },
  ];

  return (
    <aside className="w-full lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen text-slate-400 sticky top-0" id="sidebar-panel">
      {/* 1. Header Branding Component */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3 shrink-0">
        <div className="w-8 h-8 bg-emerald-500 rounded-sm flex items-center justify-center shrink-0">
          <div className="w-4 h-4 border-2 border-white rotate-45"></div>
        </div>
        <div className="flex flex-col">
          <span className="font-display font-bold text-lg leading-tight text-white tracking-tight uppercase">EcoSphere</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold truncate max-w-[150px]">{companyName}</span>
        </div>
      </div>

      {/* 2. User Profile Capsule Widget */}
      <div className="p-5 border-b border-slate-800/60 bg-slate-950/40 shrink-0">
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded bg-emerald-50/20 border border-emerald-500/30 flex items-center justify-center font-display font-bold text-emerald-500 shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">{user.name}</h4>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                {user.role === 'dept_head' ? 'Dept Head' : user.role}
              </span>
            </div>
          </div>
        </div>

        {/* User stats indicator matrices (XP / Points) */}
        {user.role !== 'auditor' && (
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800/60">
            <div className="bg-slate-950/50 rounded-sm p-2 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">XP LEVEL</div>
              <div className="text-xs font-extrabold text-emerald-400 font-mono mt-0.5 truncate">{user.xp} XP</div>
            </div>
            <div className="bg-slate-950/50 rounded-sm p-2 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">BALANCE</div>
              <div className="text-xs font-extrabold text-teal-400 font-mono mt-0.5 truncate">{user.balancePoints} pts</div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Center Navigation Section (This section handles inner overflows gracefully) */}
      <nav className="flex-1 px-1 py-4 space-y-1 overflow-y-auto min-h-0 scrollbar-none">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-2.5">Modules</div>
        {menuItems
          .filter((item) => item.roles.includes(user.role))
          .map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-none text-sm font-medium transition-all duration-150 group border-l-2 ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white border-transparent'
                }`}
                id={`nav-${item.id}`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-white transition-colors'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.id === 'dashboard' && notificationsCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse shrink-0">
                    {notificationsCount}
                  </span>
                )}
              </button>
            );
          })}
      </nav>

      {/* 4. Bottom Pinned Layout Actions Footer (Stays static at the viewport bottom boundary) */}
      <div className="p-4 border-t border-slate-800 bg-slate-900 space-y-1 shrink-0 mt-auto">
        {user.role === 'admin' && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-none text-xs font-medium transition-colors border-l-2 ${
              activeTab === 'settings' 
                ? 'bg-slate-800 text-emerald-400 border-emerald-500' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white border-transparent'
            }`}
            id="nav-settings"
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span className="truncate">Platform Settings</span>
          </button>
        )}
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-none text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors border-l-2 border-transparent cursor-pointer"
          id="btn-logout"
        >
          <LogOut className="h-4 w-4 text-red-400 shrink-0" />
          <span className="truncate">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}