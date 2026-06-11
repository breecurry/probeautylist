import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, formatDateTime, formatMoney } from '@/lib/api';
import { safeInternalPath } from '@/lib/safety';
import { useAuth } from '@/context/AuthContext';
import { StatusPill } from '@/components/StatusPill';
import type { Booking, Favorite, Notification } from '@/types';

type DashboardShellProps = {
  primaryLink: string;
  primaryText: string;
  professional?: boolean;
  subtitle: string;
  title: string;
};

export function ClientDashboard() {
  return <DashboardShell title="Client dashboard" subtitle="Track bookings, saved professionals, messages, and notifications." primaryLink="/search" primaryText="Find a professional" />;
}

export function ProfessionalDashboard() {
  return <DashboardShell title="Professional dashboard" subtitle="Manage booking requests, public profile readiness, services, availability, and client updates." primaryLink="/professional/profile" primaryText="Manage profile" professional />;
}

function DashboardShell({ title, subtitle, primaryLink, primaryText, professional = false }: DashboardShellProps) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setError('');
      setLoading(true);

      const [loadedBookings, loadedNotifications, loadedFavorites] = await Promise.all([
        apiFetch<Booking[]>('/api/bookings'),
        apiFetch<Notification[]>('/api/notifications'),
        professional ? Promise.resolve([] as Favorite[]) : apiFetch<Favorite[]>('/api/favorites'),
      ]);

      setBookings(loadedBookings.slice(0, 6));
      setNotifications(loadedNotifications.slice(0, 5));
      setFavorites(loadedFavorites.slice(0, 3));
      setLoading(false);
    }

    void loadDashboard().catch((err) => {
      setError(err instanceof Error ? err.message : 'Dashboard failed to load');
      setLoading(false);
    });
  }, [professional]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <DashboardHeader firstName={user?.firstName} primaryLink={primaryLink} primaryText={primaryText} subtitle={subtitle} title={title} />
      <QuickLinks professional={professional} />
      {error && <p className="mb-8 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">{error}</p>}
      {loading ? <p className="rounded-2xl bg-cream p-5 text-ink/60">Loading dashboard...</p> : <DashboardContent bookings={bookings} favorites={favorites} notifications={notifications} professional={professional} />}
    </section>
  );
}

function DashboardHeader({ firstName, primaryLink, primaryText, subtitle, title }: { firstName?: string; primaryLink: string; primaryText: string; subtitle: string; title: string }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="font-bold text-berry">Signed in as {firstName ?? 'your account'}</p>
        <h1 className="mt-2 text-4xl font-black text-ink">{title}</h1>
        <p className="mt-3 text-ink/65">{subtitle}</p>
      </div>
      <Link to={primaryLink} className="primary-button">{primaryText}</Link>
    </div>
  );
}

function QuickLinks({ professional }: { professional: boolean }) {
  const links = professional
    ? [
        { label: 'Manage services', to: '/professional/services' },
        { label: 'Set availability', to: '/professional/availability' },
        { label: 'Portfolio', to: '/professional/portfolio' },
        { label: 'Review bookings', to: '/professional/bookings' },
        { label: 'Open notifications', to: '/notifications' },
      ]
    : [
        { label: 'Find professionals', to: '/search' },
        { label: 'Saved professionals', to: '/client/favorites' },
        { label: 'My bookings', to: '/client/bookings' },
      ];

  return (
    <div className={`mb-8 grid gap-4 ${professional ? 'md:grid-cols-5' : 'md:grid-cols-3'}`}>
      {links.map((link) => <Link key={link.to} className="card p-5 font-bold text-rosewood" to={link.to}>{link.label}</Link>)}
    </div>
  );
}

function DashboardContent({ bookings, favorites, notifications, professional }: { bookings: Booking[]; favorites: Favorite[]; notifications: Notification[]; professional: boolean }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <BookingsPreview bookings={bookings} professional={professional} />
      <aside className="space-y-8">
        <NotificationsPreview notifications={notifications} />
        {!professional && <FavoritesPreview favorites={favorites} />}
      </aside>
    </div>
  );
}

function BookingsPreview({ bookings, professional }: { bookings: Booking[]; professional: boolean }) {
  return (
    <div className="card p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-black text-ink">Recent bookings</h2>
        <Link to={professional ? '/professional/bookings' : '/client/bookings'} className="text-sm font-bold text-berry">View all</Link>
      </div>
      <div className="space-y-3">
        {bookings.map((booking) => (
          <div key={booking.id} className="rounded-2xl border border-rosewood/10 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-ink">{booking.service?.name ?? 'Appointment'}</p>
                <p className="mt-1 text-sm text-ink/50">{formatDateTime(booking.startsAt)} · {formatMoney(booking.priceCents)}</p>
              </div>
              <StatusPill status={booking.status} />
            </div>
          </div>
        ))}
        {bookings.length === 0 && <p className="rounded-2xl bg-cream p-5 text-ink/60">No bookings yet.</p>}
      </div>
    </div>
  );
}

function NotificationsPreview({ notifications }: { notifications: Notification[] }) {
  return (
    <div className="card p-6">
      <h2 className="text-2xl font-black text-ink">Notifications</h2>
      <div className="mt-5 space-y-3">
        {notifications.map((item) => (
          <Link key={item.id} to={safeInternalPath(item.actionUrl, '/notifications')} className="block rounded-2xl border border-rosewood/10 p-4 hover:bg-cream">
            <p className="font-bold text-ink">{item.title}</p>
            <p className="mt-1 text-sm leading-6 text-ink/60">{item.body}</p>
          </Link>
        ))}
        {notifications.length === 0 && <p className="rounded-2xl bg-cream p-5 text-sm text-ink/60">No notifications yet.</p>}
      </div>
    </div>
  );
}

function FavoritesPreview({ favorites }: { favorites: Favorite[] }) {
  return (
    <div className="card p-6">
      <h2 className="text-2xl font-black text-ink">Saved pros</h2>
      <div className="mt-5 space-y-3">
        {favorites.map((favorite) => (
          <Link key={favorite.id} to={`/pros/${favorite.professional.slug}`} className="block rounded-2xl border border-rosewood/10 p-4 hover:bg-cream">
            <p className="font-bold text-ink">{favorite.professional.displayName}</p>
            <p className="mt-1 text-sm leading-6 text-ink/60">{favorite.professional.city}, {favorite.professional.state}</p>
          </Link>
        ))}
        {favorites.length === 0 && <p className="rounded-2xl bg-cream p-5 text-sm text-ink/60">No saved professionals yet.</p>}
      </div>
    </div>
  );
}
