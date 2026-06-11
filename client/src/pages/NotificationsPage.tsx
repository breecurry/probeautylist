import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, formatDateTime } from '@/lib/api';
import { safeInternalPath } from '@/lib/safety';
import type { Notification } from '@/types';

export function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  async function load() {
    const rows = await apiFetch<Notification[]>('/api/notifications');
    setItems(rows);
  }

  useEffect(() => {
    void load()
      .catch((err) => setError(err instanceof Error ? err.message : 'Notifications failed to load'))
      .finally(() => setLoading(false));
  }, []);

  async function markRead(id: string) {
    if (markingId || markingAll) return;

    setError('');
    setMarkingId(id);

    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Notification could not be marked read');
    } finally {
      setMarkingId(null);
    }
  }

  async function markAllRead() {
    if (markingAll || markingId) return;

    setError('');
    setMarkingAll(true);

    try {
      await apiFetch('/api/notifications/read-all', { method: 'PATCH' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Notifications could not be marked read');
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = items.filter((item) => !item.readAt).length;

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <NotificationsHeader unreadCount={unreadCount} markingAll={markingAll} onMarkAllRead={markAllRead} />
      {error && <StatusMessage message={error} />}
      <NotificationList items={items} loading={loading} markingId={markingId} onMarkRead={markRead} />
    </section>
  );
}

function NotificationsHeader({ unreadCount, markingAll, onMarkAllRead }: { unreadCount: number; markingAll: boolean; onMarkAllRead: () => void }) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-4xl font-black text-ink">Notifications</h1>
        <p className="mt-3 text-ink/65">Booking requests, status changes, reviews, messages, and account updates live here.</p>
      </div>
      {unreadCount > 0 && (
        <button className="secondary-button" type="button" onClick={onMarkAllRead} disabled={markingAll}>
          {markingAll ? 'Marking...' : 'Mark all read'}
        </button>
      )}
    </div>
  );
}

function NotificationList({ items, loading, markingId, onMarkRead }: { items: Notification[]; loading: boolean; markingId: string | null; onMarkRead: (id: string) => void }) {
  if (loading) return <div className="card mt-8 p-8 text-ink/60">Loading notifications...</div>;

  if (items.length === 0) return <div className="card mt-8 p-8 text-ink/60">No notifications yet.</div>;

  return (
    <div className="mt-8 space-y-4">
      {items.map((item) => (
        <NotificationCard key={item.id} item={item} marking={markingId === item.id} onMarkRead={onMarkRead} />
      ))}
    </div>
  );
}

function NotificationCard({ item, marking, onMarkRead }: { item: Notification; marking: boolean; onMarkRead: (id: string) => void }) {
  return (
    <div className={`card p-5 ${item.readAt ? 'opacity-70' : 'ring-2 ring-gold/40'}`}>
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div>
          <p className="font-black text-ink">{item.title}</p>
          <p className="mt-2 leading-6 text-ink/65">{item.body}</p>
          <p className="mt-3 text-xs font-bold text-ink/40">{formatDateTime(item.createdAt)}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          {item.actionUrl && <Link className="secondary-button px-4 py-2" to={safeInternalPath(item.actionUrl, '/notifications')}>Open</Link>}
          {!item.readAt && (
            <button className="primary-button px-4 py-2" type="button" onClick={() => onMarkRead(item.id)} disabled={marking}>
              {marking ? 'Marking...' : 'Mark read'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusMessage({ message }: { message: string }) {
  return <p className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">{message}</p>;
}
