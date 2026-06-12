import { Link } from 'react-router-dom';
import { OrganizationSwitcher } from '@clerk/react';
import { useAuth } from '@/context/AuthContext';

export function BusinessOnboarding() {
  const { user } = useAuth();

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="card p-8">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-berry">Salon / business setup</p>
        <h1 className="mt-3 text-4xl font-black text-ink">Set up your business workspace</h1>
        <p className="mt-4 max-w-3xl leading-8 text-ink/70">
          Hi {user?.firstName ?? 'there'}, your account is set up as a salon or business account. Clerk owns your team workspace, while Pro Beauty List owns the marketplace data: profiles, services, bookings, portfolio, and permissions.
        </p>

        <div className="mt-8 rounded-3xl border border-rosewood/10 bg-cream/70 p-6">
          <h2 className="text-xl font-black text-ink">Active organization</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            Use the organization switcher to confirm the active salon/business workspace. Staff and organization roles can be expanded here as the team workflow is built out.
          </p>
          <div className="mt-4">
            <OrganizationSwitcher hidePersonal afterCreateOrganizationUrl="/business/onboarding" afterSelectOrganizationUrl="/business/onboarding" />
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-rosewood/10 bg-white p-5">
            <h3 className="font-black text-ink">1. Business identity</h3>
            <p className="mt-2 text-sm leading-6 text-ink/65">Confirm the salon or business organization name in Clerk.</p>
          </div>
          <div className="rounded-3xl border border-rosewood/10 bg-white p-5">
            <h3 className="font-black text-ink">2. Marketplace profile</h3>
            <p className="mt-2 text-sm leading-6 text-ink/65">Create the public profile, services, location, and portfolio for the business.</p>
          </div>
          <div className="rounded-3xl border border-rosewood/10 bg-white p-5">
            <h3 className="font-black text-ink">3. Team access</h3>
            <p className="mt-2 text-sm leading-6 text-ink/65">Invite professionals or staff when the team workflow is ready.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/professional/onboarding" className="primary-button">Create marketplace profile</Link>
          <Link to="/account" className="secondary-button">Account settings</Link>
        </div>
      </div>
    </section>
  );
}
