import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, formatDateTime, formatMoney } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { StatusPill } from '@/components/StatusPill';
import type { Booking, Message } from '@/types';

type MessagesByBooking = Record<string, Message[]>;

export function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [messagesByBooking, setMessagesByBooking] = useState<MessagesByBooking>({});
  const [openMessages, setOpenMessages] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() { setBookings(await apiFetch<Booking[]>('/api/bookings')); }
  useEffect(() => { void load().catch((err) => setError(err instanceof Error ? err.message : 'Bookings failed to load')); }, []);

  async function setStatus(id: string, status: string) {
    setError('');
    setNotice('');
    try {
      await apiFetch(`/api/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking could not be updated');
    }
  }

  async function loadMessages(bookingId: string) {
    const rows = await apiFetch<Message[]>(`/api/messages/booking/${bookingId}`);
    setMessagesByBooking((current) => ({ ...current, [bookingId]: rows }));
    setOpenMessages(bookingId);
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>, bookingId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = String(form.get('body') || '').trim();
    if (!body) return;
    await apiFetch(`/api/messages/booking/${bookingId}`, { method: 'POST', body: JSON.stringify({ body }) });
    event.currentTarget.reset();
    await loadMessages(bookingId);
  }

  async function submitReview(event: FormEvent<HTMLFormElement>, bookingId: string) {
    event.preventDefault();
    setError('');
    setNotice('');
    const form = new FormData(event.currentTarget);
    try {
      await apiFetch('/api/reviews', { method: 'POST', body: JSON.stringify({ bookingId, rating: Number(form.get('rating')), comment: String(form.get('comment')) }) });
      event.currentTarget.reset();
      setNotice('Review submitted. Thank you for helping other clients choose confidently.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review could not be saved');
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black text-ink">Bookings</h1>
      <p className="mt-3 text-ink/65">Review appointment requests, communicate about appointments, and keep booking history organized.</p>
      {notice && <p className="mt-6 rounded-2xl bg-emerald-50 p-4 font-semibold text-emerald-700">{notice}</p>}
      {error && <p className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">{error}</p>}
      <div className="mt-8 space-y-4">
        {bookings.map((booking) => {
          const serviceName = booking.service?.name ?? `Service ${booking.serviceId.slice(0, 8)}`;
          const otherParty = user?.role === 'professional' ? booking.client?.name : booking.professional?.displayName;
          const messages = messagesByBooking[booking.id] ?? [];
          return (
            <div key={booking.id} className="card p-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <p className="font-black text-ink">{formatDateTime(booking.startsAt)}</p>
                  <p className="mt-2 text-sm text-ink/60">{serviceName} · {formatMoney(booking.priceCents)} · {booking.service?.durationMinutes ?? '—'} minutes</p>
                  {otherParty && <p className="mt-1 text-sm font-semibold text-ink/55">With {otherParty}</p>}
                  {booking.professional?.slug && user?.role === 'client' && <Link className="mt-2 inline-flex text-sm font-bold text-berry" to={`/pros/${booking.professional.slug}`}>Open professional profile</Link>}
                  {booking.clientNote && <p className="mt-3 text-sm leading-6 text-ink/65">Client note: {booking.clientNote}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={booking.status} />
                  {user?.role === 'professional' && booking.status === 'pending' && <><button className="primary-button px-4 py-2" onClick={() => void setStatus(booking.id, 'confirmed')}>Accept</button><button className="secondary-button px-4 py-2" onClick={() => void setStatus(booking.id, 'declined')}>Decline</button></>}
                  {user?.role === 'professional' && booking.status === 'confirmed' && <><button className="primary-button px-4 py-2" onClick={() => void setStatus(booking.id, 'completed')}>Complete</button><button className="secondary-button px-4 py-2" onClick={() => void setStatus(booking.id, 'cancelled_by_professional')}>Cancel</button><button className="secondary-button px-4 py-2" onClick={() => void setStatus(booking.id, 'no_show')}>No-show</button></>}
                  {user?.role === 'client' && ['pending', 'confirmed'].includes(booking.status) && <button className="secondary-button px-4 py-2" onClick={() => void setStatus(booking.id, 'cancelled_by_client')}>Cancel</button>}
                  <button className="secondary-button px-4 py-2" onClick={() => void loadMessages(booking.id)}>{openMessages === booking.id ? 'Refresh messages' : 'Messages'}</button>
                </div>
              </div>
              {openMessages === booking.id && (
                <div className="mt-5 rounded-3xl bg-cream p-4">
                  <h3 className="font-black text-ink">Booking messages</h3>
                  <div className="mt-3 space-y-2">
                    {messages.map((message) => <p key={message.id} className={`rounded-2xl p-3 text-sm ${message.senderId === user?.id ? 'bg-berry text-white' : 'bg-white text-ink/70'}`}>{message.body}</p>)}
                    {messages.length === 0 && <p className="text-sm text-ink/55">No messages yet.</p>}
                  </div>
                  <form onSubmit={(event) => void sendMessage(event, booking.id)} className="mt-3 flex gap-2">
                    <input className="input" name="body" placeholder="Write a message about this appointment" />
                    <button className="primary-button" type="submit">Send</button>
                  </form>
                </div>
              )}
              {user?.role === 'client' && booking.status === 'completed' && (
                <form onSubmit={(event) => void submitReview(event, booking.id)} className="mt-5 grid gap-3 rounded-3xl bg-cream p-4 sm:grid-cols-[120px_1fr_auto]">
                  <select className="input" name="rating" defaultValue="5">{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}</select>
                  <input className="input" name="comment" placeholder="Leave a review for this completed appointment" required />
                  <button className="primary-button" type="submit">Review</button>
                </form>
              )}
            </div>
          );
        })}
        {bookings.length === 0 && <div className="card p-8 text-ink/60">No bookings yet.</div>}
      </div>
    </section>
  );
}
