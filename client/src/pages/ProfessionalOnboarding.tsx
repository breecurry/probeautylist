import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ClipboardCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { ProfessionalOnboardingStatus } from '@/types';

const stepCopy: Record<keyof ProfessionalOnboardingStatus['checklist'], { title: string; body: string; href: string; cta: string }> = {
  profile: {
    title: 'Complete public profile basics',
    body: 'Add a clear headline, bio, category, specialty list, images, and license label so clients and reviewers understand your work.',
    href: '/professional/profile',
    cta: 'Edit profile',
  },
  services: {
    title: 'Publish bookable services',
    body: 'Create at least one active service with pricing, duration, deposits, and client-facing descriptions.',
    href: '/professional/services',
    cta: 'Manage services',
  },
  availability: {
    title: 'Set booking policies and availability',
    body: 'Configure booking terms, reminder expectations, blocked times, and schedule guidance before clients request appointments.',
    href: '/professional/availability',
    cta: 'Set availability',
  },
  portfolio: {
    title: 'Add portfolio proof',
    body: 'Upload portfolio examples, before-and-after images, service tags, and transformation notes to build client confidence.',
    href: '/professional/portfolio',
    cta: 'Add portfolio',
  },
  review: {
    title: 'Submit for quality review',
    body: 'Once your profile is strong enough, an admin can approve it for public discovery and booking.',
    href: '/professional/profile',
    cta: 'Review status',
  },
};

export function ProfessionalOnboarding() {
  const [status, setStatus] = useState<ProfessionalOnboardingStatus | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void apiFetch<ProfessionalOnboardingStatus>('/api/professionals/me/onboarding')
      .then(setStatus)
      .catch((err) => setError(err instanceof Error ? err.message : 'Onboarding status failed to load'));
  }, []);

  if (error) return <section className="mx-auto max-w-5xl px-6 py-12"><div className="card p-6 text-red-700">{error}</div></section>;
  if (!status) return <section className="mx-auto max-w-5xl px-6 py-12 text-ink/60">Loading onboarding checklist…</section>;

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="card p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="inline-flex items-center rounded-full bg-blush px-3 py-1 text-sm font-black text-rosewood"><ClipboardCheck size={16} className="mr-2" />Professional onboarding</p>
            <h1 className="mt-4 text-4xl font-black text-ink">Get discoverable without missing trust requirements</h1>
            <p className="mt-3 max-w-2xl text-ink/65">This checklist keeps profile quality, services, availability, portfolio proof, and approval status in one place so you can prepare for client bookings safely.</p>
          </div>
          <div className="rounded-3xl bg-cream p-5 text-center">
            <p className="text-sm font-bold text-ink/55">Completion</p>
            <p className="text-4xl font-black text-berry">{status.completionPercent}%</p>
            <p className="text-xs font-bold text-ink/45">Next: {status.nextStep.replaceAll('_', ' ')}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4">
        {(Object.keys(status.checklist) as Array<keyof ProfessionalOnboardingStatus['checklist']>).map((key) => {
          const complete = status.checklist[key];
          const copy = stepCopy[key];
          return (
            <article key={key} className="card flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center">
              <div className="flex gap-4">
                {complete ? <CheckCircle2 className="mt-1 text-emerald-600" /> : <Circle className="mt-1 text-ink/30" />}
                <div>
                  <h2 className="text-xl font-black text-ink">{copy.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-ink/65">{copy.body}</p>
                </div>
              </div>
              <Link className={complete ? 'secondary-button whitespace-nowrap' : 'primary-button whitespace-nowrap'} to={copy.href}>{copy.cta}</Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
