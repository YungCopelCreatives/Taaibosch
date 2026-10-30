import React, { useEffect, useState } from 'react';
import { UserPlus, Copy, Check, KeyRound, ShieldCheck } from 'lucide-react';
import { api, ApiError, shortDate } from '../api';
import { Badge, Button, Card, Field, Input, Modal, PageHeader, Select, Spinner, useNotify } from '../ui';
import { useAuth, nameOf, roleLabel } from '../AdminApp';
import type { AdminRole, AdminUser } from '../../types';

const ROLE_HELP: Record<AdminRole, string> = {
  owner: 'Everything, including adding and removing team members.',
  manager: 'Orders, products, prices, reviews and settings. Cannot manage the team.',
  fulfilment: 'Orders only: see what to pack, update status and tracking. Cannot see sales totals or change products.',
};

export const Team: React.FC = () => {
  const { user: me } = useAuth();
  const notify = useNotify();
  const [team, setTeam] = useState<AdminUser[] | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState({ email: '', firstName: '', role: 'fulfilment' as AdminRole });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; tempPassword: string; emailed: boolean; loginUrl: string } | null>(null);

  const load = () => api('team').then(d => setTeam(d.team));
  useEffect(() => { load(); }, []);

  const invite = async () => {
    setBusy(true);
    setErrors({});
    try {
      const res = await api('team', { body: form });
      setInviteOpen(false);
      setCredentials(res);
      setForm({ email: '', firstName: '', role: 'fulfilment' });
      load();
    } catch (e) {
      if (e instanceof ApiError) setErrors({ ...e.fields, _form: e.message });
    } finally {
      setBusy(false);
    }
  };

  const update = async (u: AdminUser, patch: Record<string, unknown>, msg: string) => {
    try {
      const res = await api(`team/${u.id}`, { method: 'PATCH', body: patch });
      if (res.tempPassword) setCredentials({ email: u.email, tempPassword: res.tempPassword, emailed: res.emailed, loginUrl: `${location.origin}/admin/login` });
      else notify(msg);
      load();
    } catch (e: any) {
      notify(e.message, 'error');
    }
  };

  return (
    <div>
      <PageHeader title="Team" subtitle="Who can sign in to this dashboard." actions={<Button onClick={() => setInviteOpen(true)}><UserPlus size={16} /> Add team member</Button>} />

      <Card>
        {!team ? <Spinner /> : (
          <ul className="divide-y divide-black/5">
            {team.map(u => (
              <li key={u.id} className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-3 flex-grow min-w-0">
                  <span className="w-11 h-11 rounded-full bg-brand-green-deep text-white flex items-center justify-center font-semibold flex-shrink-0">{nameOf(u).charAt(0).toUpperCase()}</span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{u.firstName ? `${u.firstName} ${u.lastName ?? ''}` : u.email}</span>
                      {u.id === me.id && <Badge className="bg-brand-green-light text-brand-green-deep">You</Badge>}
                      {!u.active && <Badge className="bg-brand-grey text-brand-ink/50">No access</Badge>}
                      {u.active && !u.onboarded && <Badge className="bg-amber-50 text-amber-800">Invite sent</Badge>}
                    </span>
                    <span className="block text-xs text-brand-ink/40 truncate">{u.email}{u.jobTitle ? ` · ${u.jobTitle}` : ''} · last sign-in {u.lastLoginAt ? shortDate(u.lastLoginAt) : 'never'}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={u.role} onChange={e => update(u, { role: e.target.value }, 'Role updated')} disabled={u.id === me.id} className="w-auto py-2 text-xs" aria-label={`Role for ${u.email}`}>
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                    <option value="fulfilment">Orders & packing</option>
                  </Select>
                  {u.id !== me.id && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => confirm(`Reset ${u.email}'s password? They'll get a new temporary password.`) && update(u, { resetPassword: true }, '')}><KeyRound size={14} /> Reset password</Button>
                      <Button variant={u.active ? 'danger' : 'secondary'} size="sm" onClick={() => update(u, { active: !u.active }, u.active ? 'Access removed' : 'Access restored')}>
                        {u.active ? 'Remove access' : 'Restore access'}
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-6 mt-6 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><ShieldCheck size={18} className="text-brand-green-deep" /> What each role can do</h2>
        {(Object.keys(ROLE_HELP) as AdminRole[]).map(r => (
          <p key={r} className="text-sm"><strong>{roleLabel(r)}:</strong> <span className="text-brand-ink/60">{ROLE_HELP[r]}</span></p>
        ))}
      </Card>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Add team member"
        footer={<><Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button><Button loading={busy} onClick={invite}>Create login</Button></>}>
        <div className="space-y-4">
          <Field label="Email" error={errors.email}><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} invalid={!!errors.email} autoFocus /></Field>
          <Field label="First name (optional)"><Input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></Field>
          <Field label="Role" hint={ROLE_HELP[form.role]}>
            <Select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as AdminRole })}>
              <option value="fulfilment">Orders & packing</option>
              <option value="manager">Manager</option>
              <option value="owner">Owner</option>
            </Select>
          </Field>
          {errors._form && !errors.email && <p className="text-sm text-red-600">{errors._form}</p>}
          <p className="text-xs text-brand-ink/50">We'll create a temporary password. On their first sign-in they'll set up their profile and choose their own password.</p>
        </div>
      </Modal>

      <Modal open={!!credentials} onClose={() => setCredentials(null)} title="Login details" footer={<Button onClick={() => setCredentials(null)}>Done</Button>}>
        {credentials && <Credentials {...credentials} />}
      </Modal>
    </div>
  );
};

const Credentials: React.FC<{ email: string; tempPassword: string; emailed: boolean; loginUrl: string }> = ({ email, tempPassword, emailed, loginUrl }) => {
  const [copied, setCopied] = useState(false);
  const text = `Your Taaibosch dashboard login\n${loginUrl}\nEmail: ${email}\nTemporary password: ${tempPassword}\nYou'll set your own password when you first sign in.`;
  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-ink/70">{emailed ? `We've emailed these details to ${email}. You can also share them yourself:` : 'Share these details with them (for example on WhatsApp). This password is only shown once.'}</p>
      <div className="p-4 rounded-2xl bg-brand-grey font-mono text-sm space-y-1 break-all">
        <p>{loginUrl}</p>
        <p>{email}</p>
        <p className="font-bold">{tempPassword}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => { navigator.clipboard.writeText(text); setCopied(true); }}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}</Button>
        <a className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366] text-white text-xs font-semibold" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">Send on WhatsApp</a>
      </div>
    </div>
  );
};
