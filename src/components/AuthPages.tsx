import React, { useState } from 'react';
import { Leaf, Mail, Lock, User as UserIcon, Shield, Loader2, ArrowRight } from 'lucide-react';

interface AuthPagesProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export default function AuthPages({ onLoginSuccess }: AuthPagesProps) {
  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  
  // Registration Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'dept_head' | 'employee' | 'auditor'>('employee');
  const [departmentId, setDepartmentId] = useState('dept-ops');
  
  // Forgot / Reset Password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setError('Please fill in all mandatory fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          role,
          departmentId: role === 'admin' || role === 'auditor' ? null : departmentId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setError('Email address is required');
      return;
    }
    setLoading(true);
    setError('');
    setResetSuccessMsg('');
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResetSuccessMsg('Reset simulated successfully! Link dispatched.');
      setTimeout(() => {
        setView('reset');
        setError('');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Simulation dispatch failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !newPassword) {
      setError('Please fill in all reset credentials');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setResetSuccessMsg('Password successfully reconfigured. Returning to login...');
      setTimeout(() => {
        setView('login');
        setResetSuccessMsg('');
        setPassword('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch bg-[#0b0f19] text-gray-100 w-full" id="auth-container">
      {/* Side Visual branding panel (Hidden on Mobile/Tablets, displays beautifully on Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-radial from-[#0d1e36] to-[#0b0f19] relative items-center justify-center p-8 xl:p-12 overflow-hidden border-r border-[#1e293b]">
        <div className="absolute top-10 left-10 flex items-center space-x-3">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            <Leaf className="h-6 w-6 text-emerald-400" />
          </div>
          <span className="font-display font-bold text-xl tracking-wide bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">EcoSphere</span>
        </div>
        
        {/* Ambient background decoration */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl animate-glow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl animate-glow"></div>
        
        <div className="relative max-w-md text-center space-y-8 animate-float">
          <div className="inline-block px-4 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-xs font-medium text-emerald-400 tracking-wider uppercase mb-2">
            Enterprise ESG Management
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight leading-tight text-white">
            Decarbonize, Streamline, <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Lead Sustainability</span>
          </h1>
          <p className="text-gray-400 leading-relaxed text-sm">
            Empower your organization to monitor carbon transactions, set aggressive emission targets, automate CSR participation, and maintain high standards of ethical corporate governance.
          </p>
          
          <div className="grid grid-cols-3 gap-4 pt-6">
            <div className="bg-[#111827]/60 backdrop-blur-md p-4 rounded-xl border border-white/5">
              <div className="text-2xl font-bold text-emerald-400">40%</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-1">E-Weights</div>
            </div>
            <div className="bg-[#111827]/60 backdrop-blur-md p-4 rounded-xl border border-white/5">
              <div className="text-2xl font-bold text-teal-400">30%</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-1">S-Weights</div>
            </div>
            <div className="bg-[#111827]/60 backdrop-blur-md p-4 rounded-xl border border-white/5">
              <div className="text-2xl font-bold text-sky-400">30%</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-1">G-Weights</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Authentication Form Panel (Takes full screen width on mobile devices) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 lg:space-y-8">
          {/* Brand header specifically for small screen viewports */}
          <div className="lg:hidden flex items-center space-x-3 mb-6">
            <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
              <Leaf className="h-6 w-6 text-emerald-400" />
            </div>
            <span className="font-display font-bold text-xl tracking-wide bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">EcoSphere</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
              {view === 'login' && 'Sign in to platform'}
              {view === 'register' && 'Create your account'}
              {view === 'forgot' && 'Reset your password'}
              {view === 'reset' && 'Reconfigure password'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-normal">
              {view === 'login' && "Enter your credentials to access EcoSphere's dashboard"}
              {view === 'register' && 'Onboard your corporate profile to start logging activities'}
              {view === 'forgot' && 'Provide your registered email to simulate a reset dispatch'}
              {view === 'reset' && 'Create a new secure password for your account'}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-medium animate-fade-in" id="auth-error">
              {error}
            </div>
          )}

          {resetSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-medium animate-fade-in" id="auth-success">
              {resetSuccessMsg}
            </div>
          )}

          {/* Login view layout */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6" id="login-form">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. employee@ecosphere.com"
                      className="w-full bg-[#111827]/80 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-white transition-all duration-200"
                      required
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Password</label>
                    <button
                      type="button"
                      onClick={() => setView('forgot')}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                      className="w-full bg-[#111827]/80 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-white transition-all duration-200"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-900/20 active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer"
                id="btn-login-submit"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Sign In</span>}
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="text-center text-xs text-gray-500">
                Are you a new user?{' '}
                <button
                  type="button"
                  onClick={() => { setView('register'); setError(''); }}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                >
                  Create an account
                </button>
              </div>

              {/* Fast Sandbox Login Shortcuts */}
              <div className="border-t border-slate-800/60 pt-5">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-3 text-center">Fast-Onboard Preview Shortcuts</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setEmail('admin@ecosphere.com'); setPassword('password123'); }}
                    className="p-2.5 bg-[#1e293b]/30 hover:bg-[#1e293b]/60 rounded-lg border border-slate-800 text-[11px] text-gray-300 text-left truncate transition-all duration-150"
                  >
                    Admin Login
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmail('operations@ecosphere.com'); setPassword('password123'); }}
                    className="p-2.5 bg-[#1e293b]/30 hover:bg-[#1e293b]/60 rounded-lg border border-slate-800 text-[11px] text-gray-300 text-left truncate transition-all duration-150"
                  >
                    Dept Head (Ops)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmail('employee@ecosphere.com'); setPassword('password123'); }}
                    className="p-2.5 bg-[#1e293b]/30 hover:bg-[#1e293b]/60 rounded-lg border border-slate-800 text-[11px] text-gray-300 text-left truncate transition-all duration-150"
                  >
                    Employee (Alex)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmail('auditor@ecosphere.com'); setPassword('password123'); }}
                    className="p-2.5 bg-[#1e293b]/30 hover:bg-[#1e293b]/60 rounded-lg border border-slate-800 text-[11px] text-gray-300 text-left truncate transition-all duration-150"
                  >
                    Auditor Login
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Registration layout */}
          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4 sm:space-y-5" id="register-form">
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-[#111827]/80 border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-white transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john.doe@company.com"
                      className="w-full bg-[#111827]/80 border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-white transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Security Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-[#111827]/80 border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-white transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Platform Role</label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <select
                        value={role}
                        onChange={(e: any) => setRole(e.target.value)}
                        className="w-full bg-[#111827]/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-white transition-all appearance-none"
                      >
                        <option value="employee">Employee</option>
                        <option value="dept_head">Dept Head</option>
                        <option value="auditor">Auditor</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                  </div>
                  {role !== 'admin' && role !== 'auditor' && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Department</label>
                      <select
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        className="w-full bg-[#111827]/80 border border-slate-800 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-white transition-all"
                      >
                        <option value="dept-ops">Operations</option>
                        <option value="dept-log">Logistics</option>
                        <option value="dept-it">IT Services</option>
                        <option value="dept-hr">HR</option>
                        <option value="dept-mfg">Manufacturing</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center space-x-2 mt-2 cursor-pointer"
                id="btn-register-submit"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Create Account</span>}
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="text-center text-xs text-gray-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => { setView('login'); setError(''); }}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

          {/* Forgot Password layout */}
          {view === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-6" id="forgot-form">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Registered Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="e.g. employee@ecosphere.com"
                    className="w-full bg-[#111827]/80 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-white transition-all duration-200"
                    required
                    />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-lg active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer"
                id="btn-forgot-submit"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Send Reset Link</span>}
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="text-center text-xs text-gray-500">
                Remember credentials?{' '}
                <button
                  type="button"
                  onClick={() => { setView('login'); setError(''); }}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                >
                  Return to sign in
                </button>
              </div>
            </form>
          )}

          {/* Reset Password layout */}
          {view === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-6" id="reset-form">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Confirm Account Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="e.g. employee@ecosphere.com"
                      className="w-full bg-[#111827]/80 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-white transition-all duration-200"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Configure New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                      className="w-full bg-[#111827]/80 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-white transition-all duration-200"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-lg active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer"
                id="btn-reset-submit"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Update Password</span>}
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="text-center text-xs text-gray-500">
                Cancel resetting?{' '}
                <button
                  type="button"
                  onClick={() => { setView('login'); setError(''); }}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                >
                  Return to login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}