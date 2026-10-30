/** Shared dashboard building blocks, styled with the Taaibosch brand. */

import React, { createContext, useCallback, useContext, useEffect, useId, useState } from 'react';
import { Loader2, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/cn';
import type { FulfilmentStatus, OrderStatus } from '../types';

export const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={cn('bg-white rounded-3xl border border-black/5 shadow-[0_2px_10px_rgba(0,0,0,0.03)]', className)}>{children}</div>
);

export const PageHeader: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode }> = ({ title, subtitle, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
    <div>
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-brand-ink/50 mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; loading?: boolean; size?: 'sm' | 'md' };
export const Button: React.FC<BtnProps> = ({ variant = 'primary', loading, size = 'md', className, children, disabled, ...rest }) => (
  <button
    {...rest}
    disabled={disabled || loading}
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap',
      size === 'sm' ? 'px-4 py-2 text-xs' : 'px-6 py-3 text-sm',
      variant === 'primary' && 'bg-brand-green-deep text-white hover:opacity-90 shadow-sm',
      variant === 'secondary' && 'bg-white border border-black/10 text-brand-ink hover:bg-brand-grey',
      variant === 'ghost' && 'text-brand-ink/60 hover:text-brand-ink hover:bg-brand-grey',
      variant === 'danger' && 'bg-red-50 text-red-700 hover:bg-red-100',
      className,
    )}
  >
    {loading && <Loader2 size={16} className="animate-spin" />}
    {children}
  </button>
);

export const inputCls =
  'w-full px-4 py-3 bg-brand-grey rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-deep/40 placeholder:text-brand-ink/30 transition-all';

export const Field: React.FC<{ label: string; error?: string; hint?: string; children: React.ReactNode; className?: string; htmlFor?: string }> = ({ label, error, hint, children, className, htmlFor }) => {
  const autoId = useId();
  // Link the label to the control so screen readers (and taps on the label) work.
  const child = React.isValidElement(children) ? (children as React.ReactElement<any>) : null;
  const id = htmlFor ?? child?.props?.id ?? autoId;
  const msgId = error || hint ? `${id}-msg` : undefined;
  const control = child && !child.props.id ? React.cloneElement(child, { id, 'aria-describedby': msgId, 'aria-invalid': error ? true : undefined }) : children;
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-[11px] uppercase tracking-widest font-bold text-brand-ink/50">{label}</label>
      {control}
      {(error || hint) && <p id={msgId} className={cn('text-xs', error ? 'text-red-600' : 'text-brand-ink/40')}>{error || hint}</p>}
    </div>
  );
};

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  ({ className, invalid, ...rest }, ref) => <input ref={ref} {...rest} className={cn(inputCls, invalid && 'ring-2 ring-red-400/60', className)} />,
);
Input.displayName = 'Input';

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }> = ({ className, invalid, ...rest }) => (
  <textarea {...rest} className={cn(inputCls, 'resize-y min-h-[88px]', invalid && 'ring-2 ring-red-400/60', className)} />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className, children, ...rest }) => (
  <select {...rest} className={cn(inputCls, 'appearance-none pr-10 bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 fill=%27none%27 stroke=%27%231A2419%27 stroke-width=%272%27%3E%3Cpath d=%27M4 6l4 4 4-4%27/%3E%3C/svg%3E")] bg-no-repeat bg-[right_1rem_center]', className)}>
    {children}
  </select>
);

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }> = ({ checked, onChange, label, description }) => (
  <label className="flex items-start justify-between gap-4 cursor-pointer py-1">
    <span>
      <span className="block text-sm font-medium">{label}</span>
      {description && <span className="block text-xs text-brand-ink/50 mt-0.5">{description}</span>}
    </span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('relative w-11 h-6 rounded-full transition-colors flex-shrink-0', checked ? 'bg-brand-green-deep' : 'bg-brand-ink/15')}
    >
      <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', checked && 'translate-x-5')} />
    </button>
  </label>
);

export const Spinner: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <div className="flex items-center justify-center gap-3 py-16 text-brand-ink/40 text-sm">
    <Loader2 className="animate-spin" size={20} /> {label}
  </div>
);

export const Empty: React.FC<{ icon: React.ElementType; title: string; text?: string; action?: React.ReactNode }> = ({ icon: Icon, title, text, action }) => (
  <div className="text-center py-14 px-6 space-y-3">
    <div className="w-14 h-14 rounded-full bg-brand-green-light text-brand-green-deep flex items-center justify-center mx-auto"><Icon size={26} /></div>
    <p className="font-semibold">{title}</p>
    {text && <p className="text-sm text-brand-ink/50 max-w-sm mx-auto">{text}</p>}
    {action}
  </div>
);

