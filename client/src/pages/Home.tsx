import type { ReactNode } from 'react';
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

const categoryHighlights = serviceCategories.slice(0, 8).map((category) => ({
  label: `${category}s`,
  value: category,
})) satisfies Array<{ label: string; value: ServiceCategory }>;

const serviceExamples = [
  'Hair color',
  'Silk press',
  'Gel manicure',
  'Facials',
  'Lash extensions',
  'Brow shaping',
  'Makeup',
  'Barbering',
];

const proCards = [
  { name: 'Maya R.', role: 'Hair stylist', detail: 'Color, cuts, silk press', badge: 'Portfolio ready' },
  { name: 'Jules N.', role: 'Nail artist', detail: 'Gel sets, art, structured manicures', badge: 'Service menu' },
  { name: 'Ari C.', role: 'Esthetician', detail: 'Facials, brows, skin care', badge: 'Booking requests' },
];

const steps = [
  {
    icon: <Search size={22} />,
    title: 'Search by service',
    text: 'Start with what you need: hair, nails, skin, lashes, brows, makeup, barbering, massage, and more.',
  },
  {
    icon: <BadgeCheck size={22} />,
    title: 'Compare real profiles',
    text: 'Review service details, portfolio highlights, location, and professional information before reaching out.',
  },
  {
    icon: <CalendarCheck size={22} />,
    title: 'Request a booking',
    text: 'Send appointment interest through a cleaner flow instead of chasing scattered DMs and random recommendations.',
  },
];

const professionalBenefits = [
  'Create a profile clients can understand quickly',
  'Show services, specialties, and portfolio highlights',
  'Receive booking interest in one organized place',
];

