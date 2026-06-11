import { FormEvent, useEffect, useState } from 'react';
import { serviceCategories } from '@shared/types';
import { apiFetch } from '@/lib/api';
import { StatusPill } from '@/components/StatusPill';
import type { PrivateProfessionalProfile } from '@/types';

export function ProfessionalSettings() {
  const [profile, setProfile] = useState<PrivateProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void apiFetch<PrivateProfessionalProfile | null>('/api/professionals/me')
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : 'Profile failed to load'))
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');

    const form = new FormData(event.currentTarget);
    const body = buildProfilePayload(form);

    try {
      const saved = await apiFetch<PrivateProfessionalProfile>('/api/professionals/me', {
        method: profile ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      });
      setProfile(saved);
      setMessage('Profile saved and submitted for review.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile could not be saved');
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <ProfileHeader profile={profile} />
      {loading && <p className="card p-5 font-semibold text-ink/65">Loading profile settings…</p>}
      {!loading && (
        <form onSubmit={onSubmit} className="card grid gap-6 p-6">
          <IdentityFields profile={profile} />
          <LocationFields profile={profile} />
          <MediaFields profile={profile} />
          <PrivateDetailsFields profile={profile} />
          <FormMessages message={message} error={error} />
          <button className="primary-button w-fit" type="submit">Save profile</button>
        </form>
      )}
    </section>
  );
}

function buildProfilePayload(form: FormData) {
  return {
    displayName: String(form.get('displayName')),
    headline: String(form.get('headline')),
    bio: String(form.get('bio')),
    category: String(form.get('category')),
    specialties: String(form.get('specialties') || '').split(',').map((item) => item.trim()).filter(Boolean),
    city: String(form.get('city')),
    state: String(form.get('state')),
    addressLine1: String(form.get('addressLine1') || ''),
    postalCode: String(form.get('postalCode') || ''),
    profileImageUrl: String(form.get('profileImageUrl') || ''),
    coverImageUrl: String(form.get('coverImageUrl') || ''),
    instagramUrl: String(form.get('instagramUrl') || ''),
    websiteUrl: String(form.get('websiteUrl') || ''),
    licenseLabel: String(form.get('licenseLabel') || ''),
  };
}

function ProfileHeader({ profile }: { profile: PrivateProfessionalProfile | null }) {
  return (
    <div className="mb-8">
      <h1 className="text-4xl font-black text-ink">Professional profile</h1>
      <p className="mt-3 text-ink/65">Create a complete profile clients can trust. Edits return the profile to review before public display.</p>
      {profile?.status === 'pending_review' && (
        <p className="mt-4 rounded-2xl bg-gold/20 p-4 text-sm font-semibold text-ink">Your profile is waiting for review. Clients cannot find or book it until it is approved.</p>
      )}
      {profile?.status === 'suspended' && (
        <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">Your profile is suspended and hidden from public booking. Update any requested details and wait for review before it can go live again.</p>
      )}
      {profile?.status && <div className="mt-4"><StatusPill status={profile.status} /></div>}
    </div>
  );
}

function IdentityFields({ profile }: { profile: PrivateProfessionalProfile | null }) {
  return (
    <section className="grid gap-4">
      <h2 className="text-xl font-black text-ink">Public identity</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="displayName" label="Display name" defaultValue={profile?.displayName} required />
        <Field name="headline" label="Headline" defaultValue={profile?.headline} required />
      </div>
      <label className="label">Bio<textarea className="input mt-2 min-h-36" name="bio" defaultValue={profile?.bio} required minLength={20} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="label">Category
          <select className="input mt-2" name="category" defaultValue={profile?.category} required>
            {serviceCategories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <Field name="specialties" label="Specialties separated by commas" defaultValue={profile?.specialties?.join(', ')} />
      </div>
    </section>
  );
}

function LocationFields({ profile }: { profile: PrivateProfessionalProfile | null }) {
  return (
    <section className="grid gap-4">
      <h2 className="text-xl font-black text-ink">Location</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="city" label="City" defaultValue={profile?.city} required />
        <Field name="state" label="State" defaultValue={profile?.state} required />
      </div>
      <p className="text-sm text-ink/55">City and state are public. Exact address details stay in private profile management and moderation workflows.</p>
    </section>
  );
}

function MediaFields({ profile }: { profile: PrivateProfessionalProfile | null }) {
  return (
    <section className="grid gap-4">
      <h2 className="text-xl font-black text-ink">Media and links</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="profileImageUrl" label="Profile image URL" defaultValue={profile?.profileImageUrl ?? ''} />
        <Field name="coverImageUrl" label="Cover image URL" defaultValue={profile?.coverImageUrl ?? ''} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="instagramUrl" label="Instagram URL" defaultValue={profile?.instagramUrl ?? ''} />
        <Field name="websiteUrl" label="Website URL" defaultValue={profile?.websiteUrl ?? ''} />
      </div>
    </section>
  );
}

function PrivateDetailsFields({ profile }: { profile: PrivateProfessionalProfile | null }) {
  return (
    <section className="grid gap-4">
      <h2 className="text-xl font-black text-ink">Private details</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field name="addressLine1" label="Address line" defaultValue={profile?.addressLine1 ?? ''} />
        <Field name="postalCode" label="Postal code" defaultValue={profile?.postalCode ?? ''} />
        <Field name="licenseLabel" label="License or credential" defaultValue={profile?.licenseLabel ?? ''} />
      </div>
    </section>
  );
}

function FormMessages({ message, error }: { message: string; error: string }) {
  return (
    <>
      {message && <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</p>}
      {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
    </>
  );
}

function Field({ label, name, defaultValue, required = false }: { label: string; name: string; defaultValue?: string | null; required?: boolean }) {
  return <label className="label">{label}<input className="input mt-2" name={name} defaultValue={defaultValue ?? ''} required={required} /></label>;
}
