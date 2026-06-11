import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarPlus, Clock, Heart, MapPin, ShieldCheck, Star, ThumbsUp } from 'lucide-react';
import { apiFetch, formatMoney } from '@/lib/api';
import { safeBackgroundImageStyle, safeImageUrl } from '@/lib/safety';
import { useAuth } from '@/context/AuthContext';
import type { AvailabilityException, AvailabilityRule, BookingPolicy, PortfolioItem, ProfessionalProfile, Review, Service } from '@/types';

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type BookingPanelProps = {
  error: string;
  bookingSaving: boolean;
  message: string;
  minimumBookingTime: string;
  onBook: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  selectedService: string;
  policy: BookingPolicy | null;
  services: Service[];
  setSelectedService: (value: string) => void;
  userRole?: string;
};

export function ProfessionalProfilePage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [policy, setPolicy] = useState<BookingPolicy | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [bookingSaving, setBookingSaving] = useState(false);

  const minimumBookingTime = useMemo(() => {
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    return nextHour.toISOString().slice(0, 16);
  }, []);

  useEffect(() => {
    async function load() {
      if (!slug) return;

      setError('');
      const loadedProfile = await apiFetch<ProfessionalProfile>(`/api/professionals/${slug}`);
      setProfile(loadedProfile);

      const [loadedServices, loadedPolicy, loadedPortfolio, loadedReviews, availability] = await Promise.all([
        apiFetch<Service[]>(`/api/services/professional/${loadedProfile.id}`),
        apiFetch<BookingPolicy>(`/api/bookings/policies/${loadedProfile.id}`),
        apiFetch<PortfolioItem[]>(`/api/portfolio/professional/${loadedProfile.id}`),
        apiFetch<Review[]>(`/api/reviews/professional/${loadedProfile.id}`),
        apiFetch<{ rules: AvailabilityRule[]; exceptions: AvailabilityException[] }>(`/api/availability/professional/${loadedProfile.id}`),
      ]);

      setServices(loadedServices);
      setPolicy(loadedPolicy);
      setPortfolio(loadedPortfolio);
      setReviews(loadedReviews);
      setRules(availability.rules);
      setExceptions(availability.exceptions);
      setSelectedService(loadedServices[0]?.id ?? '');
    }

    void load().catch((err) => setError(err instanceof Error ? err.message : 'Profile failed to load'));
  }, [slug]);

  async function saveFavorite() {
    if (!profile) return;
    setMessage('');
    setError('');

    try {
      await apiFetch(`/api/favorites/${profile.id}`, { method: 'POST' });
      setMessage('Professional saved to your favorites.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this professional');
    }
  }

  async function book(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || !selectedService) return;

    setMessage('');
    setError('');
    const form = new FormData(event.currentTarget);
    const startsAt = String(form.get('startsAt') || '');
    const startsAtDate = new Date(startsAt);
    const clientNote = String(form.get('clientNote') || '').trim();
    const policyAccepted = form.get('policyAccepted') === 'on';
    const reminderOptIn = form.get('reminderOptIn') === 'on';

    if (Number.isNaN(startsAtDate.getTime())) {
      setError('Choose a valid appointment date and time.');
      return;
    }
    if (clientNote.length > 1000) {
      setError('Booking notes must be 1,000 characters or fewer.');
      return;
    }
    if (!policyAccepted) {
      setError('Please review and accept the booking policy before sending your request.');
      return;
    }
    if (bookingSaving) return;

    setBookingSaving(true);
    try {
      await apiFetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          professionalId: profile.id,
          serviceId: selectedService,
          startsAt: startsAtDate.toISOString(),
          clientNote,
          policyAccepted,
          reminderOptIn,
        }),
      });
      setMessage('Booking request sent. You will receive an in-app notification when it is updated.');
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking request failed');
    } finally {
      setBookingSaving(false);
    }
  }

  if (error && !profile) {
    return <section className="mx-auto max-w-7xl px-6 py-16"><div className="card p-8 text-red-700">{error}</div></section>;
  }

  if (!profile) {
    return <section className="mx-auto max-w-7xl px-6 py-16 text-ink/60">Loading profile...</section>;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="card overflow-hidden">
        <CoverImage url={profile.coverImageUrl} />
        <div className="grid gap-8 p-8 lg:grid-cols-[1fr_380px]">
          <ProfileIntro profile={profile} canSave={user?.role === 'client'} onSave={() => void saveFavorite()} />
          <BookingPanel
            bookingSaving={bookingSaving}
            error={error}
            message={message}
            minimumBookingTime={minimumBookingTime}
            onBook={book}
            policy={policy}
            selectedService={selectedService}
            services={services}
            setSelectedService={setSelectedService}
            userRole={user?.role}
          />
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        <main>
          <ServicesSection services={services} />
          <PortfolioSection portfolio={portfolio} />
        </main>
        <aside className="space-y-8">
          <AvailabilitySection exceptions={exceptions} rules={rules} />
          <ReviewsSection reviews={reviews} />
        </aside>
      </div>
    </section>
  );
}

