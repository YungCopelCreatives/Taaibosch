import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { api, ApiError } from '../api';
import { Button, Field, Input } from '../ui';
import { useAuth, roleLabel } from '../AdminApp';

/** First sign-in: collect the team member's details and replace the temporary password. */
export const Onboarding: React.FC = () => {
  const { user, setUser, logout } = useAuth();
  const [form, setForm] = useState({
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    displayName: user.displayName ?? '',
    jobTitle: user.jobTitle ?? '',
    phone: user.phone ?? '',
    newPassword: '',
    confirm: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.mustChangePassword && form.newPassword !== form.confirm) {
      setErrors({ confirm: "The passwords don't match." });
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      const { user: updated } = await api('onboarding', { body: form });
      setUser(updated);
    } catch (err) {
      setErrors(err instanceof ApiError ? { ...err.fields, _form: Object.keys(err.fields).length ? '' : err.message } : { _form: 'Could not save.' });
      setBusy(false);
    }
  };

  const preview = form.displayName || form.firstName;

  return (
    <div className="min-h-screen bg-brand-green-light flex items-center justify-center p-4 py-10">
      <form onSubmit={submit} className="w-full max-w-xl bg-white rounded-[2rem] p-6 md:p-10 shadow-xl shadow-brand-green-deep/5 space-y-8">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] font-bold text-brand-green-deep">
            <Sparkles size={14} /> Welcome to the team
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">Let's set up your profile</h1>
          <p className="text-sm text-brand-ink/60">
            You're signed in as <strong>{user.email}</strong> ({roleLabel(user.role)}). Tell us who you are so the dashboard can greet you properly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="First name" error={errors.firstName} htmlFor="ob-first">
            <Input id="ob-first" value={form.firstName} onChange={set('firstName')} autoComplete="given-name" invalid={!!errors.firstName} required />
          </Field>
          <Field label="Surname" error={errors.lastName} htmlFor="ob-last">
            <Input id="ob-last" value={form.lastName} onChange={set('lastName')} autoComplete="family-name" invalid={!!errors.lastName} required />
          </Field>
          <Field label="What should we call you?" hint="Shown in the dashboard greeting" htmlFor="ob-display">
            <Input id="ob-display" value={form.displayName} onChange={set('displayName')} placeholder={form.firstName || 'e.g. Lerato'} />
          </Field>
          <Field label="Job title" hint="e.g. Founder, Packing lead" htmlFor="ob-title">
            <Input id="ob-title" value={form.jobTitle} onChange={set('jobTitle')} autoComplete="organization-title" />
          </Field>
          <Field label="Mobile number" className="sm:col-span-2" htmlFor="ob-phone">
            <Input id="ob-phone" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" placeholder="072 123 4567" />
          </Field>
        </div>

        {user.mustChangePassword && (
          <div className="space-y-5 pt-6 border-t border-black/5">
            <div>
              <h2 className="font-semibold">Choose your own password</h2>
              <p className="text-sm text-brand-ink/50">Replace the temporary password you were given. At least 10 characters with letters and numbers.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="New password" error={errors.newPassword} htmlFor="ob-pw">
                <Input id="ob-pw" type="password" value={form.newPassword} onChange={set('newPassword')} autoComplete="new-password" invalid={!!errors.newPassword} required />
              </Field>
              <Field label="Confirm password" error={errors.confirm} htmlFor="ob-pw2">
                <Input id="ob-pw2" type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" invalid={!!errors.confirm} required />
              </Field>
            </div>
          </div>
        )}

        {errors._form && <p role="alert" className="text-sm text-red-600">{errors._form}</p>}

        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button type="button" onClick={logout} className="text-xs font-semibold text-brand-ink/40 hover:text-brand-ink">Sign out</button>
          <Button type="submit" loading={busy} className="w-full sm:w-auto">
            {preview ? `Continue as ${preview}` : 'Continue'}
          </Button>
        </div>
      </form>
    </div>
  );
};
