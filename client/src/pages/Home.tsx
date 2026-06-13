import {
  ArrowRight,
  CalendarDays,
  Check,
  MapPin,
  Search,
  UserRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { serviceCategories } from '@shared/types';

export function Home() {
  return (
    <div className="bg-[#fffaf5] text-ink">
      <section className="border-b border-rosewood/10 px-4 py-12 sm:px-6 lg:px-8 lg:py-18">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.86fr] lg:items-center">
          <div>
            <p className="inline-flex items-center rounded-full border border-rosewood/12 bg-white px-4 py-2 text-sm font-extrabold text-rosewood shadow-sm">
              Beauty appointments start here
            </p>

            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.045em] text-ink sm:text-6xl lg:text-7xl">
              Find a local beauty professional without the runaround.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/70 sm:text-xl">
              Search for hair stylists, nail techs, estheticians, lash artists, makeup artists, barbers, massage therapists, and other beauty pros in one directory.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/search" className="primary-button px-7 py-4 text-base shadow-[0_18px_42px_rgba(95,70,56,.18)]">
                Find a pro <ArrowRight className="ml-2" size={19} />
              </Link>
              <Link to="/auth/register" className="secondary-button px-7 py-4 text-base">
                List your business
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-rosewood/10 bg-white p-5 shadow-[0_24px_70px_rgba(47,36,31,.12)] sm:p-6">
            <div className="rounded-[1.5rem] bg-[#f7f0e8] p-5 sm:p-6">
              <p className="text-sm font-black uppercase tracking-[.16em] text-rosewood">Search the directory</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-.035em] text-ink">Start with the service you need.</h2>
              <p className="mt-3 leading-7 text-ink/64">Choose a category, compare profiles, and start from the professional who fits the appointment.</p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {serviceCategories.slice(0, 8).map((category) => (
                <Link
                  key={category}
                  to={`/search?category=${encodeURIComponent(category)}`}
                  className="group flex items-center justify-between rounded-2xl border border-rosewood/10 bg-white px-4 py-4 text-left font-black text-ink shadow-sm transition hover:border-rosewood/25 hover:bg-[#fffaf5]"
                >
                  <span>{category}</span>
                  <ArrowRight size={17} className="text-rosewood transition group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[.82fr_1.18fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[.18em] text-rosewood">For clients</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-.035em] text-ink sm:text-5xl">Look up the appointment, then choose the person.</h2>
              <p className="mt-5 text-lg leading-8 text-ink/66">Pro Beauty List keeps the first step simple: pick the service, review available professionals, and decide who to contact.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-rosewood/10 bg-[#fffaf5] p-5">
                <Search className="text-rosewood" size={24} />
                <h3 className="mt-4 text-xl font-black tracking-[-.02em] text-ink">Search by service</h3>
                <p className="mt-3 leading-7 text-ink/64">Find the type of beauty appointment you are trying to book.</p>
              </div>
              <div className="rounded-[1.5rem] border border-rosewood/10 bg-[#fffaf5] p-5">
                <MapPin className="text-rosewood" size={24} />
                <h3 className="mt-4 text-xl font-black tracking-[-.02em] text-ink">Check fit</h3>
                <p className="mt-3 leading-7 text-ink/64">Read profile details before you spend time reaching out.</p>
              </div>
              <div className="rounded-[1.5rem] border border-rosewood/10 bg-[#fffaf5] p-5">
                <CalendarDays className="text-rosewood" size={24} />
                <h3 className="mt-4 text-xl font-black tracking-[-.02em] text-ink">Request booking</h3>
                <p className="mt-3 leading-7 text-ink/64">Start the appointment request from the professional profile.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-rosewood/10 bg-[#f7f0e8] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[.18em] text-rosewood">Service categories</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-.035em] text-ink sm:text-5xl">Browse common beauty services.</h2>
            </div>
            <Link to="/search" className="secondary-button w-fit px-6 py-3 text-sm">
              View all professionals
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {serviceCategories.slice(0, 12).map((category) => (
              <Link
                key={category}
                to={`/search?category=${encodeURIComponent(category)}`}
                className="group rounded-2xl border border-rosewood/10 bg-white px-5 py-4 font-black text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-rosewood/25"
              >
                <span className="flex items-center justify-between gap-4">
                  {category}
                  <ArrowRight size={16} className="text-rosewood transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-[2rem] border border-rosewood/10 bg-[#fffaf5] p-6 shadow-sm sm:p-8 lg:grid-cols-[1fr_.85fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-rosewood ring-1 ring-rosewood/10">
              <UserRound size={17} />
              For beauty professionals
            </div>
            <h2 className="mt-5 text-3xl font-black tracking-[-.035em] text-ink sm:text-5xl">Put your services somewhere clients can actually understand them.</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/68">Create a profile for your services, specialties, location, portfolio details, and booking requests. Keep it clear so clients know whether you are the right fit before they contact you.</p>
          </div>

          <div className="rounded-[1.5rem] border border-rosewood/10 bg-white p-5">
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rosewood text-white"><Check size={16} /></span>
                <p className="leading-7 text-ink/68"><strong className="text-ink">Show what you offer.</strong> List services in a way clients can browse.</p>
              </div>
              <div className="flex gap-3">
                <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rosewood text-white"><Check size={16} /></span>
                <p className="leading-7 text-ink/68"><strong className="text-ink">Set expectations.</strong> Add location, specialties, and portfolio details.</p>
              </div>
              <div className="flex gap-3">
                <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rosewood text-white"><Check size={16} /></span>
                <p className="leading-7 text-ink/68"><strong className="text-ink">Receive requests.</strong> Let clients begin from your profile.</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link to="/auth/register" className="primary-button justify-center px-7 py-4 text-base">
                Create a profile <ArrowRight className="ml-2" size={19} />
              </Link>
              <Link to="/search" className="secondary-button justify-center px-7 py-4 text-base">
                Browse first
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