function CoverImage({ url }: { url?: string | null }) {
  return (
    <div
      className="h-56 bg-gradient-to-r from-rosewood to-berry"
      style={safeBackgroundImageStyle(url)}
    />
  );
}

function ProfileIntro({ canSave, onSave, profile }: { canSave: boolean; onSave: () => void; profile: ProfessionalProfile }) {
  return (
    <div>
      <p className="font-bold text-berry">{profile.category} · {profile.city}, {profile.state}</p>
      <h1 className="mt-2 text-4xl font-black text-ink">{profile.displayName}</h1>
      <p className="mt-3 text-xl font-semibold text-ink/70">{profile.headline}</p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold text-ink/55">
        <span className="inline-flex items-center"><MapPin size={16} className="mr-1" />{profile.city}, {profile.state}</span>
        {profile.licenseLabel && <span className="inline-flex items-center"><ShieldCheck size={16} className="mr-1" />{profile.licenseLabel}</span>}
        {profile.isVerified && <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-emerald-700"><ShieldCheck size={16} className="mr-1" />Verified profile</span>}
        {profile.averageRating && <span className="inline-flex items-center"><Star size={16} fill="currentColor" className="mr-1 text-gold" />{profile.averageRating.toFixed(1)} from {profile.reviewCount ?? 0} reviews</span>}
      </div>
      <div className="mt-4 grid gap-3 text-sm font-bold text-ink/60 sm:grid-cols-3">
        <span className="rounded-2xl bg-cream p-3">Trust score<br /><strong className="text-lg text-ink">{profile.trustScore ?? 0}/100</strong></span>
        <span className="rounded-2xl bg-cream p-3">Starting price<br /><strong className="text-lg text-ink">{profile.startingPriceCents !== undefined && profile.startingPriceCents !== null ? formatMoney(profile.startingPriceCents) : 'Ask pro'}</strong></span>
        <span className="rounded-2xl bg-cream p-3">Portfolio<br /><strong className="text-lg text-ink">{profile.portfolioCount ?? 0} examples</strong></span>
      </div>
      <p className="mt-6 leading-8 text-ink/70">{profile.bio}</p>
      {profile.specialties.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {profile.specialties.map((item) => <span key={item} className="rounded-full bg-blush px-3 py-1 text-sm font-bold text-rosewood">{item}</span>)}
        </div>
      )}
      {canSave && <button className="secondary-button mt-6" type="button" onClick={onSave}><Heart className="mr-2" size={16} />Save professional</button>}
    </div>
  );
}

