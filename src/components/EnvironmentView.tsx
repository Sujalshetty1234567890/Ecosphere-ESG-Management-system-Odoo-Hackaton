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
  const [categories, setCategories] = useState<any[]>([]);

  // Form State
  const [showLogModal, setShowLogModal] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    departmentId: '',
    emissionFactorId: '',
    categoryId: '',
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

      const [txsRes, facsRes, deptsRes, goalsRes, catsRes] = await Promise.all([
        fetch('/api/carbon-transactions', { headers }),
        fetch('/api/emission-factors', { headers }),
        fetch('/api/departments', { headers }),
        fetch('/api/goals', { headers }),
        fetch('/api/categories', { headers })
      ]);

      if (txsRes.ok) setTransactions(await txsRes.json());
      if (facsRes.ok) {
        const facs = await facsRes.json();
        setFactors(facs);
        if (facs.length > 0) {
          setFormData(prev => ({ ...prev, emissionFactorId: facs[0].id }));
        }
      }
      if (deptsRes.ok) {
        const depts = await deptsRes.json();
        setDepartments(depts);
        if (depts.length > 0) {
          setFormData(prev => ({ ...prev, departmentId: depts[0].id }));
        }
      }
      if (catsRes.ok) {
        const allCats = await catsRes.json();
        const envCats = allCats.filter((c: any) => c.type === 'environmental');
        setCategories(envCats);
        if (envCats.length > 0) {
          setFormData(prev => ({ ...prev, categoryId: envCats[0].id }));
        }
      }
      if (goalsRes.ok) setGoals(await goalsRes.json());
    } catch (err) {
      console.error('Failed to load environmental records', err);
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

      setSuccess(userRole === 'employee' 
        ? 'Carbon log submitted successfully. Currently awaiting division head verification.' 
        : 'Carbon transaction logged and overall department scores successfully re-compiled.'
      );
      setFormData(prev => ({ ...prev, quantity: 0, description: '', proofUrl: '' }));
      setShowLogModal(false);
      fetchEnvData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit log entry');
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
      setSuccess(`Carbon transaction successfully ${status}.`);
      fetchEnvData();
    } catch (err) {
      setError('Failed to update carbon log status');
    }
  };

  // Precalculate carbon estimation dynamically in frontend form
  const getPrecalculatedCarbon = () => {
    const selectedFactor = factors.find(f => f.id === formData.emissionFactorId);
    if (!selectedFactor || !formData.quantity) return 0;
    return parseFloat(((formData.quantity * selectedFactor.factor) / 1000).toFixed(3));
  };

  return (
    <div className="space-y-8" id="environment-tab-container">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-light text-slate-900 uppercase tracking-tight">Environmental <span className="font-bold">Emissions</span></h1>
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase mt-1">Log carbon transactions, track utility emissions, and evaluate sustainability goals</p>
        </div>

        <button
          onClick={() => { setShowLogModal(true); setError(''); setSuccess(''); }}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-3 rounded-none flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer uppercase tracking-wider"
          id="btn-log-carbon"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Log Carbon Usage</span>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-none text-xs flex items-center space-x-2">
          <AlertCircle className="h-4.5 w-4.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-none text-xs flex items-center space-x-2">
          <CheckCircle className="h-4.5 w-4.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Active Carbon Goals Card */}
      <div className="bg-white border border-slate-200 rounded-none p-6 shadow-sm text-slate-900">
        <h3 className="font-display font-bold text-lg text-slate-900 uppercase tracking-tight mb-6 flex items-center">
          <Goal className="h-5 w-5 text-emerald-600 mr-2" />
          Sustainability Targets Fulfillments
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const ratio = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
            const isExceeded = ratio > 100;
            return (
              <div key={goal.id} className="bg-slate-50 border border-slate-200 rounded-none p-5 relative overflow-hidden">
                <span className={`absolute top-4 right-4 px-2 py-0.5 rounded-none text-[9px] uppercase font-bold tracking-wider border ${
                  goal.status === 'achieved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  goal.status === 'active' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {goal.status}
                </span>

                <h4 className="font-display font-bold text-sm text-slate-900 pr-14 leading-tight uppercase tracking-tight">{goal.title}</h4>
                <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 font-medium">{goal.description}</p>

                <div className="mt-5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Progress</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {goal.currentValue} / {goal.targetValue} {goal.unit}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-none overflow-hidden">
                    <div 
                      className={`h-full rounded-none transition-all duration-300 ${isExceeded ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, ratio)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1 text-slate-400" />
                    Due: {new Date(goal.endDate).toLocaleDateString()}
                  </span>
                  <span>Dept: {departments.find(d => d.id === goal.departmentId)?.name || 'Corporate'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Carbon transactions tracking log */}
      <div className="bg-white border border-slate-200 rounded-none p-6 shadow-sm text-slate-900">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900 uppercase tracking-tight">Carbon Audit Trail</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">Approved and pending operational emission events</p>
          </div>
          <button onClick={fetchEnvData} className="p-1.5 hover:bg-slate-100 rounded text-slate-500">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                <th className="pb-3 pl-2">Logged Date</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Activity Description</th>
                <th className="pb-3">Consumed Qty</th>
                <th className="pb-3 text-right font-bold">Estimated CO2e</th>
                <th className="pb-3 text-center">Status</th>
                {['admin', 'dept_head'].includes(userRole) && <th className="pb-3 text-right pr-2">Approvals</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 text-slate-700">
                  <td className="py-3.5 pl-2 font-mono text-slate-500 font-semibold">{tx.date}</td>
                  <td className="py-3.5 font-bold text-slate-900 uppercase tracking-tight">{departments.find(d => d.id === tx.departmentId)?.name || 'Operations'}</td>
                  <td className="py-3.5 text-slate-600">
                    <div className="font-medium">{tx.description}</div>
                    {tx.proofUrl && (
                      <a href={tx.proofUrl} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-600 hover:underline mt-1.5 inline-block font-mono font-bold">
                        📎 Evidence file link
                      </a>
                    )}
                  </td>
                  <td className="py-3.5 font-mono text-slate-500">
                    {tx.quantity} {factors.find(f => f.id === tx.emissionFactorId)?.unit || 'units'}
                  </td>
                  <td className="py-3.5 text-right font-mono font-bold text-emerald-600">{tx.calculatedEmissions} Tons</td>
                  <td className="py-3.5 text-center">
                    <span className={`px-2.5 py-1 rounded-none text-[10px] font-bold inline-flex items-center space-x-1 uppercase border ${
                      tx.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      tx.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {tx.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {tx.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                      {tx.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      <span>{tx.status}</span>
                    </span>
                  </td>
                  {['admin', 'dept_head'].includes(userRole) && (
                    <td className="py-3.5 text-right pr-2">
                      {tx.status === 'pending' ? (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleApproveTransaction(tx.id, 'approved')}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] rounded-none font-bold transition uppercase tracking-wider"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApproveTransaction(tx.id, 'rejected')}
                            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] rounded-none font-bold border border-red-200 transition uppercase tracking-wider"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">-</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider">No carbon transaction logs found in register</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Overlay Form for logging emissions */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" id="carbon-modal">
          <div className="bg-white border border-slate-200 rounded-none w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 text-slate-900">
              <h3 className="font-display font-bold text-lg text-slate-900 uppercase tracking-tight">Log Corporate Emissions</h3>
              <button onClick={() => setShowLogModal(false)} className="text-slate-500 hover:text-slate-900 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-4 pt-4 text-slate-900">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">DATE OF LOG</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-none py-2.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">DIVISION</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-none py-2.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-bold"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">EMISSIONS CATEGORY</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-none py-2.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-bold mb-3"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">EMISSIONS COEFFICIENT TYPE</label>
                <select
                  value={formData.emissionFactorId}
                  onChange={(e) => setFormData({ ...formData, emissionFactorId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-none py-2.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-bold"
                >
                  {factors.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.factor} kg per {f.unit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">CONSUMED QUANTITY</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5000"
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-none py-2.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">EVIDENCE ATTACHMENT URL</label>
                  <input
                    type="url"
                    placeholder="e.g. https://cloudinary.com/bill.pdf"
                    value={formData.proofUrl}
                    onChange={(e) => setFormData({ ...formData, proofUrl: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-none py-2.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">ACTIVITY NOTES / LOG DESC</label>
                <textarea
                  placeholder="e.g. Purchased grid power utility statement for operations assembly wing-A"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-none py-2.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-medium"
                />
              </div>

              {/* Dynamic calculations pre-render */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-none flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] flex items-center">
                  <Sparkles className="h-4 w-4 mr-1.5 text-emerald-600" />
                  Eco-Calculator Real-time Footprint
                </span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  {getPrecalculatedCarbon()} Tons CO2e
                </span>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 rounded-none transition-all duration-150 uppercase tracking-wider"
              >
                Onboard Carbon Transaction
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
