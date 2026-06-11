import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, formatDateTime, formatMoney } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { StatusPill } from '@/components/StatusPill';
import type { Booking, Message } from '@/types';

type MessagesByBooking = Record<string, Message[]>;
type BookingStatusAction = 'confirmed' | 'declined' | 'completed' | 'cancelled_by_client' | 'cancelled_by_professional' | 'no_show';

export function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [messagesByBooking, setMessagesByBooking] = useState<MessagesByBooking>({});
  const [openMessages, setOpenMessages] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [sendingMessageFor, setSendingMessageFor] = useState<string | null>(null);
  const [reviewingBookingId, setReviewingBookingId] = useState<string | null>(null);
  const [reschedulingBookingId, setReschedulingBookingId] = useState<string | null>(null);
  const [respondingRescheduleId, setRespondingRescheduleId] = useState<string | null>(null);

  async function load() {
    const rows = await apiFetch<Booking[]>('/api/bookings');
    setBookings(rows);
  }

  useEffect(() => {
    void load()
      .catch((err) => setError(err instanceof Error ? err.message : 'Bookings failed to load'))
      .finally(() => setLoading(false));
  }, []);

  async function setStatus(id: string, status: BookingStatusAction, cancellationReason?: string) {
    setError('');
    setNotice('');
    try {
      await apiFetch(`/api/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, ...(cancellationReason ? { cancellationReason } : {}) }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking could not be updated');
    }
  }

  async function requestReschedule(event: FormEvent<HTMLFormElement>, bookingId: string) {
    event.preventDefault();
    setError('');
    setNotice('');
    const form = new FormData(event.currentTarget);
    const proposedValue = String(form.get('proposedStartsAt') || '');
    const note = String(form.get('note') || '').trim();
    const proposedDate = new Date(proposedValue);
    if (Number.isNaN(proposedDate.getTime())) {
      setError('Choose a valid proposed date and time.');
      return;
    }
    if (note.length > 1000) {
      setError('Reschedule notes must be 1,000 characters or fewer.');
      return;
    }

    setReschedulingBookingId(bookingId);
    try {
      await apiFetch(`/api/bookings/${bookingId}/reschedule-requests`, {
        method: 'POST',
        body: JSON.stringify({ proposedStartsAt: proposedDate.toISOString(), ...(note ? { note } : {}) }),
      });
      event.currentTarget.reset();
      setNotice('Reschedule request sent. The other party will be notified.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reschedule request could not be sent');
    } finally {
      setReschedulingBookingId(null);
    }
  }

  async function respondToReschedule(bookingId: string, requestId: string, status: 'accepted' | 'declined' | 'cancelled') {
    setError('');
    setNotice('');
    setRespondingRescheduleId(requestId);
    try {
      await apiFetch(`/api/bookings/${bookingId}/reschedule-requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setNotice(`Reschedule request ${status}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reschedule request could not be updated');
    } finally {
      setRespondingRescheduleId(null);
    }
  }

  async function loadMessages(bookingId: string) {
    setError('');
    try {
      const rows = await apiFetch<Message[]>(`/api/messages/booking/${bookingId}`);
      setMessagesByBooking((current) => ({ ...current, [bookingId]: rows }));
      setOpenMessages(bookingId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Messages failed to load');
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>, bookingId: string) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const body = String(form.get('body') || '').trim();
    if (!body || sendingMessageFor) return;
    if (body.length > 1000) {
      setError('Messages must be 1,000 characters or fewer.');
      return;
    }

    setSendingMessageFor(bookingId);
    try {
      await apiFetch(`/api/messages/booking/${bookingId}`, { method: 'POST', body: JSON.stringify({ body }) });
      event.currentTarget.reset();
      await loadMessages(bookingId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Message could not be sent');
    } finally {
      setSendingMessageFor(null);
    }
  }

  async function submitReview(event: FormEvent<HTMLFormElement>, bookingId: string) {
    event.preventDefault();
    setError('');
    setNotice('');
    const form = new FormData(event.currentTarget);
    const rating = Number(form.get('rating'));
    const comment = String(form.get('comment') || '').trim();

    if (reviewingBookingId) return;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setError('Choose a rating from 1 to 5 stars.');
      return;
    }
    if (comment.length < 3 || comment.length > 1000) {
      setError('Reviews must be between 3 and 1,000 characters.');
      return;
    }

    setReviewingBookingId(bookingId);
    try {
      await apiFetch('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ bookingId, rating, comment }),
      });
      event.currentTarget.reset();
      setNotice('Review submitted. Thank you for helping other clients choose confidently.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review could not be saved');
    } finally {
      setReviewingBookingId(null);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader />
      {notice && <p className="mt-6 rounded-2xl bg-emerald-50 p-4 font-semibold text-emerald-700">{notice}</p>}
      {error && <p className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">{error}</p>}
      <div className="mt-8 space-y-4">
        {loading && <div className="card p-8 text-ink/60">Loading bookings…</div>}
        {!loading && bookings.length === 0 && <div className="card p-8 text-ink/60">No bookings yet.</div>}
        {!loading && bookings.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            currentUserId={user?.id}
            role={user?.role}
            messages={messagesByBooking[booking.id] ?? []}
            messagesOpen={openMessages === booking.id}
            onStatus={setStatus}
            onLoadMessages={loadMessages}
            onRequestReschedule={requestReschedule}
            onRespondToReschedule={respondToReschedule}
            rescheduling={reschedulingBookingId === booking.id}
            respondingRescheduleId={respondingRescheduleId}
            onSendMessage={sendMessage}
            onSubmitReview={submitReview}
            reviewing={reviewingBookingId === booking.id}
            sendingMessage={sendingMessageFor === booking.id}
          />
        ))}
      </div>
    </section>
  );
}

function PageHeader() {
  return (
    <>
      <h1 className="text-4xl font-black text-ink">Bookings</h1>
      <p className="mt-3 text-ink/65">Review appointment requests, communicate about appointments, and keep booking history organized.</p>
    </>
  );
}

function BookingCard({
  booking,
  currentUserId,
  role,
  messages,
  messagesOpen,
  onStatus,
  onLoadMessages,
  onRequestReschedule,
  onRespondToReschedule,
  onSendMessage,
  onSubmitReview,
  rescheduling,
  respondingRescheduleId,
  reviewing,
  sendingMessage,
}: {
  booking: Booking;
  currentUserId?: string;
  role?: string;
  messages: Message[];
  messagesOpen: boolean;
  onStatus: (id: string, status: BookingStatusAction, cancellationReason?: string) => Promise<void>;
  onLoadMessages: (bookingId: string) => Promise<void>;
  onRequestReschedule: (event: FormEvent<HTMLFormElement>, bookingId: string) => Promise<void>;
  onRespondToReschedule: (bookingId: string, requestId: string, status: 'accepted' | 'declined' | 'cancelled') => Promise<void>;
  onSendMessage: (event: FormEvent<HTMLFormElement>, bookingId: string) => Promise<void>;
  onSubmitReview: (event: FormEvent<HTMLFormElement>, bookingId: string) => Promise<void>;
  rescheduling: boolean;
  respondingRescheduleId: string | null;
  reviewing: boolean;
  sendingMessage: boolean;
}) {
  const serviceName = booking.service?.name ?? `Service ${booking.serviceId.slice(0, 8)}`;
  const otherParty = role === 'professional' ? booking.client?.name : booking.professional?.displayName;

  return (
    <div className="card p-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <BookingSummary booking={booking} serviceName={serviceName} otherParty={otherParty} role={role} />
        <BookingActions booking={booking} role={role} messagesOpen={messagesOpen} onStatus={onStatus} onLoadMessages={onLoadMessages} />
      </div>
      <ReschedulePanel booking={booking} currentUserId={currentUserId} onRequestReschedule={onRequestReschedule} onRespondToReschedule={onRespondToReschedule} rescheduling={rescheduling} respondingRescheduleId={respondingRescheduleId} />
      {messagesOpen && <MessagesPanel bookingId={booking.id} currentUserId={currentUserId} messages={messages} onSendMessage={onSendMessage} sending={sendingMessage} />}
      {role === 'client' && booking.status === 'completed' && <ReviewForm bookingId={booking.id} onSubmitReview={onSubmitReview} reviewing={reviewing} />}
    </div>
  );
}

function BookingSummary({ booking, serviceName, otherParty, role }: { booking: Booking; serviceName: string; otherParty?: string; role?: string }) {
  return (
    <div>
      <p className="font-black text-ink">{formatDateTime(booking.startsAt)}</p>
      <p className="mt-2 text-sm text-ink/60">{serviceName} · {formatMoney(booking.priceCents)} · {booking.service?.durationMinutes ?? '—'} minutes</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
        <span className="rounded-full bg-cream px-3 py-1 text-ink/65">Deposit: {booking.depositCents > 0 ? formatMoney(booking.depositCents) : 'None'}</span>
        <span className="rounded-full bg-cream px-3 py-1 text-ink/65">Payment: {booking.paymentStatus.replaceAll('_', ' ')}</span>
        {booking.reminderOptIn && <span className="rounded-full bg-cream px-3 py-1 text-ink/65">Reminder on</span>}
      </div>
      {booking.cancellationReason && <p className="mt-2 text-sm font-semibold text-red-700">Cancellation reason: {booking.cancellationReason}</p>}
      {otherParty && <p className="mt-1 text-sm font-semibold text-ink/55">With {otherParty}</p>}
      {booking.professional?.slug && role === 'client' && <Link className="mt-2 inline-flex text-sm font-bold text-berry" to={`/pros/${booking.professional.slug}`}>Open professional profile</Link>}
      {booking.clientNote && <p className="mt-3 text-sm leading-6 text-ink/65">Client note: {booking.clientNote}</p>}
    </div>
  );
}

function BookingActions({
  booking,
  role,
  messagesOpen,
  onStatus,
  onLoadMessages,
}: {
  booking: Booking;
  role?: string;
  messagesOpen: boolean;
  onStatus: (id: string, status: BookingStatusAction, cancellationReason?: string) => Promise<void>;
  onLoadMessages: (bookingId: string) => Promise<void>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusPill status={booking.status} />
      {role === 'professional' && booking.status === 'pending' && (
        <>
          <button type="button" className="primary-button px-4 py-2" onClick={() => void onStatus(booking.id, 'confirmed')}>Accept</button>
          <button type="button" className="secondary-button px-4 py-2" onClick={() => void onStatus(booking.id, 'declined')}>Decline</button>
        </>
      )}
      {role === 'professional' && booking.status === 'confirmed' && (
        <>
          <button type="button" className="primary-button px-4 py-2" onClick={() => void onStatus(booking.id, 'completed')}>Complete</button>
          <button type="button" className="secondary-button px-4 py-2" onClick={() => {
            const reason = window.prompt('Reason for cancelling this booking?')?.trim();
            if (reason !== undefined) void onStatus(booking.id, 'cancelled_by_professional', reason);
          }}>Cancel</button>
          <button type="button" className="secondary-button px-4 py-2" onClick={() => void onStatus(booking.id, 'no_show')}>No-show</button>
        </>
      )}
      {role === 'client' && ['pending', 'confirmed'].includes(booking.status) && (
        <button type="button" className="secondary-button px-4 py-2" onClick={() => {
          const reason = window.prompt('Reason for cancelling this booking?')?.trim();
          if (reason !== undefined) void onStatus(booking.id, 'cancelled_by_client', reason);
        }}>Cancel</button>
      )}
      <button type="button" className="secondary-button px-4 py-2" onClick={() => void onLoadMessages(booking.id)}>{messagesOpen ? 'Refresh messages' : 'Messages'}</button>
    </div>
  );
}

function ReschedulePanel({
  booking,
  currentUserId,
  onRequestReschedule,
  onRespondToReschedule,
  rescheduling,
  respondingRescheduleId,
}: {
  booking: Booking;
  currentUserId?: string;
  onRequestReschedule: (event: FormEvent<HTMLFormElement>, bookingId: string) => Promise<void>;
  onRespondToReschedule: (bookingId: string, requestId: string, status: 'accepted' | 'declined' | 'cancelled') => Promise<void>;
  rescheduling: boolean;
  respondingRescheduleId: string | null;
}) {
  const active = ['pending', 'confirmed'].includes(booking.status);
  const pendingRequest = booking.pendingRescheduleRequest;
  const requestedByCurrentUser = pendingRequest?.requestedById === currentUserId;

  if (!active) return null;

  return (
    <div className="mt-5 rounded-3xl bg-cream p-4">
      <h3 className="font-black text-ink">Rescheduling</h3>
      {pendingRequest ? (
        <div className="mt-3 rounded-2xl bg-white p-4 text-sm text-ink/70">
          <p><span className="font-black text-ink">Proposed time:</span> {formatDateTime(pendingRequest.proposedStartsAt)}</p>
          {pendingRequest.note && <p className="mt-2">Note: {pendingRequest.note}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {!requestedByCurrentUser && (
              <>
                <button type="button" className="primary-button px-4 py-2" disabled={respondingRescheduleId === pendingRequest.id} onClick={() => void onRespondToReschedule(booking.id, pendingRequest.id, 'accepted')}>Accept new time</button>
                <button type="button" className="secondary-button px-4 py-2" disabled={respondingRescheduleId === pendingRequest.id} onClick={() => void onRespondToReschedule(booking.id, pendingRequest.id, 'declined')}>Decline</button>
              </>
            )}
            {requestedByCurrentUser && <button type="button" className="secondary-button px-4 py-2" disabled={respondingRescheduleId === pendingRequest.id} onClick={() => void onRespondToReschedule(booking.id, pendingRequest.id, 'cancelled')}>Cancel request</button>}
          </div>
        </div>
      ) : (
        <form onSubmit={(event) => void onRequestReschedule(event, booking.id)} className="mt-3 grid gap-3 md:grid-cols-[220px_1fr_auto]">
          <input className="input" name="proposedStartsAt" type="datetime-local" disabled={rescheduling} required />
          <input className="input" name="note" placeholder="Optional note about the new time" maxLength={1000} disabled={rescheduling} />
          <button className="secondary-button" type="submit" disabled={rescheduling}>{rescheduling ? 'Sending...' : 'Request reschedule'}</button>
        </form>
      )}
    </div>
  );
}

function MessagesPanel({
  bookingId,
  currentUserId,
  messages,
  onSendMessage,
  sending,
}: {
  bookingId: string;
  currentUserId?: string;
  messages: Message[];
  onSendMessage: (event: FormEvent<HTMLFormElement>, bookingId: string) => Promise<void>;
  sending: boolean;
}) {
  return (
    <div className="mt-5 rounded-3xl bg-cream p-4">
      <h3 className="font-black text-ink">Booking messages</h3>
      <div className="mt-3 space-y-2">
        {messages.map((message) => (
          <p key={message.id} className={`rounded-2xl p-3 text-sm ${message.senderId === currentUserId ? 'bg-berry text-white' : 'bg-white text-ink/70'}`}>{message.body}</p>
        ))}
        {messages.length === 0 && <p className="text-sm text-ink/55">No messages yet.</p>}
      </div>
      <form onSubmit={(event) => void onSendMessage(event, bookingId)} className="mt-3 flex gap-2">
        <input className="input" name="body" placeholder="Write a message about this appointment" maxLength={1000} disabled={sending} required />
        <button className="primary-button" type="submit" disabled={sending}>{sending ? 'Sending...' : 'Send'}</button>
      </form>
    </div>
  );
}

function ReviewForm({ bookingId, onSubmitReview, reviewing }: { bookingId: string; onSubmitReview: (event: FormEvent<HTMLFormElement>, bookingId: string) => Promise<void>; reviewing: boolean }) {
  return (
    <form onSubmit={(event) => void onSubmitReview(event, bookingId)} className="mt-5 grid gap-3 rounded-3xl bg-cream p-4 sm:grid-cols-[120px_1fr_auto]">
      <select className="input" name="rating" defaultValue="5" disabled={reviewing}>
        {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
      </select>
      <input className="input" name="comment" placeholder="Leave a review for this completed appointment" minLength={3} maxLength={1000} disabled={reviewing} required />
      <button className="primary-button" type="submit" disabled={reviewing}>{reviewing ? 'Submitting...' : 'Review'}</button>
    </form>
  );
}
