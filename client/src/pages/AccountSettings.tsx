import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { formText, optionalFormText } from '@/lib/forms';
import type { User } from '@/types';

type NoticeTone = 'success' | 'error';

type NoticeProps = {
  message: string;
  tone: NoticeTone;
};

function Notice({ message, tone }: NoticeProps) {
  const toneClass = tone === 'success'
    ? 'bg-emerald-50 text-emerald-700'
    : 'bg-red-50 text-red-700';

  return <p className={`rounded-2xl p-3 text-sm font-semibold ${toneClass}`}>{message}</p>;
}

function SubmitButton({ children, pending }: { children: React.ReactNode; pending: boolean }) {
  return (
    <button className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={pending}>
      {pending ? 'Saving…' : children}
    </button>
  );
}

export function AccountSettings() {
  const { user, refresh, loading } = useAuth();
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function updateAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingProfile) return;

    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    const form = new FormData(event.currentTarget);
    try {
      await apiFetch<User>('/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: formText(form, 'firstName'),
          lastName: formText(form, 'lastName'),
          phone: optionalFormText(form, 'phone'),
          avatarUrl: optionalFormText(form, 'avatarUrl'),
        }),
      });
      await refresh();
      setProfileSuccess('Account details saved.');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Could not save account details');
    } finally {
      setSavingProfile(false);
    }
  }

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingPassword) return;

    setPasswordError('');
    setPasswordSuccess('');

    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get('currentPassword') ?? '');
    const newPassword = String(form.get('newPassword') ?? '');
    const confirmPassword = String(form.get('confirmPassword') ?? '');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await apiFetch<{ message: string }>('/api/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      event.currentTarget.reset();
      setPasswordSuccess('Password updated.');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Could not update password');
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="card p-6 text-sm font-semibold text-ink/70">Loading account settings…</div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <p className="eyebrow">Account</p>
        <h1 className="text-4xl font-black text-ink">Your account settings</h1>
        <p className="mt-3 max-w-2xl text-ink/70">Keep your contact information current and rotate your password without needing database access or manual support.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={updateAccount} className="card space-y-4 p-6">
          <div>
            <h2 className="text-2xl font-black text-ink">Profile basics</h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">These details identify your account across protected workflows.</p>
          </div>
          {profileError && <Notice message={profileError} tone="error" />}
          {profileSuccess && <Notice message={profileSuccess} tone="success" />}
          <label className="label">First name<input className="input mt-2" name="firstName" defaultValue={user?.firstName ?? ''} minLength={1} maxLength={80} required disabled={savingProfile} /></label>
          <label className="label">Last name<input className="input mt-2" name="lastName" defaultValue={user?.lastName ?? ''} minLength={1} maxLength={80} required disabled={savingProfile} /></label>
          <label className="label">Phone<input className="input mt-2" name="phone" defaultValue={user?.phone ?? ''} autoComplete="tel" maxLength={40} disabled={savingProfile} /></label>
          <label className="label">Avatar image URL<input className="input mt-2" name="avatarUrl" type="url" defaultValue={user?.avatarUrl ?? ''} disabled={savingProfile} /></label>
          <SubmitButton pending={savingProfile}>Save account</SubmitButton>
        </form>

        <form onSubmit={updatePassword} className="card space-y-4 p-6">
          <div>
            <h2 className="text-2xl font-black text-ink">Password</h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">Use at least 10 characters and avoid reusing a password from another service.</p>
          </div>
          {passwordError && <Notice message={passwordError} tone="error" />}
          {passwordSuccess && <Notice message={passwordSuccess} tone="success" />}
          <label className="label">Current password<input className="input mt-2" name="currentPassword" type="password" autoComplete="current-password" required disabled={savingPassword} /></label>
          <label className="label">New password<input className="input mt-2" name="newPassword" type="password" minLength={10} autoComplete="new-password" required disabled={savingPassword} /></label>
          <label className="label">Confirm new password<input className="input mt-2" name="confirmPassword" type="password" minLength={10} autoComplete="new-password" required disabled={savingPassword} /></label>
          <SubmitButton pending={savingPassword}>Update password</SubmitButton>
        </form>
      </div>
    </section>
  );
}
