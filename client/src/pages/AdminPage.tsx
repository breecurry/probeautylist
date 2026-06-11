import { useEffect, useState } from 'react';
import { StatusPill } from '@/components/StatusPill';
import { apiFetch, formatDateTime, formatMoney } from '@/lib/api';
import type { AdminAction, AdminAnalytics, AdminOperations, BookingDispute, ProfessionalProfile } from '@/types';

type Stats = { users: number; professionals: number; bookings: number; reviews: number };
type ModerationAction = 'approve' | 'request-changes' | 'suspend';
type AdminState = { stats: Stats | null; analytics: AdminAnalytics | null; operations: AdminOperations | null; disputes: BookingDispute[]; pending: ProfessionalProfile[]; actions: AdminAction[] };
const initialState: AdminState = { stats: null, analytics: null, operations: null, disputes: [], pending: [], actions: [] };

function ErrorNotice({ message }: { message: string }) {
  if (!message) return null;
  return <p className="mt-6 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p>;
}

function StatsGrid({ stats, analytics }: { stats: Stats | null; analytics: AdminAnalytics | null }) {
  if (!stats) return null;
  const cards = [
    ['Users', stats.users],
    ['Professionals', stats.professionals],
    ['Bookings', stats.bookings],
    ['Reviews', stats.reviews],
    ['30-day revenue', analytics ? formatMoney(analytics.thirtyDayRevenueCents) : '—'],
    ['Open disputes', analytics?.openDisputes ?? '—'],
    ['Pending bookings', analytics?.pendingBookings ?? '—'],
    ['Approval backlog', analytics?.approvalBacklog ?? '—'],
  ];
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-4">
      {cards.map(([key, value]) => (
        <div className="card p-5" key={key}>
          <p className="text-sm font-bold uppercase tracking-wide text-ink/50">{key}</p>
          <p className="mt-2 text-3xl font-black text-rosewood">{value}</p>
        </div>
      ))}
    </div>
  );
}

function PendingProfiles({ profiles, noteByProfile, actionId, onNoteChange, onModerate }: { profiles: ProfessionalProfile[]; noteByProfile: Record<string, string>; actionId: string; onNoteChange: (profileId: string, note: string) => void; onModerate: (profileId: string, action: ModerationAction) => void }) {
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
              <textarea className="input mt-4 min-h-24" value={noteByProfile[profile.id] ?? ''} onChange={(event) => onNoteChange(profile.id, event.target.value)} placeholder="Optional moderation note." />
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

function OperationsPanel({ operations }: { operations: AdminOperations | null }) {
  if (!operations) return null;
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="card p-6">
        <h2 className="text-xl font-black text-ink">Next 48 hours</h2>
        <div className="mt-4 space-y-3">
          {operations.upcomingBookings.length === 0 && <p className="text-sm text-ink/60">No upcoming bookings in the operations window.</p>}
          {operations.upcomingBookings.map((booking) => <div className="rounded-2xl bg-blush/40 p-4" key={booking.id}><p className="font-bold text-ink">{booking.serviceName}</p><p className="text-xs text-ink/60">{formatDateTime(booking.startsAt)} · {booking.clientFirstName} {booking.clientLastName} with {booking.professionalName}</p></div>)}
        </div>
      </div>
      <div className="card p-6">
        <h2 className="text-xl font-black text-ink">Open dispute queue</h2>
        <div className="mt-4 space-y-3">
          {operations.openDisputes.length === 0 && <p className="text-sm text-ink/60">No open disputes.</p>}
          {operations.openDisputes.map((dispute) => <div className="rounded-2xl bg-blush/40 p-4" key={dispute.id}><p className="font-bold text-ink">{dispute.reason}</p><p className="text-xs text-ink/60">{dispute.status.replaceAll('_', ' ')} · {formatDateTime(dispute.createdAt)}</p></div>)}
        </div>
      </div>
      <div className="card p-6">
        <h2 className="text-xl font-black text-ink">Trust watchlist</h2>
        <div className="mt-4 space-y-3">
          {operations.lowTrustProfiles.length === 0 && <p className="text-sm text-ink/60">No approved profiles are below the trust threshold.</p>}
          {operations.lowTrustProfiles.map((profile) => <div className="rounded-2xl bg-blush/40 p-4" key={profile.id}><p className="font-bold text-ink">{profile.displayName}</p><p className="text-xs text-ink/60">Trust score {profile.trustScore} · {profile.city}, {profile.state}</p></div>)}
        </div>
      </div>
    </div>
  );
}

