import React, { useState, useEffect } from 'react';
import { 
  TreeDeciduous, Plus, FlameKindling, RefreshCw, CheckCircle, 
  XCircle, Clock, AlertCircle, Sparkles, Goal, Calendar 
} from 'lucide-react';
import { CarbonTransaction, Department, EmissionFactor, EnvironmentalGoal } from '../types';

interface EnvironmentViewProps {
  userId: string;
  userRole: string;
}

export default function EnvironmentView({ userId, userRole }: EnvironmentViewProps) {
  const [transactions, setTransactions] = useState<CarbonTransaction[]>([]);
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [goals, setGoals] = useState<EnvironmentalGoal[]>([]);

  const [showLogModal, setShowLogModal] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    departmentId: '',
    emissionFactorId: '',
    quantity: 0,
    description: '',
    proofUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEnvData();
  }, []);

  const fetchEnvData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [txsRes, facsRes, deptsRes, goalsRes] = await Promise.all([
        fetch('/api/carbon-transactions', { headers }),
        fetch('/api/emission-factors', { headers }),
        fetch('/api/departments', { headers }),
        fetch('/api/goals', { headers })
      ]);
      if (txsRes.ok) setTransactions(await txsRes.json());
      if (facsRes.ok) {
        const facs = await facsRes.json();
        setFactors(facs);
        if (facs.length > 0) setFormData(prev => ({ ...prev, emissionFactorId: facs[0].id }));
      }
      if (deptsRes.ok) {
        const depts = await deptsRes.json();
        setDepartments(depts);
        if (depts.length > 0) setFormData(prev => ({ ...prev, departmentId: depts[0].id }));
      }
      if (goalsRes.ok) setGoals(await goalsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.quantity || formData.quantity <= 0) return;
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/carbon-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSuccess(userRole === 'employee' ? 'Log submitted for head verification.' : 'Transaction recorded re-compiling matrix scores.');
      setFormData(prev => ({ ...prev, quantity: 0, description: '', proofUrl: '' }));
      setShowLogModal(false);
      fetchEnvData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit entry');
    }
  };

  const handleApproveTransaction = async (id: string, status: 'approved' | 'rejected') => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/carbon-transactions/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Action failed');
      setSuccess(`Transaction successfully ${status}.`);
      fetchEnvData();
    } catch (err) {
      setError('Verification toggle failed');
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8" id="environment-tab-container">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-light text-slate-900 uppercase tracking-tight">Environmental <span className="font-bold">Emissions</span></h1>
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase mt-1">Log carbon transactions, track utilities, and check goals</p>
        </div>
        <button
          onClick={() => { setShowLogModal(true); setError(''); setSuccess(''); }}
          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-3 rounded-none flex items-center justify-center space-x-1.5 transition-all shadow-sm cursor-pointer uppercase tracking-wider"
          id="btn-log-carbon"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Log Carbon Usage</span>
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">{error}</div>}
      {success && <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">{success}</div>}

      {/* Grid of Targets */}
      <div className="bg-white border border-slate-200 rounded-none p-4 lg:p-6 shadow-sm text-slate-900">
        <h3 className="font-display font-bold text-lg text-slate-900 uppercase tracking-tight mb-6 flex items-center">
          <Goal className="h-5 w-5 text-emerald-600 mr-2 shrink-0" />
          Sustainability Targets Fulfillments
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {goals.map((goal) => {
            const ratio = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
            return (
              <div key={goal.id} className="bg-slate-50 border border-slate-200 rounded-none p-4 lg:p-5 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <h4 className="font-display font-bold text-sm text-slate-900 leading-tight uppercase tracking-tight">{goal.title}</h4>
                    <span className="px-2 py-0.5 rounded-none text-[9px] uppercase font-bold tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">{goal.status}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 font-medium mb-4">{goal.description}</p>
                </div>
                <div className="space-y-4">
                  <div className="w-full bg-slate-200 h-2 rounded-none overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, ratio)}%` }}></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider flex-wrap gap-2 pt-2 border-t border-slate-200/60">
                    <span className="flex items-center"><Calendar className="h-3.5 w-3.5 mr-1" /> Due: {new Date(goal.endDate).toLocaleDateString()}</span>
                    <span>Dept: {departments.find(d => d.id === goal.departmentId)?.name || 'Corp'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Trail Table Container with horizontal responsive safety boundaries */}
      <div className="bg-white border border-slate-200 rounded-none p-4 lg:p-6 shadow-sm text-slate-900">
        <h3 className="font-display font-bold text-lg text-slate-900 uppercase tracking-tight mb-6">Carbon Audit Trail</h3>
        <div className="overflow-x-auto -mx-4 lg:mx-0">
          <div className="inline-block min-w-full align-middle px-4 lg:p-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  <th className="pb-3">Date</th>
                  <th className="pb-3 px-3">Department</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3 px-3 text-right">CO2e</th>
                  <th className="pb-3 text-center">Status</th>
                  {['admin', 'dept_head'].includes(userRole) && <th className="pb-3 text-right pr-2">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 text-slate-700">
                    <td className="py-3.5 font-mono text-slate-500 whitespace-nowrap">{tx.date}</td>
                    <td className="py-3.5 px-3 font-bold text-slate-900 uppercase tracking-tight whitespace-nowrap">{departments.find(d => d.id === tx.departmentId)?.name || 'Operations'}</td>
                    <td className="py-3.5 max-w-xs md:max-w-md truncate">{tx.description}</td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">{tx.calculatedEmissions} T</td>
                    <td className="py-3.5 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 border text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border-amber-200">{tx.status}</span>
                    </td>
                    {['admin', 'dept_head'].includes(userRole) && (
                      <td className="py-3.5 text-right whitespace-nowrap">
                        {tx.status === 'pending' ? (
                          <div className="flex justify-end space-x-1">
                            <button onClick={() => handleApproveTransaction(tx.id, 'approved')} className="px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold uppercase">Approve</button>
                          </div>
                        ) : <span className="text-slate-400 px-2">-</span>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modular Form Center Drawer Layout overlays */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-none w-full max-w-lg p-5 lg:p-6 my-auto shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 text-slate-900">
              <h3 className="font-display font-bold text-lg uppercase tracking-tight">Log Emissions</h3>
              <button onClick={() => setShowLogModal(false)} className="text-slate-500 hover:text-slate-900 font-bold text-sm">CLOSE</button>
            </div>
            <form onSubmit={handleCreateTransaction} className="space-y-4 pt-4 text-slate-900">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1.5 uppercase">DATE</label>
                  <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1.5 uppercase">DIVISION</label>
                  <select value={formData.departmentId} onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 text-xs font-bold text-slate-900 focus:outline-none">
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1.5 uppercase">COEFFICIENT TYPE</label>
                <select value={formData.emissionFactorId} onChange={(e) => setFormData({ ...formData, emissionFactorId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 text-xs font-bold text-slate-900 focus:outline-none">
                  {factors.map(f => <option key={f.id} value={f.id}>{f.name} ({f.factor} kg / {f.unit})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1.5 uppercase">QUANTITY</label>
                <input type="number" required placeholder="Quantity value" value={formData.quantity || ''} onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1.5 uppercase">NOTES</label>
                <textarea placeholder="Log descriptions..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full bg-slate-50 border border-slate-200 py-2 px-3 text-xs focus:outline-none" />
              </div>
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 uppercase tracking-wider">Onboard Transaction</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}