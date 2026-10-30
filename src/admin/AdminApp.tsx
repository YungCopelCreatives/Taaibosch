/**
 * Taaibosch team dashboard (/admin). Loaded lazily, so shoppers never download it.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Package, Star, Settings, Users, UserCircle, LogOut, Menu, X, ExternalLink } from 'lucide-react';
import { api, onAuthProblem } from './api';
import { NotifyProvider, Spinner } from './ui';
import { cn } from '../lib/cn';
import type { AdminUser } from '../types';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import { Overview } from './pages/Overview';
import { Orders, OrderDetail } from './pages/Orders';
import { Products, ProductEditor } from './pages/Products';
import { Reviews } from './pages/Reviews';
import { SettingsPage } from './pages/Settings';
import { Team } from './pages/Team';
import { Profile } from './pages/Profile';

export type Me = AdminUser & { mustChangePassword: boolean };
interface AuthState {
  user: Me;
  permissions: string[];
  can: (area: string) => boolean;
  setUser: (u: Me) => void;
  logout: () => Promise<void>;
}
const AuthCtx = createContext<AuthState | null>(null);
export const useAuth = () => useContext(AuthCtx)!;

export const nameOf = (u: Pick<AdminUser, 'displayName' | 'firstName' | 'email'>) => u.displayName || u.firstName || u.email.split('@')[0];

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, area: 'reports', exact: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag, area: 'orders' },
  { to: '/admin/products', label: 'Products', icon: Package, area: 'products' },
  { to: '/admin/reviews', label: 'Reviews', icon: Star, area: 'reviews' },
  { to: '/admin/settings', label: 'Settings', icon: Settings, area: 'settings' },
  { to: '/admin/team', label: 'Team', icon: Users, area: 'team' },
];

export default function AdminApp() {
  const [state, setState] = useState<{ user: Me; permissions: string[] } | null | undefined>(undefined);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const load = useCallback(async () => {
    try {
      setState(await api('me'));
    } catch {
      setState(null);
    }
  }, []);

  useEffect(() => {
    document.title = 'Dashboard | Taaibosch Organics';
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
    load();
    return () => robots.remove();
  }, [load]);

  useEffect(() => onAuthProblem(status => {
    if (status === 401) setState(null);
    if (status === 428) load();
  }), [load]);

  // Route guards: signed out -> login, first sign-in -> profile set-up
  useEffect(() => {
    if (state === undefined) return;
    if (state === null && pathname !== '/admin/login') navigate('/admin/login');
    if (state && (!state.user.onboarded || state.user.mustChangePassword) && pathname !== '/admin/welcome') navigate('/admin/welcome');
    if (state && state.user.onboarded && !state.user.mustChangePassword && (pathname === '/admin/login' || pathname === '/admin/welcome')) navigate('/admin');
  }, [state, pathname, navigate]);

  if (state === undefined) return <div className="min-h-screen bg-brand-green-light"><Spinner /></div>;

  if (state === null) {
    return <NotifyProvider><Login onSignedIn={setState} /></NotifyProvider>;
  }

  const auth: AuthState = {
    user: state.user,
    permissions: state.permissions,
    can: area => state.permissions.includes(area),
    setUser: user => setState(s => (s ? { ...s, user } : s)),
    logout: async () => {
      await api('logout', { method: 'POST', body: {} }).catch(() => {});
      setState(null);
    },
  };

  if (!state.user.onboarded || state.user.mustChangePassword) {
    return (
      <AuthCtx.Provider value={auth}>
        <NotifyProvider><Onboarding /></NotifyProvider>
      </AuthCtx.Provider>
    );
  }

  return (
    <AuthCtx.Provider value={auth}>
      <NotifyProvider>
        <Shell>
          <Routes>
            <Route path="/admin" element={auth.can('reports') ? <Overview /> : <Orders />} />
            <Route path="/admin/orders" element={<Guard area="orders"><Orders /></Guard>} />
            <Route path="/admin/orders/:ref" element={<Guard area="orders"><OrderDetail /></Guard>} />
            <Route path="/admin/products" element={<Guard area="products"><Products /></Guard>} />
            <Route path="/admin/products/new" element={<Guard area="products"><ProductEditor /></Guard>} />
            <Route path="/admin/products/:id" element={<Guard area="products"><ProductEditor /></Guard>} />
            <Route path="/admin/reviews" element={<Guard area="reviews"><Reviews /></Guard>} />
            <Route path="/admin/settings" element={<Guard area="settings"><SettingsPage /></Guard>} />
            <Route path="/admin/team" element={<Guard area="team"><Team /></Guard>} />
            <Route path="/admin/profile" element={<Profile />} />
            <Route path="*" element={<Overview />} />
          </Routes>
        </Shell>
      </NotifyProvider>
    </AuthCtx.Provider>
  );
}

const Guard: React.FC<{ area: string; children: React.ReactNode }> = ({ area, children }) => {
  const { can } = useAuth();
  return can(area) ? <>{children}</> : (
    <div className="py-20 text-center text-sm text-brand-ink/50">Your role doesn't include this section. Ask an owner if you need access.</div>
  );
};

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, can, logout } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { setMenuOpen(false); window.scrollTo(0, 0); }, [pathname]);
  const items = NAV.filter(n => can(n.area));
  const active = (to: string, exact?: boolean) => (exact ? pathname === to : pathname === to || pathname.startsWith(to + '/'));

  const navList = (
    <nav className="space-y-1" aria-label="Dashboard">
      {items.map(n => (
        <Link
          key={n.to}
          to={n.to}
          className={cn('flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all', active(n.to, n.exact) ? 'bg-brand-green-deep text-white shadow-sm' : 'text-brand-ink/60 hover:bg-white hover:text-brand-ink')}
        >
          <n.icon size={18} /> {n.label}
        </Link>
      ))}
    </nav>
  );

  const userCard = (
    <div className="space-y-1">
      <Link to="/admin/profile" className={cn('flex items-center gap-3 p-3 rounded-2xl transition-all', pathname === '/admin/profile' ? 'bg-white' : 'hover:bg-white')}>
        <span className="w-10 h-10 rounded-full bg-brand-green-deep text-white flex items-center justify-center font-semibold">{nameOf(user).charAt(0).toUpperCase()}</span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold truncate">{nameOf(user)}</span>
          <span className="block text-xs text-brand-ink/50 truncate">{user.jobTitle || roleLabel(user.role)}</span>
        </span>
      </Link>
      <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm text-brand-ink/60 hover:bg-white"><ExternalLink size={16} /> View shop</a>
      <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm text-brand-ink/60 hover:bg-white"><LogOut size={16} /> Sign out</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-green-light">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col justify-between p-5 border-r border-black/5">
        <div className="space-y-8">
          <Link to="/admin" className="block px-2 pt-2">
            <img src="/assets/logo.webp" alt="Taaibosch Organics" className="h-8 w-auto" />
            <span className="block mt-2 text-[10px] uppercase tracking-[0.25em] font-bold text-brand-ink/40">Team dashboard</span>
          </Link>
          {navList}
        </div>
        {userCard}
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-brand-green-light/90 backdrop-blur border-b border-black/5 px-4 py-3 flex items-center justify-between">
        <Link to="/admin"><img src="/assets/logo.webp" alt="Taaibosch Organics" className="h-6 w-auto" /></Link>
        <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="p-2 rounded-xl bg-white shadow-sm"><Menu size={20} /></button>
      </header>
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-xs bg-brand-green-light p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex justify-end"><button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="p-2 rounded-xl bg-white"><X size={18} /></button></div>
              {navList}
            </div>
            {userCard}
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10 pb-28 lg:pb-10">{children}</div>
      </main>

      {/* Mobile bottom tabs */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-black/5 px-2 pb-[env(safe-area-inset-bottom)]" aria-label="Quick navigation">
        <div className="flex justify-around">
          {items.slice(0, 4).map(n => (
            <Link key={n.to} to={n.to} className={cn('flex flex-col items-center gap-1 py-2.5 px-3 text-[10px] font-semibold', active(n.to, n.exact) ? 'text-brand-green-deep' : 'text-brand-ink/40')}>
              <n.icon size={20} /> {n.label}
            </Link>
          ))}
          <Link to="/admin/profile" className={cn('flex flex-col items-center gap-1 py-2.5 px-3 text-[10px] font-semibold', pathname === '/admin/profile' ? 'text-brand-green-deep' : 'text-brand-ink/40')}>
            <UserCircle size={20} /> Me
          </Link>
        </div>
      </nav>
    </div>
  );
};

export const roleLabel = (r: string) => ({ owner: 'Owner', manager: 'Manager', fulfilment: 'Orders & packing' } as Record<string, string>)[r] ?? r;