function DisputePanel({ disputes, actionId, onUpdate }: { disputes: BookingDispute[]; actionId: string; onUpdate: (id: string, status: 'under_review' | 'resolved' | 'dismissed') => void }) {
  return (
    <div className="card p-6">
      <h2 className="text-2xl font-black text-ink">Dispute management</h2>
      <div className="mt-5 space-y-4">
        {disputes.length === 0 && <p className="text-ink/60">No disputes have been opened.</p>}
        {disputes.map((dispute) => (
          <div className="rounded-3xl border border-rosewood/10 bg-white p-5" key={dispute.id}>
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-lg font-black text-ink">{dispute.reason}</p><p className="text-sm text-ink/60">{dispute.booking?.serviceName ?? 'Booking'} · {dispute.booking?.clientName ?? 'Client'} / {dispute.booking?.professionalName ?? 'Professional'}</p></div><StatusPill status={dispute.status} /></div>
            <p className="mt-3 text-sm text-ink/70">{dispute.details}</p>
            {dispute.resolutionNote && <p className="mt-3 rounded-2xl bg-blush/50 p-3 text-sm text-ink/70">Resolution: {dispute.resolutionNote}</p>}
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="secondary-button disabled:opacity-60" disabled={actionId === dispute.id} onClick={() => onUpdate(dispute.id, 'under_review')}>Review</button>
              <button className="primary-button disabled:opacity-60" disabled={actionId === dispute.id} onClick={() => onUpdate(dispute.id, 'resolved')}>Resolve</button>
              <button className="rounded-full bg-red-50 px-5 py-3 text-sm font-bold text-red-700 disabled:opacity-60" disabled={actionId === dispute.id} onClick={() => onUpdate(dispute.id, 'dismissed')}>Dismiss</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentAdminActions({ actions }: { actions: AdminAction[] }) {
  return <div className="card p-6"><h2 className="text-2xl font-black text-ink">Recent admin actions</h2><div className="mt-5 space-y-3">{actions.length === 0 && <p className="text-ink/60">No admin actions have been recorded yet.</p>}{actions.map((action) => <div className="rounded-2xl bg-blush/40 p-4" key={action.id}><p className="font-bold capitalize text-ink">{action.action.replaceAll('_', ' ')}</p><p className="text-xs text-ink/50">{new Date(action.createdAt).toLocaleString()}</p>{action.note && <p className="mt-2 text-sm text-ink/70">{action.note}</p>}</div>)}</div></div>;
}

export function AdminPage() {
  const [state, setState] = useState<AdminState>(initialState);
  const [noteByProfile, setNoteByProfile] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState('');

  async function load() {
    const [stats, analytics, operations, disputes, pending, actions] = await Promise.all([apiFetch<Stats>('/api/admin/stats'), apiFetch<AdminAnalytics>('/api/admin/analytics'), apiFetch<AdminOperations>('/api/admin/operations'), apiFetch<BookingDispute[]>('/api/disputes'), apiFetch<ProfessionalProfile[]>('/api/admin/professionals/pending'), apiFetch<AdminAction[]>('/api/admin/actions')]);
    setState({ stats, analytics, operations, disputes, pending, actions });
  }

  useEffect(() => { void load().catch((err) => setError(err instanceof Error ? err.message : 'Admin data failed to load')).finally(() => setIsLoading(false)); }, []);

  async function moderate(id: string, action: ModerationAction) {
    setError('');
    setActionId(id);
    const note = noteByProfile[id] ?? '';
    try {
      await apiFetch(`/api/admin/professionals/${id}/${action}`, { method: 'POST', body: JSON.stringify({ note }) });
      setNoteByProfile((current) => ({ ...current, [id]: '' }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete moderation action');
    } finally {
      setActionId('');
    }
  }

  async function updateDispute(id: string, status: 'under_review' | 'resolved' | 'dismissed') {
    setError('');
    setActionId(id);
    try {
      await apiFetch(`/api/disputes/${id}`, { method: 'PATCH', body: JSON.stringify({ status, resolutionNote: status === 'under_review' ? 'Admin review started.' : `Dispute marked ${status.replace('_', ' ')} by admin.` }) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update dispute');
    } finally {
      setActionId('');
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <p className="eyebrow">Admin</p>
      <h1 className="text-4xl font-black text-ink">Marketplace operations</h1>
      <p className="mt-3 max-w-3xl text-ink/70">Review applications, monitor marketplace health, manage disputes, and keep an auditable operations trail.</p>
      <ErrorNotice message={error} />
      {isLoading ? <div className="card mt-8 p-8 text-ink/60">Loading marketplace operations...</div> : (
        <>
          <StatsGrid stats={state.stats} analytics={state.analytics} />
          <div className="mt-8"><OperationsPanel operations={state.operations} /></div>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_.9fr]"><PendingProfiles profiles={state.pending} noteByProfile={noteByProfile} actionId={actionId} onNoteChange={(profileId, note) => setNoteByProfile((current) => ({ ...current, [profileId]: note }))} onModerate={(profileId, action) => void moderate(profileId, action)} /><RecentAdminActions actions={state.actions} /></div>
          <div className="mt-8"><DisputePanel disputes={state.disputes} actionId={actionId} onUpdate={(id, status) => void updateDispute(id, status)} /></div>
        </>
      )}
    </section>
  );
}
