import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { serviceCategories, type ServiceCategory } from '@shared/types';

const featuredCategories = serviceCategories.slice(0, 8).map((category) => ({
  label: `${category}s`,
  value: category,
})) satisfies Array<{ label: string; value: ServiceCategory }>;

const heroMetrics = [
  { label: 'Service categories', value: '12+' },
  { label: 'Booking flow', value: 'Clean' },
  { label: 'Profile tools', value: 'Pro' },
];

const bookingRows = [
  { service: 'Silk press consultation', client: 'New client', status: 'Request', time: '10:30 AM' },
  { service: 'Gel manicure', client: 'Returning', status: 'Confirmed', time: '1:00 PM' },
  { service: 'Hydrating facial', client: 'VIP', status: 'Confirmed', time: '3:45 PM' },
];

const trustSignals = [
  { icon: <Search size={20} />, title: 'Discovery that feels intentional', text: 'Clients can browse by category, location, service style, and profile details instead of piecing together scattered recommendations.' },
  { icon: <HeartHandshake size={20} />, title: 'Profiles that look worth booking', text: 'Professionals can present services, portfolio highlights, and booking interest in a structured format that looks polished from day one.' },
  { icon: <ShieldCheck size={20} />, title: 'Quality can stay protected', text: 'Admin workflows help keep the directory intentional, credible, and easier to manage as the marketplace grows.' },
];

export function Home() {
  return (
    <div className="overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(201,154,70,.18),transparent_34rem),linear-gradient(135deg,#f7f0e8_0%,#fffaf5_48%,#efe4d8_100%)]">
      <section className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:py-20">
        <div className="absolute left-1/2 top-10 -z-0 h-80 w-80 -translate-x-1/2 rounded-full bg-gold/15 blur-3xl" aria-hidden="true" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-rosewood/10 bg-white/75 px-4 py-2 text-sm font-extrabold text-rosewood shadow-sm backdrop-blur">
            <Sparkles size={16} className="text-gold" />
            The beauty directory built to feel premium
          </div>

          <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[.98] tracking-[-0.05em] text-ink sm:text-6xl lg:text-7xl">
            Find and book beauty professionals with confidence.
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-ink/70 sm:text-xl">
            Pro Beauty List gives clients a polished place to discover trusted beauty pros, compare services, and start booking requests. Professionals get a profile that feels worth sharing and a cleaner way to manage appointment interest.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to="/search" className="primary-button px-7 py-4 text-base shadow-[0_18px_45px_rgba(138,90,43,.25)]">
              Search professionals <ArrowRight className="ml-2" size={19} />
            </Link>
            <Link to="/auth/register" className="secondary-button px-7 py-4 text-base">
              Create your profile
            </Link>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            {heroMetrics.map((metric) => (
              <div key={metric.label} className="rounded-3xl border border-white/70 bg-white/65 p-4 shadow-sm backdrop-blur">
                <p className="text-2xl font-black tracking-tight text-ink">{metric.value}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[.14em] text-ink/45">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gold/25 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-12 -left-10 h-56 w-56 rounded-full bg-rosewood/15 blur-3xl" aria-hidden="true" />

          <div className="relative rounded-[2.4rem] border border-white/70 bg-white/75 p-4 shadow-[0_35px_90px_rgba(47,36,31,.16)] backdrop-blur-xl">
            <div className="rounded-[2rem] bg-gradient-to-br from-[#3a2a22] via-rosewood to-berry p-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.18)] sm:p-8">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.28em] text-white/55">Today's board</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight">3 booking requests</h2>
                  <p className="mt-2 text-sm font-medium text-white/65">Organized, clear, and ready to review.</p>
                </div>
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/12 ring-1 ring-white/15">
                  <CalendarCheck size={31} />
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {bookingRows.map((row) => (
                  <div key={row.service} className="rounded-3xl border border-white/10 bg-white/[.09] p-4 backdrop-blur">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-black leading-tight">{row.service}</p>
                        <p className="mt-1 text-sm text-white/60">{row.client} · {row.time}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-rosewood">{row.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 p-2 pt-4 sm:grid-cols-3">
              <MiniCard icon={<MapPin size={17} />} label="Local discovery" />
              <MiniCard icon={<BadgeCheck size={17} />} label="Trusted profiles" />
              <MiniCard icon={<Clock3 size={17} />} label="Cleaner requests" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] border border-white/70 bg-white/72 p-5 shadow-[0_28px_80px_rgba(47,36,31,.10)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[.2em] text-berry">Why it feels different</p>
              <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-[-.035em] text-ink sm:text-5xl">A homepage designed to make the first impression feel trustworthy.</h2>
            </div>
            <p className="max-w-md text-base leading-7 text-ink/62">The experience has to reassure clients that they are in the right place and show professionals that joining will elevate how their work is presented.</p>
          </div>

          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {trustSignals.map((signal) => (
              <Feature key={signal.title} {...signal} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 rounded-[2.5rem] bg-ink p-6 text-white shadow-[0_30px_90px_rgba(47,36,31,.22)] sm:p-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black text-gold ring-1 ring-white/10">
              <Star size={16} fill="currentColor" />
              Built for beauty, not generic bookings
            </div>
            <h2 className="mt-5 text-3xl font-black tracking-[-.035em] sm:text-5xl">Hair, nails, skin, lashes, brows, makeup, barbering — all in one polished directory.</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/65">The category experience should feel curated and high-intent, not like a random classified listing. Clients can start with what they need and professionals can show up where they belong.</p>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            {featuredCategories.map((category) => (
              <Link
                to={`/search?category=${encodeURIComponent(category.value)}`}
                key={category.value}
                className="rounded-full border border-white/12 bg-white/10 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-gold hover:text-ink"
              >
                {category.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-rosewood/10 bg-white/70 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[.2em] text-berry">Ready when they are</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.03em] text-ink">Make the first click feel worth it.</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/search" className="secondary-button px-6 py-4">Browse pros</Link>
            <Link to="/auth/register" className="primary-button px-6 py-4">Join Pro Beauty List <UsersRound className="ml-2" size={18} /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniCard({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-cream/80 px-3 py-3 text-sm font-black text-rosewood">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-berry shadow-sm">{icon}</span>
      {label}
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-[0_18px_50px_rgba(47,36,31,.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(47,36,31,.12)]">
      <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-cream text-berry ring-1 ring-rosewood/10">{icon}</div>
      <h3 className="text-xl font-black tracking-[-.02em] text-ink">{title}</h3>
      <p className="mt-3 leading-7 text-ink/64">{text}</p>
    </div>
  );
}
