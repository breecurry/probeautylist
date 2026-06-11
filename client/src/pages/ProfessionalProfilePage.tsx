import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarPlus, Clock, Star } from 'lucide-react';
import { apiFetch, formatMoney } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { PortfolioItem, ProfessionalProfile, Review, Service } from '@/types';

export function ProfessionalProfilePage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      if (!slug) return;
      const loadedProfile = await apiFetch<ProfessionalProfile>(`/api/professionals/${slug}`);
      setProfile(loadedProfile);
      const [loadedServices, loadedPortfolio, loadedReviews] = await Promise.all([
        apiFetch<Service[]>(`/api/services/professional/${loadedProfile.id}`),
        apiFetch<PortfolioItem[]>(`/api/portfolio/professional/${loadedProfile.id}`),
        apiFetch<Review[]>(`/api/reviews/professional/${loadedProfile.id}`),
      ]);
      setServices(loadedServices);
      setPortfolio(loadedPortfolio);
      setReviews(loadedReviews);
      if (loadedServices[0]) setSelectedService(loadedServices[0].id);
    }
    void load().catch((err) => setError(err instanceof Error ? err.message : 'Profile failed to load'));
  }, [slug]);

  async function book(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setMessage('');
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      await apiFetch('/api/bookings', { method: 'POST', body: JSON.stringify({ professionalId: profile.id, serviceId: selectedService, startsAt: new Date(String(form.get('startsAt'))).toISOString(), clientNote: String(form.get('clientNote') || '') }) });
      setMessage('Booking request sent. You will receive an in-app notification when it is updated.');
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking request failed');
    }
  }

  if (error && !profile) return <section className="mx-auto max-w-7xl px-6 py-16"><div className="card p-8 text-red-700">{error}</div></section>;
  if (!profile) return <section className="mx-auto max-w-7xl px-6 py-16 text-ink/60">Loading profile...</section>;

  return <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="card overflow-hidden"><div className="h-56 bg-gradient-to-r from-rosewood to-berry" style={profile.coverImageUrl ? { backgroundImage: `url(${profile.coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} /><div className="grid gap-8 p-8 lg:grid-cols-[1fr_380px]"><div><p className="font-bold text-berry">{profile.category} · {profile.city}, {profile.state}</p><h1 className="mt-2 text-4xl font-black text-ink">{profile.displayName}</h1><p className="mt-3 text-xl font-semibold text-ink/70">{profile.headline}</p><p className="mt-6 leading-8 text-ink/70">{profile.bio}</p><div className="mt-6 flex flex-wrap gap-2">{profile.specialties?.map((item) => <span key={item} className="rounded-full bg-blush px-3 py-1 text-sm font-bold text-rosewood">{item}</span>)}</div></div><form onSubmit={book} className="rounded-3xl bg-cream p-5"><h2 className="mb-4 flex items-center text-xl font-black text-ink"><CalendarPlus className="mr-2" />Request a booking</h2>{!user && <p className="mb-4 rounded-2xl bg-white p-3 text-sm font-semibold text-rosewood">Log in or register as a client to request appointments.</p>}<label className="label">Service</label><select className="input mt-2" value={selectedService} onChange={(e) => setSelectedService(e.target.value)} required>{services.map((service) => <option key={service.id} value={service.id}>{service.name} · {formatMoney(service.priceCents)}</option>)}</select><label className="label mt-4 block">Preferred date and time</label><input className="input mt-2" name="startsAt" type="datetime-local" required /><label className="label mt-4 block">Notes</label><textarea className="input mt-2 min-h-28" name="clientNote" placeholder="Share style goals, timing needs, or questions." />{message && <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</p>}{error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}<button className="primary-button mt-5 w-full" disabled={!user || !services.length}>Send booking request</button></form></div></div><div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]"><div><h2 className="mb-4 text-2xl font-black text-ink">Services</h2><div className="space-y-4">{services.map((service) => <div key={service.id} className="card p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="font-black text-ink">{service.name}</h3><p className="mt-2 text-sm leading-6 text-ink/65">{service.description}</p></div><div className="text-right"><p className="font-black text-berry">{formatMoney(service.priceCents)}</p><p className="mt-1 flex items-center text-xs font-bold text-ink/50"><Clock size={14} className="mr-1" />{service.durationMinutes} min</p></div></div></div>)}</div><h2 className="mb-4 mt-10 text-2xl font-black text-ink">Portfolio</h2><div className="grid gap-4 sm:grid-cols-2">{portfolio.map((item) => <figure key={item.id} className="card overflow-hidden"><img src={item.imageUrl} alt={item.caption} className="h-48 w-full object-cover" /><figcaption className="p-4 text-sm font-semibold text-ink/70">{item.caption}</figcaption></figure>)}</div></div><aside><h2 className="mb-4 text-2xl font-black text-ink">Reviews</h2><div className="space-y-4">{reviews.map((review) => <div key={review.id} className="card p-5"><p className="flex text-gold">{Array.from({ length: review.rating }).map((_, index) => <Star key={index} size={16} fill="currentColor" />)}</p><p className="mt-3 text-sm leading-6 text-ink/70">{review.comment}</p></div>)}{reviews.length === 0 && <div className="card p-5 text-sm text-ink/60">No reviews yet.</div>}</div></aside></div></section>;
}
