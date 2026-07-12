import React, { useState, useEffect } from 'react';
import { 
  Building2, Leaf, Settings, FolderTree, Database, Plus, Trash2, 
  RefreshCw, Check, AlertCircle, Trash, ToggleLeft, ToggleRight
} from 'lucide-react';
import { Department, Category, EmissionFactor, ESGWeights } from '../types';

interface MasterDataViewProps {
  onRefreshStats: () => void;
}

export default function MasterDataView({ onRefreshStats }: MasterDataViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'depts' | 'factors' | 'weights'>('depts');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [weights, setWeights] = useState<ESGWeights>({ environmental: 40, social: 30, governance: 30 });
  const [companyName, setCompanyName] = useState('EcoSphere Corp');

  // Input States
  const [newDept, setNewDept] = useState({ name: '', code: '', targetCarbonLimit: 500, headCount: 20 });
  const [newFactor, setNewFactor] = useState({ name: '', factor: 0.5, unit: 'kWh', categoryId: '' });

  // Status indicators
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [deptsRes, catsRes, factorsRes, settingsRes] = await Promise.all([
        fetch('/api/departments', { headers }),
        fetch('/api/categories', { headers }),
        fetch('/api/emission-factors', { headers }),
        fetch('/api/settings', { headers }),
      ]);

      if (deptsRes.ok) setDepartments(await deptsRes.json());
      if (catsRes.ok) {
        const cats = await catsRes.json();
        setCategories(cats);
        if (cats.length > 0 && !newFactor.categoryId) {
          setNewFactor(prev => ({ ...prev, categoryId: cats[0].id }));
        }
      }
      if (factorsRes.ok) setFactors(await factorsRes.json());
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        setWeights(settings.weights);
        setCompanyName(settings.companyName);
      }
    } catch (err) {
      setError('Failed to download master data from server');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.name || !newDept.code) return;
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newDept)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSuccess('Department onboarded successfully.');
      setNewDept({ name: '', code: '', targetCarbonLimit: 500, headCount: 20 });
      fetchMasterData();
      onRefreshStats();
    } catch (err: any) {
      setError(err.message || 'Failed to create department');
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to soft-delete this department? Score indices will be recompiled.')) return;
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/departments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete');
      setSuccess('Department soft-deleted.');
      fetchMasterData();
      onRefreshStats();
    } catch (err) {
      setError('Delete department action failed');
    }
  };

  const handleCreateFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFactor.name || !newFactor.categoryId) return;
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/emission-factors', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newFactor)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSuccess('Emission factor added.');
      setNewFactor({ name: '', factor: 0.5, unit: 'kWh', categoryId: categories[0]?.id || '' });
      fetchMasterData();
    } catch (err: any) {
      setError(err.message || 'Failed to add emission factor');
    }
  };

  const handleDeleteFactor = async (id: string) => {
    if (!confirm('Soft-delete this emission factor?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/emission-factors/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSuccess('Factor deleted.');
      fetchMasterData();
    } catch (err) {
      setError('Failed to delete factor');
    }
  };

  const handleUpdateWeights = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const sum = Number(weights.environmental) + Number(weights.social) + Number(weights.governance);
    if (sum !== 100) {
      setError(`Validation failed: Overall sum must equal 100%. Currently: ${sum}%`);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          companyName,
          weights: {
            environmental: Number(weights.environmental),
            social: Number(weights.social),
            governance: Number(weights.governance)
          }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSuccess('ESG scores re-calibrated. All indices successfully refreshed.');
      onRefreshStats();
    } catch (err: any) {
      setError(err.message || 'Failed to apply weights');
    }
  };

  return (
    <div className="space-y-8" id="master-registry-container">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">Master Registry Setup</h1>
        <p className="text-sm text-gray-400 mt-1">Configure carbon factors, departments limits, and ESG pillar scoring models</p>
      </div>

      {/* Sub menu selector */}
      <div className="flex border-b border-slate-800 space-x-1.5 p-1 bg-slate-900/50 rounded-xl max-w-md">
        <button
          onClick={() => { setActiveSubTab('depts'); setError(''); setSuccess(''); }}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 ${
            activeSubTab === 'depts' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Building2 className="h-4 w-4 inline mr-1.5" />
          Departments
        </button>
        <button
          onClick={() => { setActiveSubTab('factors'); setError(''); setSuccess(''); }}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 ${
            activeSubTab === 'factors' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Database className="h-4 w-4 inline mr-1.5" />
          Emission Factors
        </button>
        <button
          onClick={() => { setActiveSubTab('weights'); setError(''); setSuccess(''); }}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 ${
            activeSubTab === 'weights' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Settings className="h-4 w-4 inline mr-1.5" />
          ESG Weights
        </button>
      </div>

      {/* Messaging banner */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center space-x-2">
          <Check className="h-4.5 w-4.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Tab Contents: Departments */}
      {activeSubTab === 'depts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-[#0f172a]/80 border border-slate-800/80 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-bold text-lg text-white">Active Corporate Divisions</h3>
              <button onClick={fetchMasterData} className="p-1.5 hover:bg-slate-800 rounded-lg text-gray-400 hover:text-white">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-gray-500 uppercase tracking-widest font-extrabold">
                    <th className="pb-3 pl-2">Division</th>
                    <th className="pb-3">Code</th>
                    <th className="pb-3">Headcount</th>
                    <th className="pb-3 text-right">Target (Tons CO2e)</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-slate-900/30">
                      <td className="py-3.5 pl-2 font-semibold text-white">{dept.name}</td>
                      <td className="py-3.5 font-mono text-emerald-400 font-bold">{dept.code}</td>
                      <td className="py-3.5 text-gray-300">{dept.headCount} employees</td>
                      <td className="py-3.5 text-right font-mono text-gray-300 font-semibold">{dept.targetCarbonLimit} t/year</td>
                      <td className="py-3.5 text-right pr-2">
                        <button
                          onClick={() => handleDeleteDepartment(dept.id)}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {departments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">No departments found in directory</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-display font-bold text-lg text-white mb-6">Onboard New Division</h3>
            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 font-semibold mb-2">DIVISION NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manufacturing Logistics"
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  className="w-full bg-[#111827] border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 font-semibold mb-2">DIVISION CODE</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MFG"
                    value={newDept.code}
                    onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
                    className="w-full bg-[#111827] border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-semibold mb-2">HEADCOUNT</label>
                  <input
                    type="number"
                    required
                    value={newDept.headCount}
                    onChange={(e) => setNewDept({ ...newDept, headCount: Number(e.target.value) })}
                    className="w-full bg-[#111827] border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-semibold mb-2">ANNUAL CO2e TARGET (TONS)</label>
                <input
                  type="number"
                  required
                  value={newDept.targetCarbonLimit}
                  onChange={(e) => setNewDept({ ...newDept, targetCarbonLimit: Number(e.target.value) })}
                  className="w-full bg-[#111827] border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-3 rounded-xl transition-all duration-150 mt-2 flex items-center justify-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Add Department</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab Contents: Factors */}
      {activeSubTab === 'factors' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-[#0f172a]/80 border border-slate-800/80 rounded-2xl p-6">
            <h3 className="font-display font-bold text-lg text-white mb-6">Emissions Calculations Directory</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-gray-500 uppercase tracking-widest font-extrabold">
                    <th className="pb-3 pl-2">Factor Item</th>
                    <th className="pb-3">Coefficient</th>
                    <th className="pb-3">Unit</th>
                    <th className="pb-3">Scope Classification</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {factors.map((fac) => {
                    const cat = categories.find(c => c.id === fac.categoryId);
                    return (
                      <tr key={fac.id} className="hover:bg-slate-900/30">
                        <td className="py-3.5 pl-2 font-semibold text-white">{fac.name}</td>
                        <td className="py-3.5 font-mono text-emerald-400 font-bold">{fac.factor} kg CO2e</td>
                        <td className="py-3.5 font-mono text-gray-400">per {fac.unit}</td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-semibold">
                            {cat ? cat.name : 'Environmental'}
                          </span>
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          <button
                            onClick={() => handleDeleteFactor(fac.id)}
                            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-display font-bold text-lg text-white mb-6">Create Emission Factor</h3>
            <form onSubmit={handleCreateFactor} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 font-semibold mb-2">FACTOR NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Natural Gas combustion"
                  value={newFactor.name}
                  onChange={(e) => setNewFactor({ ...newFactor, name: e.target.value })}
                  className="w-full bg-[#111827] border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 font-semibold mb-2">COEFFICIENT</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={newFactor.factor}
                    onChange={(e) => setNewFactor({ ...newFactor, factor: Number(e.target.value) })}
                    className="w-full bg-[#111827] border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-semibold mb-2">UNIT</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. kWh"
                    value={newFactor.unit}
                    onChange={(e) => setNewFactor({ ...newFactor, unit: e.target.value })}
                    className="w-full bg-[#111827] border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-semibold mb-2">SCOPE CATEGORY</label>
                <select
                  value={newFactor.categoryId}
                  onChange={(e) => setNewFactor({ ...newFactor, categoryId: e.target.value })}
                  className="w-full bg-[#111827] border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none"
                >
                  {categories.filter(c => c.type === 'environmental').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-3 rounded-xl transition-all duration-150 mt-2 flex items-center justify-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Add Factor Code</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab Contents: Weights */}
      {activeSubTab === 'weights' && (
        <div className="max-w-2xl bg-[#0f172a]/80 border border-slate-800/80 rounded-2xl p-6">
          <h3 className="font-display font-bold text-lg text-white mb-2">Score Tuning Weights</h3>
          <p className="text-xs text-gray-400 mb-8">Define relative weighting indices for organizational and department overall score aggregation. The sum of Environmental, Social, and Governance pillars must equal exactly 100%.</p>

          <form onSubmit={handleUpdateWeights} className="space-y-6">
            <div>
              <label className="block text-xs text-gray-400 font-semibold mb-2">COMPANY TITLE</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full max-w-md bg-[#111827] border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800/60">
              <div>
                <div className="flex justify-between text-xs text-gray-400 font-semibold mb-2">
                  <span>ENVIRONMENTAL</span>
                  <span className="text-emerald-400 font-mono">{weights.environmental}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.environmental}
                  onChange={(e) => setWeights({ ...weights, environmental: Number(e.target.value) })}
                  className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-400 font-semibold mb-2">
                  <span>SOCIAL</span>
                  <span className="text-pink-400 font-mono">{weights.social}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.social}
                  onChange={(e) => setWeights({ ...weights, social: Number(e.target.value) })}
                  className="w-full accent-pink-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-400 font-semibold mb-2">
                  <span>GOVERNANCE</span>
                  <span className="text-sky-400 font-mono">{weights.governance}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights.governance}
                  onChange={(e) => setWeights({ ...weights, governance: Number(e.target.value) })}
                  className="w-full accent-sky-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Sum validator indicator */}
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-gray-400">Aggregated Weight Calculation Ratio:</span>
              <span className={`font-mono font-bold px-3 py-1 rounded-full ${
                (Number(weights.environmental) + Number(weights.social) + Number(weights.governance)) === 100 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {Number(weights.environmental) + Number(weights.social) + Number(weights.governance)}% / 100%
              </span>
            </div>

            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-6 py-3 rounded-xl transition-all duration-150"
            >
              Update ESG Configuration Matrix
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
