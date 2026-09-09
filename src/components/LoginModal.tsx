import React, { useState } from 'react';
import { Shield, Key, Mail, Lock, X, AlertCircle } from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { api } from '../lib/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@freellmhub.dev');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.login(email, password);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const selectQuickRole = (role: UserRole) => {
    if (role === 'ADMIN') {
      setEmail('admin@freellmhub.dev');
      setPassword('admin123');
    } else if (role === 'OPERATOR') {
      setEmail('operator@freellmhub.dev');
      setPassword('operator123');
    } else {
      setEmail('viewer@freellmhub.dev');
      setPassword('viewer123');
    }
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        id="login-modal-box"
        className="w-full max-w-md bg-[#111113] border border-[#27272a] rounded-2xl p-6 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">เข้าสู่ระบบผู้ดูแล</h2>
            <p className="text-xs text-zinc-400">ระบบจัดการ Free LLM Hub</p>
          </div>
        </div>

        {/* Quick Demo Selector */}
        <div className="mb-5 p-3 rounded-xl bg-[#161619] border border-[#27272a] space-y-2">
          <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
            บัญชีทดสอบด่วน (Demo):
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => selectQuickRole('ADMIN')}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium border text-center transition-colors ${
                email.includes('admin')
                  ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                  : 'bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              ผู้ดูแล (Admin)
            </button>
            <button
              type="button"
              onClick={() => selectQuickRole('OPERATOR')}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium border text-center transition-colors ${
                email.includes('operator')
                  ? 'bg-indigo-950/60 border-indigo-700 text-indigo-300'
                  : 'bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              ผู้ควบคุม (Operator)
            </button>
            <button
              type="button"
              onClick={() => selectQuickRole('VIEWER')}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium border text-center transition-colors ${
                email.includes('viewer')
                  ? 'bg-zinc-700 border-zinc-500 text-white'
                  : 'bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              ผู้ดู (Viewer)
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">ที่อยู่อีเมล</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#161619] border border-[#27272a] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#161619] border border-[#27272a] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-semibold tracking-wide transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </div>
  );
};
