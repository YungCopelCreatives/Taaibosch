import React, { useState } from 'react';
import { api, ApiError } from '../api';
import { Button, Card, Field, Input, PageHeader, useNotify } from '../ui';
import { useAuth, roleLabel } from '../AdminApp';

export const Profile: React.FC = () => {
  const { user, setUser, logout } = useAuth();
  const notify = useNotify();
  const [form, setForm] = useState({ firstName: user.firstName ?? '', lastName: user.lastName ?? '', displayName: user.displayName ?? '', jobTitle: user.jobTitle ?? '', phone: user.phone ?? '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const save = async (kind: 'profile' | 'password') => {
    if (kind === 'password' && pw.newPassword !== pw.confirm) return setErrors({ confirm: "The passwords don't match." });
    setBusy(kind);
    setErrors({});
    try {
      const { user: u } = await api('me', { method: 'PATCH', body: kind === 'profile' ? form : { currentPassword: pw.currentPassword, newPassword: pw.newPassword } });
      setUser(u);
      if (kind === 'password') setPw({ currentPassword: '', newPassword: '', confirm: '' });
      notify(kind === 'profile' ? 'Profile updated' : 'Password changed');
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.fields);
      notify(e instanceof Error ? e.message : 'Could not save', 'error');
    } finally {
      setBusy(null);
    }
  };

  const f = (k: keyof typeof form) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="My profile" subtitle={`${user.email} · ${roleLabel(user.role)}`} actions={<Button variant="secondary" onClick={logout}>Sign out</Button>} />
      <Card className="p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First name"><Input {...f('firstName')} /></Field>
          <Field label="Surname"><Input {...f('lastName')} /></Field>
          <Field label="What should we call you?"><Input {...f('displayName')} /></Field>
          <Field label="Job title"><Input {...f('jobTitle')} /></Field>
          <Field label="Mobile number" className="sm:col-span-2"><Input type="tel" {...f('phone')} /></Field>
        </div>
        <div className="flex justify-end"><Button loading={busy === 'profile'} onClick={() => save('profile')}>Save profile</Button></div>
      </Card>
      <Card className="p-6 space-y-5">
        <h2 className="font-semibold">Change password</h2>
        <Field label="Current password" error={errors.currentPassword}><Input type="password" autoComplete="current-password" value={pw.currentPassword} onChange={e => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="New password" error={errors.newPassword} hint="10+ characters, letters and numbers"><Input type="password" autoComplete="new-password" value={pw.newPassword} onChange={e => setPw({ ...pw, newPassword: e.target.value })} /></Field>
          <Field label="Confirm new password" error={errors.confirm}><Input type="password" autoComplete="new-password" value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end"><Button variant="secondary" loading={busy === 'password'} disabled={!pw.currentPassword || !pw.newPassword} onClick={() => save('password')}>Change password</Button></div>
      </Card>
    </div>
  );
};