const PAY: Record<OrderStatus, [string, string]> = {
  paid: ['Paid', 'bg-brand-green-light text-brand-green-deep'],
  pending: ['Awaiting payment', 'bg-amber-50 text-amber-800'],
  failed: ['Payment failed', 'bg-red-50 text-red-700'],
  cancelled: ['Cancelled', 'bg-brand-grey text-brand-ink/50'],
};
const FUL: Record<FulfilmentStatus, [string, string]> = {
  new: ['To pack', 'bg-blue-50 text-blue-800'],
  packing: ['Packing', 'bg-amber-50 text-amber-800'],
  dispatched: ['Dispatched', 'bg-violet-50 text-violet-800'],
  delivered: ['Delivered', 'bg-brand-green-light text-brand-green-deep'],
  cancelled: ['Cancelled', 'bg-brand-grey text-brand-ink/50'],
};
export const FULFILMENT_LABELS = Object.fromEntries(Object.entries(FUL).map(([k, v]) => [k, v[0]])) as Record<FulfilmentStatus, string>;
export const PAYMENT_LABELS = Object.fromEntries(Object.entries(PAY).map(([k, v]) => [k, v[0]])) as Record<OrderStatus, string>;

export const Badge: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap', className)}>{children}</span>
);
export const PaymentBadge: React.FC<{ status: OrderStatus }> = ({ status }) => <Badge className={PAY[status]?.[1]}>{PAY[status]?.[0] ?? status}</Badge>;
export const FulfilmentBadge: React.FC<{ status: FulfilmentStatus }> = ({ status }) => <Badge className={FUL[status]?.[1]}>{FUL[status]?.[0] ?? status}</Badge>;

// ---- Notifications
type Note = { id: number; kind: 'ok' | 'error'; text: string };
const NoteCtx = createContext<(text: string, kind?: Note['kind']) => void>(() => {});
export const useNotify = () => useContext(NoteCtx);

export const NotifyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const notify = useCallback((text: string, kind: Note['kind'] = 'ok') => {
    const id = Date.now() + Math.random();
    setNotes(n => [...n, { id, kind, text }]);
    setTimeout(() => setNotes(n => n.filter(x => x.id !== id)), 4000);
  }, []);
  return (
    <NoteCtx.Provider value={notify}>
      {children}
      <div className="fixed z-[200] bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm space-y-2 pointer-events-none" aria-live="polite">
        {notes.map(n => (
          <div key={n.id} role="status" className={cn('pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm', n.kind === 'ok' ? 'bg-brand-ink text-white' : 'bg-red-600 text-white')}>
            {n.kind === 'ok' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="flex-grow">{n.text}</span>
          </div>
        ))}
      </div>
    </NoteCtx.Provider>
  );
};

export const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }> = ({ open, onClose, title, children, footer }) => {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-brand-grey"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 pb-6 pt-2 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

/** Editable list of short text items (filters, benefits, ingredients...). */
export const ChipsEditor: React.FC<{ value: string[]; onChange: (v: string[]) => void; placeholder?: string; suggestions?: string[]; label?: string }> = ({ value, onChange, placeholder = 'Type and press Enter', suggestions = [], label = 'Add item' }) => {
  const [draft, setDraft] = useState('');
  const add = (v: string) => {
    const t = v.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft('');
  };
  const unused = suggestions.filter(s => !value.includes(s));
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 p-2 bg-brand-grey rounded-2xl min-h-[52px] items-center">
        {value.map(v => (
          <span key={v} className="inline-flex items-center gap-1 pl-3 pr-1 py-1 bg-white rounded-full text-xs font-medium border border-black/5">
            {v}
            <button type="button" onClick={() => onChange(value.filter(x => x !== v))} aria-label={`Remove ${v}`} className="p-0.5 rounded-full hover:bg-brand-grey text-brand-ink/40"><X size={12} /></button>
          </span>
        ))}
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(draft); }
            if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={() => draft && add(draft)}
          placeholder={value.length ? '' : placeholder}
          aria-label={label}
          className="flex-grow min-w-[120px] bg-transparent text-sm px-2 py-1 focus:outline-none"
        />
      </div>
      {unused.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {unused.map(s => (
            <button key={s} type="button" onClick={() => add(s)} className="px-2.5 py-1 rounded-full text-[11px] border border-dashed border-brand-ink/20 text-brand-ink/50 hover:border-brand-green-deep hover:text-brand-green-deep">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const Segmented: React.FC<{ value: string; onChange: (v: string) => void; options: { value: string; label: string; count?: number }[] }> = ({ value, onChange, options }) => (
  <div className="flex gap-1 p-1 bg-brand-grey rounded-full overflow-x-auto no-scrollbar">
    {options.map(o => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        className={cn('px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all', value === o.value ? 'bg-white shadow-sm text-brand-ink' : 'text-brand-ink/50 hover:text-brand-ink')}
      >
        {o.label}{o.count !== undefined && <span className="ml-1.5 text-brand-ink/40">{o.count}</span>}
      </button>
    ))}
  </div>
);
