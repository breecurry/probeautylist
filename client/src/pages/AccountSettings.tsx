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
  const [savingProfile, setSavingProfile] = useState(false);

  async function updateAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingProfile) return;

    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    const form = new FormData(event.currentTarget);
    try {
      await apiFetch<{ user: User }>('/api/auth/account', {
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
        <p className="mt-3 max-w-2xl text-ink/70">
          Keep your marketplace profile current. Sign-in, password, email, and security settings are managed through your secure account menu.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
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

        <aside className="card flex flex-col justify-between gap-6 p-6">
          <div>
            <h2 className="text-2xl font-black text-ink">Security</h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">
              Password, email, multi-factor authentication, and session controls are handled by the secure account menu in the top navigation.
            </p>
          </div>
          <div className="rounded-3xl border border-clay/40 bg-blush/40 p-5 text-sm leading-6 text-ink/70">
            Open the profile menu in the header to manage sign-in credentials and security settings. This keeps authentication in one reliable place and avoids duplicate password systems.
          </div>
        </aside>
      </div>
    </section>
  );
}
