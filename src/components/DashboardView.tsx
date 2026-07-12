import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  TrendingDown, Goal, HeartHandshake, ShieldCheck, FlameKindling, 
  ChevronRight, Award, Bell, Check, Clock, AlertTriangle
} from 'lucide-react';
import { User, DashboardStats, Notification } from '../types';

interface DashboardViewProps {
  user: User;
  stats: DashboardStats;
  notifications: Notification[];
  onMarkNotificationsRead: () => void;
  onRefreshData: () => void;
}

export default function DashboardView({ user, stats, notifications, onMarkNotificationsRead, onRefreshData }: DashboardViewProps) {
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const activitiesList = [
      { id: 1, type: 'badge', title: 'Alex Wong unlocked "Compliance Shield" Badge', desc: 'Acknowledged all corporate regulations.', date: '2 hours ago', icon: Award, color: 'text-amber-600 bg-amber-50 border-amber-200' },
      { id: 2, type: 'carbon', title: 'Grid Energy Log Approved', desc: 'Operations logged 25,000 kWh grid usage.', date: '5 hours ago', icon: FlameKindling, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
      { id: 3, type: 'social', title: 'Tree Planting Drive fully booked!', desc: '50 volunteers registered for Oakridge park.', date: '1 day ago', icon: HeartHandshake, color: 'text-pink-600 bg-pink-50 border-pink-200' },
      { id: 4, type: 'governance', title: 'Audit complete - IT Logistics', desc: 'IT services division achieved score of 95/100.', date: '2 days ago', icon: ShieldCheck, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    ];
    setRecentActivities(activitiesList);
  }, []);

  const emissionsHistoryData = [
    { month: 'Jan', Scope1: 45, Scope2: 82, Scope3: 20 },
    { month: 'Feb', Scope1: 52, Scope2: 78, Scope3: 18 },
    { month: 'Mar', Scope1: 48, Scope2: 90, Scope3: 25 },
    { month: 'Apr', Scope1: 40, Scope2: 85, Scope3: 22 },
    { month: 'May', Scope1: 35, Scope2: 70, Scope3: 15 },
    { month: 'Jun', Scope1: 30, Scope2: 65, Scope3: 12 },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6 lg:space-y-8" id="dashboard-view-container">
      {/* Upper header action row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-light text-slate-900 uppercase tracking-tight">EcoSphere <span className="font-bold">Dashboard</span></h1>
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase mt-1">Enterprise-wide scoring & active initiatives &bull; LIVE</p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => setShowNotificationsModal(true)}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-none relative text-slate-500 transition-all duration-150 shadow-sm"
            id="btn-notifications-open"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full"></span>
            )}
          </button>
          
          <div className="text-xs text-slate-500 font-mono bg-white border border-slate-200 rounded-none px-4 py-2.5 shadow-sm font-bold uppercase tracking-wider">
            UTC: 2026-07-11
          </div>
        </div>
      </div>

      {/* Main ESG scorecard section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Overall ESG Score */}
        <div className="bg-white rounded-none p-6 border border-slate-200 flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Overall ESG Rating</div>
            <div className="mt-4 flex items-baseline space-x-2">
              <span className={`text-5xl lg:text-6xl font-display font-bold tracking-tight ${getScoreColor(stats.overallEsgScore)}`}>
                {stats.overallEsgScore}
              </span>
              <span className="text-sm text-slate-400 font-medium">/ 100</span>
            </div>
            <div className="mt-3 inline-flex items-center space-x-1.5 text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase tracking-wider rounded-none">
              <TrendingDown className="h-3 w-3" />
              <span>Top 12% in Sector</span>
            </div>
          </div>
          <div className="mt-6">
            <div className="text-xs text-slate-500 flex justify-between mb-1.5">
              <span className="font-medium">Organization Target</span>
              <span className="font-mono text-slate-900 font-bold">85</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-none overflow-hidden">
              <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${stats.overallEsgScore}%` }}></div>
            </div>
          </div>
        </div>

        {/* Environmental Pillar Score */}
        <div className="bg-white rounded-none p-6 border border-slate-200 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Environmental (E)</div>
              <h3 className={`text-3xl lg:text-4xl font-display font-bold mt-4 ${getScoreColor(stats.environmentalScore)}`}>
                {stats.environmentalScore}
              </h3>
            </div>
            <span className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-600">
              <TrendingDown className="h-5 w-5" />
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-4 leading-relaxed font-medium">Measures carbon emission compliance, target limits, and green goal fulfillment.</p>
          <div className="border-t border-slate-100 pt-3 mt-4 flex justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Weight: 40%</span>
            <span className="text-emerald-600">Goals: {stats.activeGoalsCount}</span>
          </div>
        </div>

        {/* Social Pillar Score */}
        <div className="bg-white rounded-none p-6 border border-slate-200 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Social (S)</div>
              <h3 className={`text-3xl lg:text-4xl font-display font-bold mt-4 text-pink-600`}>
                {stats.socialScore}
              </h3>
            </div>
            <span className="p-2.5 bg-pink-50 border border-pink-200 text-pink-600">
              <HeartHandshake className="h-5 w-5" />
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-4 leading-relaxed font-medium">Evaluates corporate volunteering ratios, CSR hours, and active challenges.</p>
          <div className="border-t border-slate-100 pt-3 mt-4 flex justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Weight: 30%</span>
            <span className="text-pink-600">Rate: {stats.csrParticipationRate}%</span>
          </div>
        </div>

        {/* Governance Pillar Score */}
        <div className="bg-white rounded-none p-6 border border-slate-200 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Governance (G)</div>
              <h3 className={`text-3xl lg:text-4xl font-display font-bold mt-4 text-indigo-600`}>
                {stats.governanceScore}
              </h3>
            </div>
            <span className="p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-600">
              <ShieldCheck className="h-5 w-5" />
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-4 leading-relaxed font-medium">Tracks policy acknowledgements, health/safety updates, and incident clearance.</p>
          <div className="border-t border-slate-100 pt-3 mt-4 flex justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Weight: 30%</span>
            <span className="text-indigo-600">Open Alerts: {stats.openComplianceIssuesCount}</span>
          </div>
        </div>
      </div>

      {/* KPI stats blocks row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-none shadow-sm text-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>CARBON EMITTED (YTD)</span>
            <FlameKindling className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-xl lg:text-2xl font-bold mt-2 font-mono text-slate-900">{stats.orgCarbonEmissions} <span className="text-xs text-slate-500 font-sans font-medium">Tons</span></div>
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Limit: {stats.orgCarbonTarget} T max</div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-none shadow-sm text-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>GOALS FULFILLMENT</span>
            <Goal className="h-4 w-4 text-pink-500" />
          </div>
          <div className="text-xl lg:text-2xl font-bold mt-2 font-mono text-slate-900">{(stats.activeGoalsCount * 3) || 3} <span className="text-xs text-slate-500 font-sans font-medium">Active</span></div>
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">1,400+ hours effort</div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-none shadow-sm text-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>CSR PARTICIPANTS RATE</span>
            <HeartHandshake className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-xl lg:text-2xl font-bold mt-2 font-mono text-teal-600">{stats.csrParticipationRate}%</div>
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Target: &gt;75% coverage</div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-none shadow-sm text-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>COMPLIANCE ALERTS</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-xl lg:text-2xl font-bold mt-2 font-mono text-amber-600">{stats.openComplianceIssuesCount} <span className="text-xs text-slate-500 font-sans font-medium">Pending</span></div>
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">High-Risk area assigned</div>
        </div>
      </div>

      {/* Charts and Timeline Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-none p-4 lg:p-6 shadow-sm text-slate-900 overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 uppercase tracking-tight">Carbon Footprint Analysis</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">Scope 1, 2, & 3 emissions (past 6 months)</p>
            </div>
            <select 
              className="bg-slate-50 text-xs border border-slate-200 rounded-none px-2.5 py-1.5 text-slate-800 focus:outline-none font-bold w-full sm:w-auto"
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              <option value="ops">Operations Only</option>
              <option value="log">Logistics Only</option>
            </select>
          </div>
          
          {/* Stabilized chart container with no sub-pixel layout loops */}
          <div className="h-64 sm:h-72 w-full overflow-x-auto">
            <div className="min-w-[450px] h-full">
              <ResponsiveContainer width="100%" height="100%" debounce={1}>
                <AreaChart data={emissionsHistoryData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScope1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorScope2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorScope3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0px', color: '#0f172a' }}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                  />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 10, fontWeight: 'bold', textTransform: 'uppercase' }} />
                  <Area type="monotone" dataKey="Scope1" name="Scope 1 Direct" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorScope1)" activeDot={{ r: 5 }} />
                  <Area type="monotone" dataKey="Scope2" name="Scope 2 Purchased" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorScope2)" activeDot={{ r: 5 }} />
                  <Area type="monotone" dataKey="Scope3" name="Scope 3 Travel/Waste" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorScope3)" activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-none p-6 flex flex-col justify-between shadow-sm text-slate-900">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900 uppercase tracking-tight mb-6">Sustainable Action Feed</h3>
            <div className="space-y-5">
              {recentActivities.map((act) => {
                const IconComp = act.icon;
                return (
                  <div key={act.id} className="flex items-start space-x-3.5">
                    <div className={`p-2 rounded-none border shrink-0 ${act.color}`}>
                      <IconComp className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">{act.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-1">{act.desc}</p>
                      <div className="text-[9px] text-slate-400 font-mono mt-1 flex items-center font-bold">
                        <Clock className="h-2.5 w-2.5 mr-1" />
                        {act.date}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="pt-6 border-t border-slate-100 mt-6 text-center">
            <button 
              className="text-emerald-600 hover:text-emerald-500 text-xs font-bold inline-flex items-center cursor-pointer uppercase tracking-wider"
              onClick={onRefreshData}
            >
              <span>Refresh Metric Matrix</span>
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Directory Section */}
      <div className="bg-white border border-slate-200 rounded-none p-6 shadow-sm text-slate-900">
        <h3 className="font-display font-bold text-lg text-slate-900 uppercase tracking-tight mb-6">Department ESG Performance Directory</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {stats.departmentScores && stats.departmentScores.map((dept) => (
            <div key={dept.departmentId} className="bg-slate-50 border border-slate-100 rounded-none p-5 relative overflow-hidden">
              <h4 className="font-display font-bold text-md text-slate-900 uppercase tracking-tight truncate">{dept.departmentName}</h4>
              <div className="mt-4 flex items-baseline space-x-1.5">
                <span className={`text-4xl font-display font-bold ${getScoreColor(dept.score)}`}>{dept.score}</span>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Overall index</span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-wider gap-1 flex-wrap">
                <span className="flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5"></span>E: High
                </span>
                <span className="flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-pink-500 mr-1.5"></span>S: Approved
                </span>
                <span className="flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mr-1.5"></span>G: Clear
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal drawer structure */}
      {showNotificationsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end animate-fade-in" id="notifications-modal">
          <div className="w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col justify-between shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 text-slate-900">
              <div className="flex items-center space-x-2.5">
                <Bell className="h-5 w-5 text-emerald-600" />
                <h3 className="font-display font-bold text-lg text-slate-900 uppercase tracking-tight">Security Alerts</h3>
              </div>
              <button onClick={() => setShowNotificationsModal(false)} className="text-slate-500 hover:text-slate-900 text-xs font-bold uppercase tracking-wider">Close</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {unreadCount > 0 && (
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{unreadCount} unread system logs</span>
                  <button onClick={onMarkNotificationsRead} className="text-xs text-emerald-600 hover:text-emerald-500 font-bold flex items-center uppercase tracking-wider"><Check className="h-3.5 w-3.5 mr-1" /> Mark all read</button>
                </div>
              )}
              {notifications.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                  <Bell className="h-8 w-8 text-slate-300" />
                  <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Inbox silent</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className={`p-4 border transition-all ${notif.read ? 'bg-slate-50 border-slate-100 text-slate-500' : 'bg-emerald-50/50 border-emerald-200 text-slate-800 shadow-sm'}`}>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-bold text-slate-900 tracking-tight">{notif.title}</span>
                      <span className="text-[9px] text-slate-400 font-mono font-bold shrink-0">{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs mt-1.5 leading-relaxed text-slate-600">{notif.message}</p>
                  </div>
                ))
              )}
            </div>
            <div className="p-5 border-t border-slate-200 bg-slate-50 text-center text-[10px] text-slate-400 uppercase tracking-wider font-bold">Real-time Environmental logs channel</div>
          </div>
        </div>
      )}
    </div>
  );
}