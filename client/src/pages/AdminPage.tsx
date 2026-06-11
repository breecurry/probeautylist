import { useEffect, useState } from 'react';
import { StatusPill } from '@/components/StatusPill';
import { apiFetch } from '@/lib/api';
import type { AdminAction, ProfessionalProfile } from '@/types';

type Stats = { users: number; professionals: number; bookings: number; reviews: number };

type ModerationAction = 'approve' | 'request-changes' | 'suspend';

type AdminState = {
  stats: Stats | null;
  pending: ProfessionalProfile[];
  actions: AdminAction[];
};

const initialState: AdminState = { stats: null, pending: [], actions: [] };

function ErrorNotice({ message }: { message: string }) {
  if (!message) return null;
  return <p className="mt-6 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p>;
}

function StatsGrid({ stats }: { stats: Stats | null }) {
  if (!stats) return null;
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-4">
      {Object.entries(stats).map(([key, value]) => (
        <div className="card p-5" key={key}>
          <p className="text-sm font-bold uppercase tracking-wide text-ink/50">{key}</p>
          <p className="mt-2 text-3xl font-black text-rosewood">{value}</p>
        </div>
      ))}
    </div>
  );
}

function PendingProfiles({
  profiles,
  noteByProfile,
  actionId,
  onNoteChange,
  onModerate,
}: {
  profiles: ProfessionalProfile[];
  noteByProfile: Record<string, string>;
  actionId: string;
  onNoteChange: (profileId: string, note: string) => void;
  onModerate: (profileId: string, action: ModerationAction) => void;
}) {
  return (
    <div className="card p-6">
      <h2 className="text-2xl font-black text-ink">Pending professional profiles</h2>
      <div className="mt-5 space-y-4">
        {profiles.length === 0 && <p className="text-ink/60">No profiles are waiting for review.</p>}
        {profiles.map((profile) => {
          const isWorking = actionId === profile.id;
          return (
            <div className="rounded-3xl border border-rosewood/10 bg-white p-5" key={profile.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-ink">{profile.displayName}</p>
                  <p className="text-sm text-ink/60">{profile.category} · {profile.city}, {profile.state}</p>
                  <p className="mt-2 text-sm text-ink/70">{profile.headline}</p>
                </div>
                <StatusPill status={profile.status ?? 'pending_review'} />
              </div>
              <textarea
                className="input mt-4 min-h-24"
                value={noteByProfile[profile.id] ?? ''}
                onChange={(event) => onNoteChange(profile.id, event.target.value)}
                placeholder="Optional moderation note. This is saved in the admin log and used in change/suspension notifications."
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <button className="primary-button disabled:cursor-not-allowed disabled:opacity-60" onClick={() => onModerate(profile.id, 'approve')} disabled={isWorking}>{isWorking ? 'Saving...' : 'Approve'}</button>
                <button className="secondary-button disabled:cursor-not-allowed disabled:opacity-60" onClick={() => onModerate(profile.id, 'request-changes')} disabled={isWorking}>{isWorking ? 'Saving...' : 'Request changes'}</button>
                <button className="rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60" onClick={() => onModerate(profile.id, 'suspend')} disabled={isWorking}>{isWorking ? 'Saving...' : 'Suspend'}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentAdminActions({ actions }: { actions: AdminAction[] }) {
  return (
    <div className="card p-6">
      <h2 className="text-2xl font-black text-ink">Recent admin actions</h2>
      <div className="mt-5 space-y-3">
        {actions.length === 0 && <p className="text-ink/60">No admin actions have been recorded yet.</p>}
        {actions.map((action) => (
          <div className="rounded-2xl bg-blush/40 p-4" key={action.id}>
            <p className="font-bold capitalize text-ink">{action.action.replaceAll('_', ' ')}</p>
            <p className="text-xs text-ink/50">{new Date(action.createdAt).toLocaleString()}</p>
            {action.note && <p className="mt-2 text-sm text-ink/70">{action.note}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminPage() {
  const [state, setState] = useState<AdminState>(initialState);
  const [noteByProfile, setNoteByProfile] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState('');

  async function load() {
    const [stats, pending, actions] = await Promise.all([
      apiFetch<Stats>('/api/admin/stats'),
      apiFetch<ProfessionalProfile[]>('/api/admin/professionals/pending'),
      apiFetch<AdminAction[]>('/api/admin/actions'),
    ]);
    setState({ stats, pending, actions });
  }

  useEffect(() => {
    void load()
      .catch((err) => setError(err instanceof Error ? err.message : 'Admin data failed to load'))
      .finally(() => setIsLoading(false));
  }, []);

  async function moderate(id: string, action: ModerationAction) {
    setError('');
    setActionId(id);
    const note = noteByProfile[id] ?? '';
    try {
      await apiFetch(`/api/admin/professionals/${id}/${action}`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      });
      setNoteByProfile((current) => ({ ...current, [id]: '' }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete moderation action');
    } finally {
      setActionId('');
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <p className="eyebrow">Admin</p>
      <h1 className="text-4xl font-black text-ink">Marketplace operations</h1>
      <p className="mt-3 max-w-3xl text-ink/70">Review professional applications, leave an audit trail, and control whether profiles are visible in public search.</p>
      <ErrorNotice message={error} />

      {isLoading ? (
        <div className="card mt-8 p-8 text-ink/60">Loading marketplace operations...</div>
      ) : (
        <>
          <StatsGrid stats={state.stats} />
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_.8fr]">
            <PendingProfiles
              profiles={state.pending}
              noteByProfile={noteByProfile}
              actionId={actionId}
              onNoteChange={(profileId, note) => setNoteByProfile((current) => ({ ...current, [profileId]: note }))}
              onModerate={(profileId, action) => void moderate(profileId, action)}
            />
            <RecentAdminActions actions={state.actions} />
          </div>
        </>
      )}
    </section>
  );
}
