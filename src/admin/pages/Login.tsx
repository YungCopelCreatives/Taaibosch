import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { api, ApiError } from '../api';
import { Button } from '../ui';
import type { Me } from '../AdminApp';

export const Login: React.FC<{ onSignedIn: (s: { user: Me; permissions: string[] }) => void }> = ({ onSignedIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      onSignedIn(await api('login', { body: { email, password } }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in.');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-green-light flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/assets/logo.webp" alt="Taaibosch Organics" className="h-10 w-auto mx-auto" />
          <p className="mt-3 text-[10px] uppercase tracking-[0.3em] font-bold text-brand-ink/40">Team dashboard</p>
        </div>
        <form onSubmit={submit} className="bg-white rounded-[2rem] p-8 shadow-xl shadow-brand-green-deep/5 space-y-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-brand-ink/50 mt-1">Sign in to manage orders and products.</p>
          </div>
          <label className="block space-y-1.5">
            <span className="text-[11px] uppercase tracking-widest font-bold text-brand-ink/50">Email</span>
            <span className="relative block">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/25" />
              <input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-brand-grey rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-deep/40" />
            </span>
          </label>
          <label className="block space-y-1.5">
            <span className="text-[11px] uppercase tracking-widest font-bold text-brand-ink/50">Password</span>
            <span className="relative block">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/25" />
              <input type={show ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 bg-brand-grey rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-deep/40" />
              <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-brand-ink/40">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          {error && <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}
          <Button type="submit" loading={busy} className="w-full py-4">Sign in</Button>
          <p className="text-xs text-center text-brand-ink/40">Forgot your password? Ask the shop owner to reset it from the Team page.</p>
        </form>
      </div>
    </div>
  );
};
