import type { ReactNode } from 'react';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Heart,
  MapPin,
  Search,
  Scissors,
  Sparkles,
  Star,
  UserRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { serviceCategories } from '@shared/types';

const heroServices = serviceCategories.slice(0, 8);
const browseServices = serviceCategories.slice(0, 10);

const clientSteps = [
  {
    icon: <Search size={22} />,
    title: 'Pick the service',
    text: 'Start with hair, nails, skin, lashes, brows, makeup, barbering, massage, or another beauty need.',
  },
  {
    icon: <MapPin size={22} />,
    title: 'Find the right fit',
    text: 'Use service details, specialties, location, and profile information to decide who feels right.',
  },
  {
    icon: <CalendarDays size={22} />,
    title: 'Start the request',
    text: 'Move from browsing to booking interest without digging through posts, screenshots, or old recommendations.',
  },
];

export function Home() {
  return (
    <div className="overflow-hidden bg-[#fff8f2] text-ink">
      <section className="relative border-b border-rosewood/10 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(239,228,216,.9),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(212,166,90,.22),transparent_30%),linear-gradient(135deg,#fffaf5_0%,#f8eee4_48%,#fff7ee_100%)]" />
        <div className="absolute left-[-8rem] top-24 -z-10 h-72 w-72 rounded-full bg-gold/15 blur-3xl" />
        <div className="absolute bottom-[-9rem] right-[-6rem] -z-10 h-80 w-80 rounded-full bg-berry/10 blur-3xl" />

        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-rosewood/10 bg-white/82 px-4 py-2 text-sm font-black text-rosewood shadow-sm backdrop-blur">
              <Sparkles size={16} className="text-gold" />
              The beauty directory made for real appointments
            </p>

            <h1 className="mt-6 text-3xl font-black leading-[1.08] tracking-[-0.03em] text-ink sm:text-4xl lg:text-5xl">
              Your next beauty appointment starts with the right pro.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-8 text-ink/68 sm:text-lg">
              Browse local hair stylists, nail techs, estheticians, lash artists, barbers, makeup artists, massage therapists, and more — organized by service, style, and fit.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/search" className="primary-button px-7 py-4 text-base shadow-[0_18px_36px_rgba(138,90,43,.24)]">
                Find your pro <ArrowRight className="ml-2" size={18} />
              </Link>
              <Link to="/auth/register" className="secondary-button px-7 py-4 text-base">
                List your services
              </Link>
            </div>

            <div className="mt-8 grid max-w-lg grid-cols-3 gap-3 text-center">
              <MiniProof label="Service-first" detail="Search" />
              <MiniProof label="Local" detail="Profiles" />
              <MiniProof label="Booking" detail="Requests" />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-2xl lg:mr-0">
            <div className="absolute -left-4 top-8 hidden rounded-full border border-white/70 bg-white/80 px-5 py-3 text-sm font-black text-rosewood shadow-[0_18px_45px_rgba(47,36,31,.12)] backdrop-blur sm:block">
              Hair · Nails · Skin · Lashes
            </div>
            <div className="absolute -right-2 bottom-12 hidden rounded-full border border-white/70 bg-rosewood px-5 py-3 text-sm font-black text-white shadow-[0_18px_45px_rgba(47,36,31,.18)] sm:block">
              Local beauty pros
            </div>

            <div className="relative rounded-[2.5rem] border border-white/75 bg-white/72 p-4 shadow-[0_30px_90px_rgba(47,36,31,.15)] backdrop-blur-xl sm:p-6">
              <div className="absolute right-8 top-8 h-28 w-28 rounded-full bg-gold/20 blur-2xl" />
              <div className="grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
                <div className="rounded-[2rem] bg-[linear-gradient(160deg,#5f4638_0%,#8a5a2b_58%,#d4a65a_140%)] p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.2)]">
                  <div className="flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20">
                      <Scissors size={22} />
                    </span>
                    <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-black uppercase tracking-[.14em] text-white/80">Beauty menu</span>
                  </div>
                  <h2 className="mt-8 text-2xl font-black leading-tight tracking-[-.03em] sm:text-3xl">Book the look, not the guesswork.</h2>
                  <p className="mt-4 text-sm leading-6 text-white/76">A calmer way to discover the person behind the service you need.</p>
                  <div className="mt-7 space-y-3">
                    {['Hair color', 'Gel manicure', 'Facial', 'Lash fill'].map((item) => (
                      <div key={item} className="flex items-center justify-between rounded-2xl bg-white/12 px-4 py-3 text-sm font-bold ring-1 ring-white/12">
                        <span>{item}</span>
                        <Star size={15} className="text-gold" fill="currentColor" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-rosewood/10 bg-[#fffaf5] p-4 shadow-sm sm:p-5">
                  <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-rosewood/8">
                    <p className="text-xs font-black uppercase tracking-[.18em] text-rosewood/70">Search Pro Beauty List</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_.8fr]">
                      <div className="rounded-2xl border border-rosewood/10 bg-[#f7f0e8] px-4 py-3">
                        <p className="text-xs font-bold text-ink/45">Service</p>
                        <p className="mt-1 font-black text-ink">Lash artist</p>
                      </div>
                      <div className="rounded-2xl border border-rosewood/10 bg-[#f7f0e8] px-4 py-3">
                        <p className="text-xs font-bold text-ink/45">Area</p>
                        <p className="mt-1 font-black text-ink">Nearby</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {heroServices.map((category) => (
                      <Link
                        key={category}
                        to={`/search?category=${encodeURIComponent(category)}`}
                        className="group rounded-2xl border border-rosewood/10 bg-white px-4 py-3 text-sm font-black text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-berry/35 hover:shadow-md"
                      >
                        <span className="flex items-center justify-between gap-3">
                          {category}
                          <ArrowRight size={15} className="text-berry transition group-hover:translate-x-1" />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto -mt-8 grid max-w-6xl gap-3 rounded-[2rem] border border-rosewood/10 bg-white/92 p-3 shadow-[0_22px_60px_rgba(47,36,31,.10)] backdrop-blur sm:grid-cols-[1fr_1fr_auto] sm:p-4">
          <SearchPanelItem eyebrow="What are you booking?" value="Hair, nails, lashes, skin, makeup…" icon={<Search size={19} />} />
          <SearchPanelItem eyebrow="Where should we look?" value="Browse local beauty professionals" icon={<MapPin size={19} />} />
          <Link to="/search" className="primary-button h-full px-7 py-4 text-base sm:min-w-44">
            Browse now
          </Link>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[.2em] text-rosewood">For clients</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-.035em] text-ink sm:text-5xl">A prettier way to find your person.</h2>
            <p className="mt-4 text-lg leading-8 text-ink/62">Pro Beauty List is built around the way people actually book beauty: start with the service, compare who offers it, then reach out when it feels right.</p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {clientSteps.map((step) => (
              <FeatureCard key={step.title} icon={step.icon} title={step.title} text={step.text} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative border-y border-rosewood/10 bg-[#f7f0e8] px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/70 to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[.2em] text-rosewood">Browse by service</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-.035em] text-ink sm:text-5xl">The beauty menu is the marketplace.</h2>
              <p className="mt-5 text-lg leading-8 text-ink/64">Clients should not have to decode someone’s entire feed to find out what they do. Pro Beauty List makes the service the front door.</p>
              <Link to="/search" className="secondary-button mt-7 px-6 py-3">
                See all professionals <ArrowRight className="ml-2" size={17} />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {browseServices.map((category, index) => (
                <Link
                  key={category}
                  to={`/search?category=${encodeURIComponent(category)}`}
                  className={`group overflow-hidden rounded-[1.5rem] border border-rosewood/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-berry/35 hover:shadow-[0_18px_42px_rgba(47,36,31,.10)] ${index === 0 ? 'sm:col-span-2' : ''}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[.16em] text-ink/36">Service</p>
                      <h3 className="mt-2 text-xl font-black tracking-[-.02em] text-ink">{category}</h3>
                    </div>
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#fff3e2] text-berry transition group-hover:bg-berry group-hover:text-white">
                      <ArrowRight size={18} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 overflow-hidden rounded-[2.5rem] border border-rosewood/10 bg-[linear-gradient(135deg,#fffaf5,#f4e7d8)] p-6 shadow-[0_24px_70px_rgba(47,36,31,.10)] sm:p-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center xl:grid-cols-[minmax(0,1fr)_480px]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-rosewood ring-1 ring-rosewood/10">
              <UserRound size={17} />
              For beauty professionals
            </p>
            <h2 className="mt-5 max-w-2xl text-3xl font-black leading-tight tracking-[-.035em] text-ink sm:text-4xl xl:text-5xl">Turn your services into a clean profile clients can trust.</h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-ink/66 sm:text-lg">Show what you offer, where you work, what you specialize in, and how booking starts. Less explaining in DMs, more clarity before clients contact you.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/auth/register" className="primary-button px-7 py-4 text-base">
                Create a profile <ArrowRight className="ml-2" size={18} />
              </Link>
              <Link to="/search" className="secondary-button px-7 py-4 text-base">
                Browse the directory
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/78 p-5 shadow-[0_20px_55px_rgba(47,36,31,.10)] backdrop-blur">
            <div className="rounded-[1.5rem] bg-rosewood p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.18em] text-white/58">Profile preview</p>
                  <h3 className="mt-2 text-2xl font-black tracking-[-.03em]">Services, style, booking.</h3>
                </div>
                <Heart className="text-gold" fill="currentColor" size={24} />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <ProfileLine text="Services clients can browse" />
              <ProfileLine text="Specialties and service area" />
              <ProfileLine text="Portfolio details and booking request path" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniProof({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-rosewood/10 bg-white/72 px-3 py-4 shadow-sm backdrop-blur">
      <p className="text-sm font-black text-ink">{label}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[.14em] text-ink/42">{detail}</p>
    </div>
  );
}

function SearchPanelItem({ eyebrow, value, icon }: { eyebrow: string; value: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-[1.4rem] bg-[#fffaf5] px-4 py-4 ring-1 ring-rosewood/8">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-berry shadow-sm">{icon}</span>
      <div>
        <p className="text-xs font-black uppercase tracking-[.16em] text-ink/42">{eyebrow}</p>
        <p className="mt-1 font-black text-ink">{value}</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[2rem] border border-rosewood/10 bg-[#fffaf5] p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(47,36,31,.08)]">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-berry shadow-sm ring-1 ring-rosewood/8">{icon}</span>
      <h3 className="mt-5 text-xl font-black tracking-[-.02em] text-ink">{title}</h3>
      <p className="mt-3 leading-7 text-ink/62">{text}</p>
    </div>
  );
}

function ProfileLine({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#fffaf5] px-4 py-3 ring-1 ring-rosewood/8">
      <CheckCircle2 size={19} className="shrink-0 text-berry" />
      <p className="font-bold text-ink/72">{text}</p>
    </div>
  );
}