function BookingPanel({ bookingSaving, error, message, minimumBookingTime, onBook, policy, selectedService, services, setSelectedService, userRole }: BookingPanelProps) {
  const canRequestBooking = userRole === 'client' && services.length > 0;
  const selectedServiceRecord = services.find((service) => service.id === selectedService) ?? null;
  const depositDue = policy?.depositRequired ? (selectedServiceRecord?.depositCents ?? 0) : 0;

  return (
    <form onSubmit={onBook} className="rounded-3xl bg-cream p-5">
      <h2 className="mb-4 flex items-center text-xl font-black text-ink"><CalendarPlus className="mr-2" />Request a booking</h2>
      {!userRole && <p className="mb-4 rounded-2xl bg-white p-3 text-sm font-semibold text-rosewood">Log in or register as a client to request appointments.</p>}
      {userRole && userRole !== 'client' && <p className="mb-4 rounded-2xl bg-white p-3 text-sm font-semibold text-rosewood">Only client accounts can request appointments.</p>}
      {services.length === 0 && <p className="mb-4 rounded-2xl bg-white p-3 text-sm font-semibold text-rosewood">This professional has not published bookable services yet.</p>}

      <label className="label">Service</label>
      <select className="input mt-2" value={selectedService} onChange={(event) => setSelectedService(event.target.value)} disabled={services.length === 0} required>
        {services.map((service) => <option key={service.id} value={service.id}>{service.name} · {formatMoney(service.priceCents)} · {service.durationMinutes} min</option>)}
      </select>

      <label className="label mt-4 block">Preferred date and time</label>
      <input className="input mt-2" min={minimumBookingTime} name="startsAt" type="datetime-local" disabled={!canRequestBooking} required />
      <p className="mt-2 text-xs font-semibold text-ink/50">Requests are checked against the professional’s weekly schedule, blocked dates, and existing pending or confirmed bookings.</p>

      {selectedServiceRecord && (
        <div className="mt-4 rounded-2xl bg-white p-3 text-sm text-ink/65">
          <p className="font-black text-ink">Booking terms</p>
          <p className="mt-2">{policy?.policySummary ?? 'Deposits may be required to hold appointments. Cancellation rules are shown before booking.'}</p>
          <dl className="mt-3 grid gap-2 text-xs font-semibold sm:grid-cols-2">
            <div><dt className="text-ink/45">Service price</dt><dd>{formatMoney(selectedServiceRecord.priceCents)}</dd></div>
            <div><dt className="text-ink/45">Deposit</dt><dd>{depositDue > 0 ? `${formatMoney(depositDue)} due after confirmation` : 'No deposit required'}</dd></div>
            <div><dt className="text-ink/45">Cancellation window</dt><dd>{policy?.cancellationWindowHours ?? 24} hours</dd></div>
            <div><dt className="text-ink/45">Cancellation fee</dt><dd>{formatMoney(policy?.cancellationFeeCents ?? 0)}</dd></div>
          </dl>
        </div>
      )}

      <label className="label mt-4 block">Notes</label>
      <textarea className="input mt-2 min-h-28" name="clientNote" placeholder="Share style goals, timing needs, or questions." disabled={!canRequestBooking || bookingSaving} maxLength={1000} />

      <label className="mt-4 flex items-start gap-3 rounded-2xl bg-white p-3 text-sm font-semibold text-ink/70">
        <input className="mt-1" name="policyAccepted" type="checkbox" disabled={!canRequestBooking || bookingSaving} required />
        <span>I understand and accept the professional’s booking, deposit, and cancellation policy.</span>
      </label>
      <label className="mt-3 flex items-start gap-3 rounded-2xl bg-white p-3 text-sm font-semibold text-ink/70">
        <input className="mt-1" name="reminderOptIn" type="checkbox" defaultChecked={policy?.remindersEnabled ?? true} disabled={!canRequestBooking || bookingSaving || policy?.remindersEnabled === false} />
        <span>{policy?.remindersEnabled === false ? 'This professional has reminders turned off.' : `Send me an appointment reminder ${policy?.reminderHoursBefore ?? 24} hours before the booking.`}</span>
      </label>

      {message && <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</p>}
      {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      <button className="primary-button mt-5 w-full" type="submit" disabled={!canRequestBooking || bookingSaving}>{bookingSaving ? 'Sending...' : 'Send booking request'}</button>
    </form>
  );
}

function ServicesSection({ services }: { services: Service[] }) {
  return (
    <section>
      <h2 className="mb-4 text-2xl font-black text-ink">Services</h2>
      <div className="space-y-4">
        {services.map((service) => <ServiceCard key={service.id} service={service} />)}
        {services.length === 0 && <div className="card p-5 text-sm text-ink/60">No services are published yet.</div>}
      </div>
    </section>
  );
}

function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-black text-ink">{service.name}</h3>
          <p className="mt-2 text-sm leading-6 text-ink/65">{service.description}</p>
        </div>
        <div className="text-right">
          <p className="font-black text-berry">{formatMoney(service.priceCents)}</p>
          <p className="mt-1 flex items-center text-xs font-bold text-ink/50"><Clock size={14} className="mr-1" />{service.durationMinutes} min</p>
        </div>
      </div>
    </div>
  );
}

