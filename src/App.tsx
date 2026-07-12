import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, Menu, X, Settings2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import AuthPages from './components/AuthPages';
import DashboardView from './components/DashboardView';
import MasterDataView from './components/MasterDataView';
import EnvironmentView from './components/EnvironmentView';
import SocialView from './components/SocialView';
import GovernanceView from './components/GovernanceView';
import GamificationView from './components/GamificationView';
import ReportsView from './components/ReportsView';
import { User, DashboardStats, Notification } from './types';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [companyName, setCompanyName] = useState<string>('EcoSphere Corp');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core stats & notification matrix
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Loading & Error States
  const [initializing, setInitializing] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    bootstrapSession();
  }, [token]);

  const bootstrapSession = async () => {
    if (!token) {
      setInitializing(false);
      setUser(null);
      return;
    }

    try {
      setSyncing(true);
      const headers = { 'Authorization': `Bearer ${token}` };

      // Verify token & fetch user profile
      const userRes = await fetch('/api/auth/me', { headers });
      if (!userRes.ok) {
        // Stale session
        handleLogout();
        return;
      }
      const userData: User = await userRes.json();
      setUser(userData);

      // Fetch company name & weights
      const settingsRes = await fetch('/api/settings', { headers });
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        setCompanyName(settings.companyName || 'EcoSphere Corp');
      }

      // Fetch active ESG score stats & notifications
      await Promise.all([
        fetchStats(token),
        fetchNotifications(token)
      ]);

    } catch (err) {
      setError('Connection to server interrupted');
    } finally {
      setInitializing(false);
      setSyncing(false);
    }
  };

  const fetchStats = async (activeToken: string) => {
    try {
      const res = await fetch('/api/stats', {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (err) {
      console.error('Stats synchronization failed', err);
    }
  };

  const fetchNotifications = async (activeToken: string) => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (err) {
      console.error('Notification dispatch sync failed', err);
    }
  };

  const handleLoginSuccess = (newToken: string, loggedUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(loggedUser);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setStats(null);
    setNotifications([]);
    setActiveTab('dashboard');
  };

  const handleRefreshStats = async () => {
    if (!token) return;
    setSyncing(true);
    await Promise.all([
      fetchStats(token),
      fetchNotifications(token)
    ]);
    setSyncing(false);
  };

  const handleMarkNotificationsRead = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // Instantly mark read locally
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error('Failed to clear notifications drawer', err);
    }
  };

  // Safe user profile state updater (triggers sidebar stats refresh locally)
  const handleUpdateUserLocal = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#070a13] flex flex-col items-center justify-center space-y-4 text-center">
        <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 animate-pulse">
          <Leaf className="h-10 w-10 text-emerald-400" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display font-extrabold text-xl text-white tracking-tight">EcoSphere ESG Platform</h2>
          <p className="text-xs text-gray-500 font-mono">Initializing secure runtime connection...</p>
        </div>
      </div>
    );
  }

  // If unauthorized, return auth layout pages
  if (!user || !token) {
    return <AuthPages onLoginSuccess={handleLoginSuccess} />;
  }

  // Calculate notifications count for navigation badge
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex" id="main-application-frame">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block w-64 shrink-0">
        <Sidebar
          user={user}
          activeTab={activeTab}
          setActiveTab={(tab) => { setActiveTab(tab); setMobileMenuOpen(false); }}
          onLogout={handleLogout}
          companyName={companyName}
          notificationsCount={unreadCount}
        />
      </div>

      {/* Mobile Drawer Menu Overlays */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black"
            />

            {/* Sidebar drawer content */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-64 bg-slate-900 h-full flex flex-col"
            >
              <Sidebar
                user={user}
                activeTab={activeTab}
                setActiveTab={(tab) => { setActiveTab(tab); setMobileMenuOpen(false); }}
                onLogout={handleLogout}
                companyName={companyName}
                notificationsCount={unreadCount}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Upper mobile action bar header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between lg:hidden text-slate-900">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
              id="btn-mobile-menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-emerald-500 rounded-sm flex items-center justify-center shrink-0">
                <div className="w-3 h-3 border border-white rotate-45"></div>
              </div>
              <span className="font-display font-bold text-lg text-slate-900 uppercase tracking-tight">EcoSphere</span>
            </div>
          </div>

          <div className="text-xs text-emerald-600 font-mono font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-none">
            {user.xp} XP
          </div>
        </header>

        {/* Content Section Container */}
        <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full relative overflow-x-hidden">
          {/* Sync indicator drawer */}
          {syncing && (
            <div className="absolute top-4 right-10 flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
              <RefreshCw className="h-3 w-3 animate-spin text-emerald-500" />
              <span>Syncing database...</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              {/* Dynamic View dispatcher */}
              {activeTab === 'dashboard' && stats && (
                <DashboardView
                  user={user}
                  stats={stats}
                  notifications={notifications}
                  onMarkNotificationsRead={handleMarkNotificationsRead}
                  onRefreshData={handleRefreshStats}
                />
              )}

              {activeTab === 'master' && (
                <MasterDataView onRefreshStats={handleRefreshStats} />
              )}

              {activeTab === 'environment' && (
                <EnvironmentView userId={user.id} userRole={user.role} />
              )}

              {activeTab === 'social' && (
                <SocialView user={user} onRefreshStats={handleRefreshStats} />
              )}

              {activeTab === 'governance' && (
                <GovernanceView user={user} onRefreshStats={handleRefreshStats} />
              )}

              {activeTab === 'gamification' && (
                <GamificationView 
                  user={user} 
                  onRefreshStats={handleRefreshStats} 
                  onUpdateUserLocal={handleUpdateUserLocal} 
                />
              )}

              {activeTab === 'reports' && stats && (
                <ReportsView stats={stats} />
              )}

              {/* Custom settings panel in case user clicks Platform Settings */}
              {activeTab === 'settings' && (
                <div className="max-w-xl bg-white border border-slate-200 rounded-none p-6 text-slate-900 shadow-sm">
                  <h3 className="font-display font-extrabold text-xl text-slate-900 uppercase tracking-tight mb-2">Platform Settings</h3>
                  <p className="text-xs text-slate-500 mb-6 font-medium">Manage administrative configurations, corporate profiles, and metadata triggers.</p>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-none border border-slate-200">
                      <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Company Identity Name</div>
                      <div className="text-sm font-semibold text-slate-900">{companyName}</div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-none border border-slate-200">
                      <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Current Session User Role</div>
                      <div className="text-xs font-mono text-emerald-600 mt-1 uppercase font-bold">{user.role}</div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-none border border-slate-200">
                      <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Database Sync Status</div>
                      <div className="text-xs font-mono text-slate-600 mt-1 flex items-center">
                        <CheckCircle className="h-4.5 w-4.5 text-emerald-500 mr-2" />
                        Connected securely to db.json local persistence
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
