import { ArrowRight, CalendarCheck, CheckCircle2, HeartHandshake, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

import { serviceCategories, type ServiceCategory } from '@shared/types';

const featuredCategories = serviceCategories.slice(0, 6).map((category) => ({
  label: `${category}s`,
  value: category,
})) satisfies Array<{ label: string; value: ServiceCategory }>;

export function Home() {
  return (
    <div>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-28">
        <div className="flex flex-col justify-center">
          <p className="mb-5 inline-flex w-fit rounded-full bg-blush px-4 py-2 text-sm font-bold text-rosewood">Beauty bookings, cleaned up and done right.</p>
          <h1 className="text-5xl font-black leading-tight tracking-tight text-ink sm:text-6xl">Find and book beauty professionals online.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/70">Pro Beauty List connects clients with trusted beauty professionals across hair, nails, skin, barbering, makeup, lashes, brows, and more. Professionals get a real profile, services, booking workflow, notifications, and a cleaner way to run client requests.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/search" className="primary-button">Search professionals <ArrowRight className="ml-2" size={18} /></Link>
            <Link to="/auth/register" className="secondary-button">Create your profile</Link>
          </div>
        </div>
        <div className="card overflow-hidden p-4">
          <div className="rounded-[1.6rem] bg-gradient-to-br from-rosewood to-berry p-8 text-white">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[.25em] text-white/70">Today</p>
                <h2 className="text-3xl font-black">3 booking requests</h2>
              </div>
              <CalendarCheck size={42} />
            </div>
            <div className="space-y-3">
              {['Silk press consultation', 'Gel manicure', 'Hydrating facial'].map((item, index) => (
                <div key={item} className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-bold">{item}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-rosewood">{index === 0 ? 'New' : 'Confirmed'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <Feature icon={<Search />} title="Clients can find the right pro" text="Search by category, location, service, style, and profile details instead of guessing from scattered links." />
          <Feature icon={<HeartHandshake />} title="Professionals can manage requests" text="Profiles, services, portfolio, booking status, and notifications live in one clean workflow." />
          <Feature icon={<CheckCircle2 />} title="Admins can protect quality" text="Approval workflows keep the directory intentional, credible, and safer as the marketplace grows." />
        </div>
      </section>

      <section className="bg-white/70 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-ink">Built for the whole beauty industry.</h2>
          <div className="mt-8 flex flex-wrap gap-3">
            {featuredCategories.map((category) => <Link to={`/search?category=${encodeURIComponent(category.value)}`} key={category.value} className="rounded-full bg-blush px-5 py-3 font-bold text-rosewood hover:bg-berry hover:text-white">{category.label}</Link>)}
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="card p-7"><div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-blush text-rosewood">{icon}</div><h3 className="text-xl font-black text-ink">{title}</h3><p className="mt-3 leading-7 text-ink/65">{text}</p></div>;
}
