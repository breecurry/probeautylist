import { useEffect, useState } from 'react';
import { apiFetch, formatDateTime, formatMoney } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { StatusPill } from '@/components/StatusPill';
import type { Booking } from '@/types';

export function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState('');

  async function load() { setBookings(await apiFetch<Booking[]>('/api/bookings')); }
  useEffect(() => { void load().catch((err) => setError(err instanceof Error ? err.message : 'Bookings failed to load')); }, []);

  async function setStatus(id: string, status: string) {
    setError('');
    try {
      await apiFetch(`/api/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking could not be updated');
    }
  }

  return <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"><h1 className="text-4xl font-black text-ink">Bookings</h1><p className="mt-3 text-ink/65">Review appointment requests and booking history.</p>{error && <p className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">{error}</p>}<div className="mt-8 space-y-4">{bookings.map((booking) => <div key={booking.id} className="card p-5"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><p className="font-black text-ink">{formatDateTime(booking.startsAt)}</p><p className="mt-2 text-sm text-ink/60">{formatMoney(booking.priceCents)} · Service ID {booking.serviceId.slice(0, 8)}</p>{booking.clientNote && <p className="mt-3 text-sm leading-6 text-ink/65">Client note: {booking.clientNote}</p>}</div><div className="flex flex-wrap items-center gap-2"><StatusPill status={booking.status} />{user?.role === 'professional' && booking.status === 'pending' && <><button className="primary-button px-4 py-2" onClick={() => void setStatus(booking.id, 'confirmed')}>Accept</button><button className="secondary-button px-4 py-2" onClick={() => void setStatus(booking.id, 'declined')}>Decline</button></>}{user?.role === 'professional' && booking.status === 'confirmed' && <><button className="primary-button px-4 py-2" onClick={() => void setStatus(booking.id, 'completed')}>Complete</button><button className="secondary-button px-4 py-2" onClick={() => void setStatus(booking.id, 'cancelled_by_professional')}>Cancel</button></>}{user?.role === 'client' && ['pending', 'confirmed'].includes(booking.status) && <button className="secondary-button px-4 py-2" onClick={() => void setStatus(booking.id, 'cancelled_by_client')}>Cancel</button>}</div></div></div>)}{bookings.length === 0 && <div className="card p-8 text-ink/60">No bookings yet.</div>}</div></section>;
}
