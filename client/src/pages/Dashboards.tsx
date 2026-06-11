import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, formatDateTime, formatMoney } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { StatusPill } from '@/components/StatusPill';
import type { Booking, Notification } from '@/types';

export function ClientDashboard() {
  return <DashboardShell title="Client dashboard" subtitle="Track your bookings, notifications, and favorite professionals." primaryLink="/search" primaryText="Find a professional" />;
}

export function ProfessionalDashboard() {
  return <DashboardShell title="Professional dashboard" subtitle="Manage incoming booking requests, profile readiness, and client updates." primaryLink="/professional/profile" primaryText="Manage profile" professional />;
}

function DashboardShell({ title, subtitle, primaryLink, primaryText, professional = false }: { title: string; subtitle: string; primaryLink: string; primaryText: string; professional?: boolean }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    void Promise.all([apiFetch<Booking[]>('/api/bookings'), apiFetch<Notification[]>('/api/notifications')]).then(([loadedBookings, loadedNotifications]) => {
      setBookings(loadedBookings);
      setNotifications(loadedNotifications.slice(0, 5));
    });
  }, []);

  return <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-bold text-berry">Signed in as {user?.firstName}</p><h1 className="mt-2 text-4xl font-black text-ink">{title}</h1><p className="mt-3 text-ink/65">{subtitle}</p></div><Link to={primaryLink} className="primary-button">{primaryText}</Link></div>{professional && <div className="mb-8 grid gap-4 md:grid-cols-5"><Link className="card p-5 font-bold text-rosewood" to="/professional/services">Manage services</Link><Link className="card p-5 font-bold text-rosewood" to="/professional/availability">Set availability</Link><Link className="card p-5 font-bold text-rosewood" to="/professional/portfolio">Portfolio</Link><Link className="card p-5 font-bold text-rosewood" to="/professional/bookings">Review bookings</Link><Link className="card p-5 font-bold text-rosewood" to="/notifications">Open notifications</Link></div>}<div className="grid gap-8 lg:grid-cols-[1fr_360px]"><div className="card p-6"><div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-black text-ink">Recent bookings</h2><Link to={professional ? '/professional/bookings' : '/client/bookings'} className="text-sm font-bold text-berry">View all</Link></div><div className="space-y-3">{bookings.slice(0, 6).map((booking) => <div key={booking.id} className="rounded-2xl border border-rosewood/10 p-4"><div className="flex items-center justify-between gap-4"><div><p className="font-bold text-ink">{formatDateTime(booking.startsAt)}</p><p className="mt-1 text-sm text-ink/50">{formatMoney(booking.priceCents)}</p></div><StatusPill status={booking.status} /></div></div>)}{bookings.length === 0 && <p className="rounded-2xl bg-cream p-5 text-ink/60">No bookings yet.</p>}</div></div><aside className="card p-6"><h2 className="text-2xl font-black text-ink">Notifications</h2><div className="mt-5 space-y-3">{notifications.map((item) => <Link key={item.id} to={item.actionUrl || '/notifications'} className="block rounded-2xl border border-rosewood/10 p-4 hover:bg-cream"><p className="font-bold text-ink">{item.title}</p><p className="mt-1 text-sm leading-6 text-ink/60">{item.body}</p></Link>)}{notifications.length === 0 && <p className="rounded-2xl bg-cream p-5 text-sm text-ink/60">No notifications yet.</p>}</div></aside></div></section>;
}
