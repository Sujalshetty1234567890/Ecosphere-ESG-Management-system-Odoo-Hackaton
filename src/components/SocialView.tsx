import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Calendar, MapPin, Heart, Sparkles, Check, 
  X, AlertCircle, CheckCircle, RefreshCw, LogIn 
} from 'lucide-react';
import { CSRActivity, EmployeeParticipation, User } from '../types';

interface SocialViewProps {
  user: User;
  onRefreshStats: () => void;
}

export default function SocialView({ user, onRefreshStats }: SocialViewProps) {
  const [activities, setActivities] = useState<CSRActivity[]>([]);
  const [participations, setParticipations] = useState<EmployeeParticipation[]>([]);
  
  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    pointsReward: 100,
    xpReward: 200,
    maxParticipants: 50
  });

  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [logFormData, setLogFormData] = useState({
    hoursLogged: 2,
    proofUrl: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSocialData();
  }, []);

  const fetchSocialData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [actRes, partRes] = await Promise.all([
        fetch('/api/csr-activities', { headers }),
        fetch('/api/csr-activities/participations', { headers })
      ]);
      if (actRes.ok) setActivities(await actRes.json());
      if (partRes.ok) setParticipations(await partRes.json());
    } catch (err) {
      console.error('Social fetch err', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.location) return;
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/csr-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSuccess('Sustainability CSR activity onboarded successfully.');
      setFormData({
        title: '',
        description: '',
        date: '',
        location: '',
        pointsReward: 100,
        xpReward: 200,
        maxParticipants: 50
      });
      setShowCreateModal(false);
      fetchSocialData();
    } catch (err: any) {
      setError(err.message || 'Failed to create activity');
    }
  };

  const handleOpenLogParticipation = (id: string) => {
    setSelectedActivityId(id);
    setError('');
    setSuccess('');
    setShowLogModal(true);
  };

  const handleLogParticipation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivityId) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/csr-activities/${selectedActivityId}/participate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(logFormData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSuccess('Your CSR participation request was dispatched. Approved hours will trigger XP.');
      setShowLogModal(false);
      fetchSocialData();
    } catch (err: any) {
      setError(err.message || 'Failed to join activity');
    }
  };

  const handleApproveParticipation = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/csr-activities/participations/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Approval action failed');
      setSuccess(`Participation log has been ${status}.`);
      fetchSocialData();
      onRefreshStats();
    } catch (err) {
      setError('Approval request failed');
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8" id="social-tab-container">
      {/* Dynamic Header Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-light text-slate-900 uppercase tracking-tight">Social & <span className="font-bold">CSR Portal</span></h1>
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase mt-1">Organize community outreach initiatives, log corporate volunteering hours, and manage point awards</p>
        </div>
        {['admin', 'dept_head'].includes(user.role) && (
          <button
            onClick={() => { setShowCreateModal(true); setError(''); setSuccess(''); }}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-3 rounded-none flex items-center justify-center space-x-1.5 transition-all shadow-sm cursor-pointer uppercase tracking-wider shrink-0"
            id="btn-create-csr"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Schedule Activity</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold shadow-sm animate-fade-in">
          <AlertCircle className="h-4.5 w-4.5 inline mr-2 align-middle shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-sm animate-fade-in">
          <CheckCircle className="h-4.5 w-4.5 inline mr-2 align-middle shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Grid of CSR Activities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {activities.map((act) => {
          const userPart = participations.find(p => p.csrActivityId === act.id && p.userId === user.id);
          const partsForAct = participations.filter(p => p.csrActivityId === act.id && p.status === 'approved').length;
          return (
            <div key={act.id} className="bg-white border border-slate-200 rounded-none p-5 lg:p-6 flex flex-col justify-between h-80 relative overflow-hidden shadow-sm group">
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-900"></div>
              
              <div>
                <div className="flex justify-between items-center mb-4 gap-2">
                  <span className={`px-2 py-0.5 rounded-none text-[9px] uppercase font-bold tracking-wider border ${
                    act.status === 'completed' ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {act.status}
                  </span>
                  
                  <div className="flex items-center space-x-1 text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-none border border-amber-200 font-mono uppercase tracking-wider">
                    <Sparkles className="h-3 w-3 text-amber-600 mr-0.5" />
                    +{act.pointsReward} Pts
                  </div>
                </div>
                <h3 className="font-display font-bold text-md text-slate-900 leading-tight uppercase tracking-tight line-clamp-2">
                  {act.title}
                </h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed font-medium">{act.description}</p>
                
                <div className="mt-5 space-y-2 text-xs text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-slate-400 shrink-0" />
                    <span className="text-slate-600">{new Date(act.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-slate-400 shrink-0" />
                    <span className="truncate text-slate-600">{act.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-slate-400 shrink-0" />
                    <span className="text-slate-600">{partsForAct} / {act.maxParticipants} Volunteers</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200">
                {userPart ? (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Your Status:</span>
                    <span className={`font-bold uppercase tracking-wider rounded-none px-2.5 py-1 border text-[10px] ${
                      userPart.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      userPart.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-slate-50 text-slate-400 border-slate-200'
                    }`}>
                      {userPart.status}
                    </span>
                  </div>
                ) : act.status === 'planned' ? (
                  <button
                    onClick={() => handleOpenLogParticipation(act.id)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-none transition-all shadow-sm flex items-center justify-center space-x-1 uppercase tracking-wider cursor-pointer text-center"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Volunteer & Log Hours</span>
                  </button>
                ) : (
                  <div className="text-center text-xs text-slate-400 font-bold py-2 bg-slate-50 border border-slate-200 rounded-none uppercase tracking-wider">
                    Outreach closed
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Approval Board (Protected behind horizontal responsive table boundary overrides) */}
      {['admin', 'dept_head'].includes(user.role) && (
        <div className="bg-white border border-slate-200 rounded-none p-4 lg:p-6 shadow-sm text-slate-900 overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 uppercase tracking-tight">Volunteering Approvals Board</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">Approve logged employee hours to update social score coefficients and dispense rewards</p>
            </div>
            <button onClick={fetchSocialData} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 self-end sm:self-center transition-colors">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  <th className="pb-3 pl-2">Employee Name</th>
                  <th className="pb-3">Outreach Campaign</th>
                  <th className="pb-3 px-2">Hours Logged</th>
                  <th className="pb-3">Proof Link</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {participations.map((part) => {
                  const act = activities.find(a => a.id === part.csrActivityId);
                  return (
                    <tr key={part.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 pl-2 font-bold text-slate-900 uppercase tracking-tight whitespace-nowrap">{part.userId === 'user-employee' ? 'Alex Wong' : 'Corporate User'}</td>
                      <td className="py-3.5 text-slate-600 font-semibold uppercase tracking-tight max-w-[150px] truncate">{act ? act.title : 'CSR Campaign'}</td>
                      <td className="py-3.5 font-mono text-slate-500 font-semibold px-2 whitespace-nowrap">{part.hoursLogged} hours</td>
                      <td className="py-3.5 whitespace-nowrap">
                        {part.proofUrl ? (
                          <a href={part.proofUrl} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline font-mono text-[10px] font-bold">
                            View attachment
                          </a>
                        ) : (
                          <span className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider">None</span>
                        )}
                      </td>
                      <td className="py-3.5 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 border text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border-amber-200">
                          {part.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right pr-2 whitespace-nowrap">
                        {part.status === 'pending' ? (
                          <div className="flex justify-end space-x-1.5">
                            <button
                              onClick={() => handleApproveParticipation(part.id, 'approved')}
                              className="p-1.5 bg-emerald-600 text-white rounded-none font-bold uppercase transition"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleApproveParticipation(part.id, 'rejected')}
                              className="p-1.5 bg-red-50 text-red-700 border border-red-200 rounded-none transition font-bold uppercase"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-bold uppercase text-[10px] px-2">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {participations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">No CSR participation entries located</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CSR Campaign Creation Overlay Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-none w-full max-w-lg p-5 lg:p-6 my-auto shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 text-slate-900">
              <h3 className="font-display font-bold text-lg uppercase tracking-tight">Create CSR Campaign</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-slate-900 font-bold text-sm">CLOSE</button>
            </div>
            <form onSubmit={handleCreateActivity} className="space-y-4 pt-4 text-slate-900">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1.5 uppercase">CAMPAIGN TITLE</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Urban Reforestation Planting"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-none py-2 px-3 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1.5 uppercase">GOAL / DESCRIPTION</label>
                <textarea
                  required
                  placeholder="Provide parameters and volunteering roles..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-none py-2 px-3 text-xs focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1.5 uppercase">EVENT DATE</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-none py-2 px-3 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1.5 uppercase">LOCATION</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sector 12 Assembly Wing"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-none py-2 px-3 text-xs focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] text-slate-400 font-bold mb-1.5 uppercase">XP REWARD</label>
                  <input
                    type="number"
                    value={formData.xpReward}
                    onChange={(e) => setFormData({ ...formData, xpReward: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-none py-2 px-2.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 font-bold mb-1.5 uppercase">POINTS</label>
                  <input
                    type="number"
                    value={formData.pointsReward}
                    onChange={(e) => setFormData({ ...formData, pointsReward: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-none py-2 px-2.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 font-bold mb-1.5 uppercase">MAX VOLS</label>
                  <input
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-none py-2 px-2.5 text-xs font-bold"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 uppercase tracking-wider cursor-pointer"
              >
                Schedule Outreach Event
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Log CSR volunteering hours Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-none w-full max-w-md p-5 my-auto shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 text-slate-900">
              <h3 className="font-display font-bold text-lg uppercase tracking-tight">Log Volunteering Hours</h3>
              <button onClick={() => setShowLogModal(false)} className="text-slate-500 hover:text-slate-900 font-bold text-sm">CLOSE</button>
            </div>
            <form onSubmit={handleLogParticipation} className="space-y-4 pt-4 text-slate-900">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1.5 uppercase">VOLUNTEERED HOURS</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="12"
                  value={logFormData.hoursLogged}
                  onChange={(e) => setLogFormData({ ...logFormData, hoursLogged: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-none py-2 px-3 text-xs focus:outline-none font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1.5 uppercase">EVIDENCE PROOF URL</label>
                <input
                  type="url"
                  placeholder="e.g. https://files.co/planting_selfie.jpg"
                  value={logFormData.proofUrl}
                  onChange={(e) => setLogFormData({ ...logFormData, proofUrl: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-none py-2 px-3 text-xs focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-semibold uppercase tracking-wider leading-normal">Provide a link to an image or PDF certificate verifying physical community engagement.</p>
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 uppercase tracking-wider cursor-pointer"
              >
                File Participation Log
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}