import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, formatDateTime } from '@/lib/api';
import type { Notification } from '@/types';

export function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState('');
  async function load() { setItems(await apiFetch<Notification[]>('/api/notifications')); }
  useEffect(() => { void load().catch((err) => setError(err instanceof Error ? err.message : 'Notifications failed to load')); }, []);
  async function markRead(id: string) { await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' }); await load(); }
  async function markAllRead() { await apiFetch('/api/notifications/read-all', { method: 'PATCH' }); await load(); }
  const unreadCount = items.filter((item) => !item.readAt).length;

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-black text-ink">Notifications</h1>
          <p className="mt-3 text-ink/65">Booking requests, status changes, reviews, messages, and account updates live here.</p>
        </div>
        {unreadCount > 0 && <button className="secondary-button" onClick={() => void markAllRead()}>Mark all read</button>}
      </div>
      {error && <p className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">{error}</p>}
      <div className="mt-8 space-y-4">
        {items.map((item) => <div key={item.id} className={`card p-5 ${item.readAt ? 'opacity-70' : 'ring-2 ring-gold/40'}`}><div className="flex justify-between gap-4"><div><p className="font-black text-ink">{item.title}</p><p className="mt-2 leading-6 text-ink/65">{item.body}</p><p className="mt-3 text-xs font-bold text-ink/40">{formatDateTime(item.createdAt)}</p></div><div className="flex flex-col gap-2">{item.actionUrl && <Link className="secondary-button px-4 py-2" to={item.actionUrl}>Open</Link>}{!item.readAt && <button className="primary-button px-4 py-2" onClick={() => void markRead(item.id)}>Mark read</button>}</div></div></div>)}
        {items.length === 0 && <div className="card p-8 text-ink/60">No notifications yet.</div>}
      </div>
    </section>
  );
}
