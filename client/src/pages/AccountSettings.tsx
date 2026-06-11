import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import type { User } from '@/types';

export function AccountSettings() {
  const { user, refresh } = useAuth();
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  async function updateAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    const form = new FormData(event.currentTarget);
    try {
      await apiFetch<User>('/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: form.get('firstName'),
          lastName: form.get('lastName'),
          phone: form.get('phone'),
          avatarUrl: form.get('avatarUrl'),
        }),
      });
      await refresh();
      setProfileSuccess('Account details saved.');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Could not save account details');
    }
  }

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    try {
      await apiFetch<{ message: string }>('/api/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      event.currentTarget.reset();
      setPasswordSuccess('Password updated.');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Could not update password');
    }
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
          <h2 className="text-2xl font-black text-ink">Profile basics</h2>
          {profileError && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{profileError}</p>}
          {profileSuccess && <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{profileSuccess}</p>}
          <input className="input" name="firstName" defaultValue={user?.firstName ?? ''} placeholder="First name" required />
          <input className="input" name="lastName" defaultValue={user?.lastName ?? ''} placeholder="Last name" required />
          <input className="input" name="phone" defaultValue={user?.phone ?? ''} placeholder="Phone" />
          <input className="input" name="avatarUrl" defaultValue={user?.avatarUrl ?? ''} placeholder="Avatar image URL" />
          <button className="primary-button w-full" type="submit">Save account</button>
        </form>

        <form onSubmit={updatePassword} className="card space-y-4 p-6">
          <h2 className="text-2xl font-black text-ink">Password</h2>
          {passwordError && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{passwordError}</p>}
          {passwordSuccess && <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{passwordSuccess}</p>}
          <input className="input" name="currentPassword" type="password" placeholder="Current password" required />
          <input className="input" name="newPassword" type="password" minLength={10} placeholder="New password" required />
          <input className="input" name="confirmPassword" type="password" minLength={10} placeholder="Confirm new password" required />
          <button className="primary-button w-full" type="submit">Update password</button>
        </form>
      </div>
    </section>
  );
}
