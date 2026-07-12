import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, Calendar, 
  FileText, Plus, Check, Loader2, PlayCircle, Eye, Clock 
} from 'lucide-react';
import { Policy, Audit, ComplianceIssue, User } from '../types';

interface GovernanceViewProps {
  user: User;
  onRefreshStats: () => void;
}

export default function GovernanceView({ user, onRefreshStats }: GovernanceViewProps) {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [signedPolicyIds, setSignedPolicyIds] = useState<string[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [issues, setIssues] = useState<ComplianceIssue[]>([]);

  // Modal / Resolve states
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Creation states (Admin / Auditor)
  const [newAudit, setNewAudit] = useState({ title: '', description: '', departmentId: 'dept-ops', scheduledDate: '', scope: '' });
  const [newIssue, setNewIssue] = useState({ auditId: '', title: '', description: '', severity: 'high', assignedToId: 'user-ops-head', dueDate: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGovData();
  }, []);

  const fetchGovData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [polRes, audRes, ciRes] = await Promise.all([
        fetch('/api/policies', { headers }),
        fetch('/api/audits', { headers }),
        fetch('/api/compliance-issues', { headers })
      ]);

      if (polRes.ok) setPolicies(await polRes.json());
      if (audRes.ok) {
        const audData = await audRes.json();
        setAudits(audData);
        if (audData.length > 0 && !newIssue.auditId) {
          setNewIssue(prev => ({ ...prev, auditId: audData[0].id }));
        }
      }
      if (ciRes.ok) setIssues(await ciRes.json());

      const localAcks = JSON.parse(localStorage.getItem(`acks-${user.id}`) || '[]');
      if (user.id === 'user-employee' && localAcks.length === 0) {
        localAcks.push('pol-1', 'pol-2');
        localStorage.setItem(`acks-${user.id}`, JSON.stringify(localAcks));
      }
      setSignedPolicyIds(localAcks);
    } catch (err) {
      console.error('Failed to load compliance audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgePolicy = async (policyId: string) => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/policies/${policyId}/acknowledge`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Acknowledgement failed');
      
      const updatedAcks = [...signedPolicyIds, policyId];
      setSignedPolicyIds(updatedAcks);
      localStorage.setItem(`acks-${user.id}`, JSON.stringify(updatedAcks));
      setSuccess('Policy successfully signed & acknowledged. You earned +100 XP and +25 Rewards points!');
      onRefreshStats();
      fetchGovData();
    } catch (err) {
      setError('Acknowledge action failed');
    }
  };

  const handleResolveIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssueId || !resolutionNotes) return;
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/compliance-issues/${selectedIssueId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes: resolutionNotes })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSuccess('Compliance issue marked resolved. Risk deductions removed from governance score.');
      setResolutionNotes('');
      setShowResolveModal(false);
      fetchGovData();
      onRefreshStats();
    } catch (err: any) {
      setError(err.message || 'Resolution filing failed');
    }
  };

  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAudit.title || !newAudit.scheduledDate) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/audits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAudit)
      });
      setSuccess('New compliance audit successfully scheduled.');
      setNewAudit({ title: '', description: '', departmentId: 'dept-ops', scheduledDate: '', scope: '' });
      fetchGovData();
    } catch (err) {
      setError('Audit scheduling failed');
    }
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssue.title || !newIssue.dueDate) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/compliance-issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newIssue)
      });
      setSuccess('Compliance breach ticket dispatched to responsible division head.');
      setNewIssue({ auditId: audits[0]?.id || '', title: '', description: '', severity: 'high', assignedToId: 'user-ops-head', dueDate: '' });
      setShowIssueModal(false);
      fetchGovData();
      onRefreshStats();
    } catch (err) {
      setError('Failed to dispatch compliance alert');
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8" id="governance-tab-container">
      {/* Dynamic Upper Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-light text-slate-900 uppercase tracking-tight">Governance & <span className="font-bold">Compliance</span></h1>
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase mt-1">Review organizational conduct guidelines, monitor regulatory audits, and resolve safety breaches</p>
        </div>
        {['admin', 'auditor'].includes(user.role) && (
          <button
            onClick={() => { setShowIssueModal(true); setError(''); setSuccess(''); }}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-3 rounded-none flex items-center justify-center space-x-1.5 transition-all shadow-sm cursor-pointer uppercase tracking-wider shrink-0"
            id="btn-raise-breach"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Raise Breach Issue</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-none text-xs font-semibold shadow-sm animate-fade-in">
          <AlertTriangle className="h-4.5 w-4.5 inline mr-2 align-middle shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-none text-xs font-semibold shadow-sm animate-fade-in">
          <ShieldCheck className="h-4.5 w-4.5 inline mr-2 align-middle shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Row 1: Ethical Codes and Corporate Policies */}
      <div className="bg-white border border-slate-200 rounded-none p-4 lg:p-6 shadow-sm text-slate-900">
        <h3 className="font-display font-bold text-lg text-slate-900 uppercase tracking-tight mb-6 flex items-center">
          <FileText className="h-5 w-5 text-slate-900 mr-2 shrink-0" />
          Ethical Conduct & Regulatory Policies
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {policies.map((pol) => {
            const isSigned = signedPolicyIds.includes(pol.id);
            return (
              <div key={pol.id} className="bg-slate-50 border border-slate-200 rounded-none p-5 flex flex-col justify-between h-72 sm:h-80 md:h-72 relative overflow-hidden">
                <div>
                  <div className="flex justify-between items-center mb-3 border-b border-slate-200/60 pb-2 gap-2 flex-wrap">
                    <span className="text-[9px] font-mono text-slate-400 font-bold uppercase whitespace-nowrap">v{pol.version} &bull; {pol.effectiveDate}</span>
                    {isSigned ? (
                      <span className="px-2 py-0.5 rounded-none bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold uppercase inline-flex items-center whitespace-nowrap">
                        <Check className="h-3 w-3 mr-0.5" /> Acknowledged
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-none bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold uppercase whitespace-nowrap">Pending</span>
                    )}
                  </div>
                  <h4 className="font-display font-bold text-sm text-slate-900 leading-tight uppercase tracking-tight line-clamp-2">{pol.title}</h4>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-4 leading-relaxed font-medium">{pol.description}</p>
                </div>
                <div className="mt-4">
                  {isSigned ? (
                    <div className="text-center text-[10px] text-slate-400 font-bold py-2.5 bg-slate-100 border border-slate-200 rounded-none uppercase tracking-wider truncate">
                      Signed securely on UTC 2026
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAcknowledgePolicy(pol.id)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-none uppercase tracking-wider transition cursor-pointer"
                    >
                      Sign & Acknowledge
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 2: Audits & Compliance Issues Dashboard Split Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Scheduled Audits list column */}
        <div className="bg-white border border-slate-200 rounded-none p-4 lg:p-6 shadow-sm text-slate-900 flex flex-col justify-between overflow-hidden">
          <div className="w-full">
            <h3 className="font-display font-bold text-md text-slate-900 uppercase tracking-tight mb-6 flex items-center">
              <Calendar className="h-5 w-5 text-slate-900 mr-2 shrink-0" />
              Corporate Compliance Audits
            </h3>
            <div className="space-y-4">
              {audits.map((aud) => (
                <div key={aud.id} className="p-4 bg-slate-50 border border-slate-200 rounded-none relative overflow-hidden">
                  <div className="flex justify-between items-start gap-4 mb-1">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight flex-1 truncate">{aud.title}</h4>
                    <span className={`shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-none border whitespace-nowrap ${
                      aud.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      aud.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' :
                      'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>{aud.status}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium line-clamp-2">{aud.description || 'Routine safety evaluation'}</p>
                  
                  <div className="mt-3.5 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono gap-2 flex-wrap">
                    <span className="flex items-center"><Clock className="h-3.5 w-3.5 mr-1" /> Date: {new Date(aud.scheduledDate).toLocaleDateString()}</span>
                    {aud.status === 'completed' && <span className="text-emerald-700 font-bold">Score: {aud.score}/100</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {['admin', 'auditor'].includes(user.role) && (
            <div className="pt-6 border-t border-slate-100 mt-6 w-full">
              <p className="text-[10px] text-slate-400 mb-3 font-bold uppercase tracking-wider">SCHEDULE NEW ESG AUDIT SESSION</p>
              <form onSubmit={handleCreateAudit} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Audit Session Title"
                  value={newAudit.title}
                  onChange={(e) => setNewAudit({ ...newAudit, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-none py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                />
                <input
                  type="date"
                  required
                  value={newAudit.scheduledDate}
                  onChange={(e) => setNewAudit({ ...newAudit, scheduledDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-none py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                />
                <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-none uppercase tracking-wider transition cursor-pointer">
                  Schedule Audit
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Compliance Issues Board main list container */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-none p-4 lg:p-6 shadow-sm text-slate-900">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-display font-bold text-md text-slate-900 uppercase tracking-tight">Active Compliance Breach Board</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">High-severity penalties deducting from ratings</p>
            </div>
            <button onClick={fetchGovData} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 self-end sm:self-center transition-colors">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {issues.map((issue) => (
              <div key={issue.id} className="p-4 bg-slate-50 border border-slate-200 rounded-none flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2 flex-wrap gap-y-1">
                    <span className={`px-2 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-wider border ${
                      issue.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>{issue.severity} Severity</span>
                    <span className="px-2 py-0.5 rounded-none bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold uppercase tracking-wider">{issue.status}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight truncate">{issue.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-normal">{issue.description}</p>
                  
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                    <span>Due: {new Date(issue.dueDate).toLocaleDateString()}</span>
                    <span className="truncate">Assigned: {issue.assignedToId === 'user-ops-head' ? 'Operations Head' : 'Logistics Head'}</span>
                  </div>
                  {issue.status === 'resolved' && (
                    <div className="mt-2.5 p-3 bg-emerald-50 border border-emerald-100 text-[10px] text-emerald-800 leading-relaxed font-semibold uppercase tracking-wide">
                      <strong>Resolution Notes:</strong> {issue.resolutionNotes}
                    </div>
                  )}
                </div>

                {issue.status !== 'resolved' && ['admin', 'dept_head'].includes(user.role) && (
                  <button
                    onClick={() => { setSelectedIssueId(issue.id); setShowResolveModal(true); setResolutionNotes(''); setError(''); setSuccess(''); }}
                    className="w-full md:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-none uppercase tracking-wider transition shadow-sm cursor-pointer shrink-0 text-center"
                  >
                    Resolve Breach
                  </button>
                )}
              </div>
            ))}
            {issues.length === 0 && (
              <div className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">No active compliance breach records located.</div>
            )}
          </div>
        </div>
      </div>

      {/* Resolve Issue Form Modal Layer */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-none w-full max-w-md p-5 my-auto shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 text-slate-900">
              <h3 className="font-display font-bold text-lg uppercase tracking-tight">File Correction</h3>
              <button onClick={() => setShowResolveModal(false)} className="text-slate-500 hover:text-slate-900 font-bold text-sm">CLOSE</button>
            </div>
            <form onSubmit={handleResolveIssue} className="space-y-4 pt-4 text-slate-900">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">RESOLUTION NOTES & VERIFICATIONS</label>
                <textarea
                  required
                  placeholder="Detail correction audits or physical modifications executed to resolve this compliance block..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-none py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-medium"
                />
              </div>
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 uppercase tracking-wider transition">
                File Resolution & Clear Penalties
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Raise Issue Form Modal (Admin / Auditor overlay mapping layouts) */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-none w-full max-w-lg p-5 lg:p-6 my-auto shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 text-slate-900">
              <h3 className="font-display font-bold text-lg uppercase tracking-tight">Log Regulatory Breach</h3>
              <button onClick={() => setShowIssueModal(false)} className="text-slate-500 hover:text-slate-900 font-bold text-sm">CLOSE</button>
            </div>
            <form onSubmit={handleCreateIssue} className="space-y-4 pt-4 text-slate-900">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">BREACH TITLE</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Safety sensor bypass on line-3"
                  value={newIssue.title}
                  onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-none py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">TECHNICAL DETAILS</label>
                <textarea
                  placeholder="Enter failure measurements or location parameters..."
                  value={newIssue.description}
                  onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-none py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-medium"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">ASSIGN DIVISION HEAD</label>
                  <select
                    value={newIssue.assignedToId}
                    onChange={(e) => setNewIssue({ ...newIssue, assignedToId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-none py-2.5 px-3 text-xs text-slate-900 focus:outline-none font-bold"
                  >
                    <option value="user-ops-head">Operations (David Miller)</option>
                    <option value="user-log-head">Logistics (Elena Rostova)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">SEVERITY LEVEL</label>
                  <select
                    value={newIssue.severity}
                    onChange={(e) => setNewIssue({ ...newIssue, severity: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-none py-2.5 px-3 text-xs text-slate-900 focus:outline-none font-bold"
                  >
                    <option value="low">Low Severity</option>
                    <option value="medium">Medium Severity</option>
                    <option value="high">High Severity</option>
                    <option value="critical">Critical (Deduction alert)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">DUE DATE</label>
                  <input
                    type="date"
                    required
                    value={newIssue.dueDate}
                    onChange={(e) => setNewIssue({ ...newIssue, dueDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-none py-2.5 px-3 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">ASSOCIATE AUDIT SESSION</label>
                  <select
                    value={newIssue.auditId}
                    onChange={(e) => setNewIssue({ ...newIssue, auditId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-none py-2.5 px-3 text-xs text-slate-900 focus:outline-none font-bold"
                  >
                    {audits.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 uppercase tracking-wider transition">
                Raise Compliance Ticket
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}