export function Home() {
  return (
    <div className="overflow-hidden bg-[#fffaf5] text-ink">
      <section className="relative border-b border-rosewood/10 bg-[linear-gradient(135deg,#fffaf5_0%,#f7f0e8_46%,#efe4d8_100%)]">
        <div className="absolute inset-x-0 top-0 h-32 bg-white/55" aria-hidden="true" />
        <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_.92fr] lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-rosewood/12 bg-white px-4 py-2 text-sm font-extrabold text-rosewood shadow-sm">
              <Sparkles size={16} className="text-gold" />
              Beauty services near you
            </div>

            <h1 className="mt-7 text-5xl font-black leading-[1.02] tracking-[-0.05em] text-ink sm:text-6xl lg:text-7xl">
              Find a beauty pro for your next appointment.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/72 sm:text-xl">
              Pro Beauty List helps clients discover local professionals for hair, nails, skin, lashes, brows, makeup, barbering, massage, and more — then compare profiles and start a booking request in one simple place.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/search" className="primary-button px-7 py-4 text-base shadow-[0_18px_42px_rgba(138,90,43,.22)]">
                Find beauty pros <ArrowRight className="ml-2" size={19} />
              </Link>
              <Link to="/auth/register" className="secondary-button px-7 py-4 text-base">
                Create a pro profile
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {serviceExamples.map((service) => (
                <span key={service} className="rounded-full border border-rosewood/10 bg-white/82 px-4 py-2 text-sm font-bold text-rosewood shadow-sm">
                  {service}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 top-8 h-44 w-44 rounded-full bg-gold/25 blur-3xl" aria-hidden="true" />
            <div className="absolute -right-10 bottom-0 h-60 w-60 rounded-full bg-rosewood/12 blur-3xl" aria-hidden="true" />

            <div className="relative rounded-[2rem] border border-white/80 bg-white/86 p-4 shadow-[0_30px_90px_rgba(47,36,31,.14)] backdrop-blur-xl sm:p-5">
              <div className="rounded-[1.6rem] border border-rosewood/10 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[.18em] text-berry">Start here</p>
                    <h2 className="mt-1 text-2xl font-black tracking-[-.03em] text-ink">What beauty service do you need?</h2>
                  </div>
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cream text-berry ring-1 ring-rosewood/10">
                    <Search size={24} />
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <SearchField label="Service" value="Hair stylist, nail artist, esthetician..." icon={<Sparkles size={18} />} />
                  <SearchField label="Location" value="Search by city or neighborhood" icon={<MapPin size={18} />} />
                </div>

                <Link to="/search" className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-berry px-5 py-4 text-sm font-black text-white shadow-[0_15px_35px_rgba(138,90,43,.22)] transition hover:bg-rosewood">
                  Browse the directory <ArrowRight className="ml-2" size={18} />
                </Link>
              </div>

              <div className="mt-4 grid gap-3">
                {proCards.map((pro) => (
                  <div key={pro.name} className="flex items-center justify-between gap-4 rounded-3xl border border-rosewood/10 bg-white p-4 shadow-sm">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#f7f0e8,#efe4d8)] text-lg font-black text-rosewood ring-1 ring-rosewood/10">
                        {pro.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black leading-tight text-ink">{pro.name}</p>
                        <p className="text-sm font-bold text-berry">{pro.role}</p>
                        <p className="truncate text-sm text-ink/56">{pro.detail}</p>
                      </div>
                    </div>
                    <span className="hidden shrink-0 rounded-full bg-cream px-3 py-1.5 text-xs font-black text-rosewood sm:inline-flex">{pro.badge}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[.2em] text-berry">Browse by service</p>
              <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-[-.035em] text-ink sm:text-5xl">It should be obvious what you can book.</h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-ink/64">
              Clients should not have to guess what Pro Beauty List is. The directory is built for everyday beauty services and the professionals who provide them.
            </p>
          </div>

          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categoryHighlights.map((category) => (
              <Link
                to={`/search?category=${encodeURIComponent(category.value)}`}
                key={category.value}
                className="group rounded-[1.6rem] border border-rosewood/10 bg-cream/65 p-5 shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_50px_rgba(47,36,31,.10)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-lg font-black tracking-[-.02em] text-ink">{category.label}</span>
                  <ArrowRight size={18} className="text-berry transition group-hover:translate-x-1" />
                </div>
                <p className="mt-2 text-sm leading-6 text-ink/58">Find professionals, compare services, and start from a profile.</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fffaf5] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[.2em] text-berry">How it works</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-.035em] text-ink sm:text-5xl">Simple for clients. Useful for professionals.</h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <InfoCard key={step.title} icon={step.icon} title={`${index + 1}. ${step.title}`} text={step.text} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-[2rem] border border-rosewood/10 bg-ink p-6 text-white shadow-[0_30px_90px_rgba(47,36,31,.20)] sm:p-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black text-gold ring-1 ring-white/10">
              <UsersRound size={17} />
              For beauty professionals
            </div>
            <h2 className="mt-5 text-3xl font-black tracking-[-.035em] sm:text-5xl">Give clients a clear place to understand your work.</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/68">
              Pro Beauty List helps professionals present services, specialties, and portfolio details in a profile that is easier to share than a messy thread of screenshots and messages.
            </p>
            <Link to="/auth/register" className="mt-7 inline-flex items-center rounded-full bg-gold px-6 py-4 text-sm font-black text-ink transition hover:bg-white">
              Create your profile <ArrowRight className="ml-2" size={18} />
            </Link>
          </div>

          <div className="grid gap-3">
            {professionalBenefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/9 p-4 text-white shadow-sm backdrop-blur">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-berry">
                  <CheckCircle2 size={20} />
                </span>
                <span className="font-bold leading-6">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-rosewood/10 bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[.2em] text-berry">Built to feel safer than guesswork</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-.035em] text-ink sm:text-5xl">Less random searching. More clear profiles.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <TrustPill icon={<ShieldCheck size={20} />} title="Directory focus" text="Beauty services are the point, not an afterthought." />
            <TrustPill icon={<HeartHandshake size={20} />} title="Client clarity" text="People can see what a professional offers before reaching out." />
            <TrustPill icon={<Clock3 size={20} />} title="Cleaner requests" text="Booking interest starts in a more organized place." />
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(135deg,#f7f0e8,#fffaf5)] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 rounded-[2rem] border border-white/80 bg-white/78 p-6 shadow-[0_20px_70px_rgba(47,36,31,.10)] backdrop-blur sm:p-8 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[.18em] text-berry">
              <Star size={16} fill="currentColor" />
              Start with the service you need
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-[-.035em] text-ink sm:text-4xl">Find a beauty professional or create your profile today.</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/search" className="primary-button px-7 py-4 text-base">Browse beauty pros</Link>
            <Link to="/auth/register" className="secondary-button px-7 py-4 text-base">Join as a professional</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function SearchField({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-rosewood/10 bg-cream/70 px-4 py-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-berry shadow-sm">{icon}</span>
      <div>
        <p className="text-xs font-black uppercase tracking-[.16em] text-ink/42">{label}</p>
        <p className="text-sm font-bold text-ink">{value}</p>
      </div>
    </div>
  );
}

function InfoCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[1.8rem] border border-rosewood/10 bg-white p-6 shadow-[0_16px_45px_rgba(47,36,31,.08)]">
      <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-cream text-berry ring-1 ring-rosewood/10">{icon}</div>
      <h3 className="text-xl font-black tracking-[-.02em] text-ink">{title}</h3>
      <p className="mt-3 leading-7 text-ink/62">{text}</p>
    </div>
  );
}

function TrustPill({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[1.5rem] border border-rosewood/10 bg-cream/60 p-5">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-white text-berry shadow-sm">{icon}</div>
      <h3 className="font-black text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-ink/58">{text}</p>
    </div>
  );
}