function PortfolioSection({ portfolio }: { portfolio: PortfolioItem[] }) {
  return (
    <section>
      <h2 className="mb-4 mt-10 text-2xl font-black text-ink">Portfolio</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {portfolio.map((item) => <PortfolioFigure key={item.id} item={item} />)}
        {portfolio.length === 0 && <div className="card p-5 text-sm text-ink/60">No portfolio items yet.</div>}
      </div>
    </section>
  );
}

function PortfolioFigure({ item }: { item: PortfolioItem }) {
  const imageUrl = safeImageUrl(item.imageUrl);

  return (
    <figure className="card overflow-hidden">
      {item.beforeImageUrl && item.afterImageUrl ? (
        <div className="grid grid-cols-2">
          <img src={safeImageUrl(item.beforeImageUrl) ?? imageUrl ?? ''} alt={`Before ${item.caption}`} className="h-48 w-full object-cover" />
          <img src={safeImageUrl(item.afterImageUrl) ?? imageUrl ?? ''} alt={`After ${item.caption}`} className="h-48 w-full object-cover" />
        </div>
      ) : imageUrl ? <img src={imageUrl} alt={item.caption} className="h-48 w-full object-cover" /> : <div className="h-48 bg-gradient-to-r from-rosewood to-berry" />}
      <figcaption className="p-4 text-sm font-semibold text-ink/70">
        <p>{item.caption}</p>
        {item.transformationNotes && <p className="mt-2 text-xs leading-5 text-ink/55">{item.transformationNotes}</p>}
        {item.serviceTags && item.serviceTags.length > 0 && <p className="mt-3 flex flex-wrap gap-2">{item.serviceTags.map((tag) => <span key={tag} className="rounded-full bg-blush px-2 py-1 text-xs text-rosewood">{tag}</span>)}</p>}
      </figcaption>
    </figure>
  );
}

function AvailabilitySection({ exceptions, rules }: { exceptions: AvailabilityException[]; rules: AvailabilityRule[] }) {
  return (
    <section>
      <h2 className="mb-4 text-2xl font-black text-ink">Availability guidance</h2>
      <div className="card p-5">
        <p className="font-bold text-ink">Weekly hours</p>
        <div className="mt-3 space-y-2 text-sm text-ink/65">
          {rules.map((rule) => <p key={rule.id}>{weekdayLabels[rule.weekday]} · {rule.startTime} to {rule.endTime}</p>)}
          {rules.length === 0 && <p>Flexible scheduling. Submit a preferred time and the professional will confirm.</p>}
        </div>
        {exceptions.length > 0 && <p className="mt-4 text-xs font-bold text-rosewood">Some upcoming dates are blocked by this professional.</p>}
      </div>
    </section>
  );
}

function ReviewsSection({ reviews }: { reviews: Review[] }) {
  return (
    <section>
      <h2 className="mb-4 text-2xl font-black text-ink">Reviews</h2>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="flex text-gold">{Array.from({ length: review.rating }).map((_, index) => <Star key={index} size={16} fill="currentColor" />)}</p>
              {review.wouldRecommend && <span className="inline-flex items-center text-xs font-black text-emerald-700"><ThumbsUp size={14} className="mr-1" />Would recommend</span>}
            </div>
            <p className="mt-3 text-sm leading-6 text-ink/70">{review.comment}</p>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-xs font-bold text-ink/55">
              <div><dt>Cleanliness</dt><dd>{review.cleanlinessRating ?? review.rating}/5</dd></div>
              <div><dt>Communication</dt><dd>{review.communicationRating ?? review.rating}/5</dd></div>
              <div><dt>Value</dt><dd>{review.valueRating ?? review.rating}/5</dd></div>
            </dl>
            {review.photoUrls && review.photoUrls.length > 0 && <div className="mt-3 grid grid-cols-3 gap-2">{review.photoUrls.map((url) => <img key={url} src={safeImageUrl(url) ?? ''} alt="Review attachment" className="h-16 rounded-xl object-cover" />)}</div>}
            {review.helpfulCount !== undefined && <p className="mt-3 text-xs font-bold text-ink/45">{review.helpfulCount} clients found this helpful</p>}
          </div>
        ))}
        {reviews.length === 0 && <div className="card p-5 text-sm text-ink/60">No reviews yet.</div>}
      </div>
    </section>
  );
}
