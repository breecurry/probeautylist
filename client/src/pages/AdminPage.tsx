import { useEffect, useState } from 'react';
import { apiFetch, formatDateTime } from '@/lib/api';
import { StatusPill } from '@/components/StatusPill';
import type { AdminAction, ProfessionalProfile } from '@/types';

type Stats = { users: number; professionals: number; bookings: number; reviews: number };

export function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pending, setPending] = useState<ProfessionalProfile[]>([]);
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [error, setError] = useState('');

  async function load() {
    const [loadedStats, loadedPending, loadedActions] = await Promise.all([
      apiFetch<Stats>('/api/admin/stats'),
      apiFetch<ProfessionalProfile[]>('/api/admin/professionals/pending'),
      apiFetch<AdminAction[]>('/api/admin/actions'),
    ]);
    setStats(loadedStats);
    setPending(loadedPending);
    setActions(loadedActions);
  }

  useEffect(() => { void load().catch((err) => setError(err instanceof Error ? err.message : 'Admin data failed to load')); }, []);

  async function approve(id: string) {
    await apiFetch(`/api/professionals/${id}/approve`, { method: 'POST' });
    await load();
  }

  return <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><h1 className="text-4xl font-black text-ink">Admin</h1>{error && <p className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">{error}</p>}<div className="mt-8 grid gap-4 md:grid-cols-4">{stats && Object.entries(stats).map(([key, value]) => <div key={key} className="card p-5"><p className="text-sm font-bold uppercase tracking-wide text-ink/40">{key}</p><p className="mt-2 text-3xl font-black text-rosewood">{value}</p></div>)}</div><h2 className="mt-10 text-2xl font-black text-ink">Pending professional profiles</h2><div className="mt-5 space-y-4">{pending.map((profile) => <div key={profile.id} className="card p-5"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><h3 className="text-xl font-black text-ink">{profile.displayName}</h3><p className="mt-2 text-sm text-ink/60">{profile.category} · {profile.city}, {profile.state}</p><p className="mt-2 text-sm leading-6 text-ink/65">{profile.headline}</p>{profile.licenseLabel && <p className="mt-2 text-xs font-bold uppercase tracking-wide text-berry">{profile.licenseLabel}</p>}</div><div className="flex items-center gap-3"><StatusPill status={profile.status || 'pending_review'} /><button className="primary-button" onClick={() => void approve(profile.id)}>Approve</button></div></div></div>)}{pending.length === 0 && <div className="card p-8 text-ink/60">No pending profiles.</div>}</div><h2 className="mt-10 text-2xl font-black text-ink">Recent admin actions</h2><div className="mt-5 space-y-3">{actions.map((action) => <div key={action.id} className="card p-4"><p className="font-black text-ink">{action.action.replaceAll('_', ' ')} · {action.targetType}</p><p className="mt-1 text-sm text-ink/55">{action.note || action.targetId}</p><p className="mt-2 text-xs font-bold text-ink/40">{formatDateTime(action.createdAt)}</p></div>)}{actions.length === 0 && <div className="card p-8 text-ink/60">No admin actions recorded yet.</div>}</div></section>;
}
