import { FormEvent, useEffect, useState } from 'react';
import { serviceCategories } from '@shared/types';
import { apiFetch, formatMoney } from '@/lib/api';
import type { Service } from '@/types';

function ErrorNotice({ message }: { message: string }) {
  if (!message) return null;
  return <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p>;
}

function ServiceForm({ error, isSaving, onSubmit }: { error: string; isSaving: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form onSubmit={onSubmit} className="card grid gap-4 p-6">
      <h2 className="text-xl font-black text-ink">Add service</h2>
      <input className="input" name="name" placeholder="Service name" required />
      <textarea className="input min-h-28" name="description" placeholder="Description" required />
      <select className="input" name="category">{serviceCategories.map((item) => <option key={item}>{item}</option>)}</select>
      <input className="input" name="durationMinutes" type="number" min="15" step="15" placeholder="Duration minutes" required />
      <input className="input" name="price" type="number" min="0" step="0.01" placeholder="Price" required />
      <input className="input" name="deposit" type="number" min="0" step="0.01" placeholder="Deposit optional" />
      <button className="primary-button disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSaving}>{isSaving ? 'Saving service...' : 'Add service'}</button>
      <ErrorNotice message={error} />
    </form>
  );
}

function ServiceCard({ service, isSaving, onToggle }: { service: Service; isSaving: boolean; onToggle: (service: Service) => void }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-black text-ink">{service.name}</h2>
            <span className={service.isActive ? 'rounded-full bg-green-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-green-700' : 'rounded-full bg-stone-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-stone-600'}>{service.isActive ? 'Active' : 'Disabled'}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-ink/65">{service.description}</p>
          <p className="mt-2 text-xs font-bold uppercase tracking-wide text-ink/45">{service.durationMinutes} minutes · {service.category}</p>
        </div>
        <div className="text-right">
          <p className="font-black text-berry">{formatMoney(service.priceCents)}</p>
          <button className="secondary-button mt-4 disabled:cursor-not-allowed disabled:opacity-60" onClick={() => onToggle(service)} disabled={isSaving}>{isSaving ? 'Saving...' : service.isActive ? 'Disable' : 'Enable'}</button>
        </div>
      </div>
    </div>
  );
}

function ServicesList({ services, savingId, onToggle }: { services: Service[]; savingId: string; onToggle: (service: Service) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-ink">Current services</h2>
        <p className="mt-1 text-sm text-ink/55">{services.length} service{services.length === 1 ? '' : 's'} saved.</p>
      </div>
      {services.map((service) => <ServiceCard key={service.id} service={service} isSaving={savingId === service.id} onToggle={onToggle} />)}
      {services.length === 0 && <div className="card p-8 text-ink/60">No services yet. Add the services clients can request online.</div>}
    </div>
  );
}

export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [savingAction, setSavingAction] = useState('');

  async function load() {
    setServices(await apiFetch<Service[]>('/api/services/me'));
  }

  useEffect(() => {
    void load()
      .catch((err) => setError(err instanceof Error ? err.message : 'Services failed to load'))
      .finally(() => setIsLoading(false));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSavingAction('add-service');
    const form = new FormData(event.currentTarget);
    try {
      await apiFetch<Service>('/api/services/me', {
        method: 'POST',
        body: JSON.stringify({
          name: String(form.get('name')),
          description: String(form.get('description')),
          category: String(form.get('category')),
          durationMinutes: Number(form.get('durationMinutes')),
          priceCents: Math.round(Number(form.get('price')) * 100),
          depositCents: Math.round(Number(form.get('deposit') || 0) * 100),
          isActive: true,
        }),
      });
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Service could not be saved');
    } finally {
      setSavingAction('');
    }
  }

  async function toggleService(service: Service) {
    setError('');
    setSavingAction(service.id);
    try {
      await apiFetch<Service>(`/api/services/${service.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !service.isActive }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Service could not be updated');
    } finally {
      setSavingAction('');
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black text-ink">Services</h1>
      <p className="mt-3 text-ink/65">Add and manage the services clients can request online. Disabled services stay in your records but no longer appear for booking.</p>
      {isLoading ? (
        <div className="card mt-8 p-8 text-ink/60">Loading services...</div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
          <ServiceForm error={error} isSaving={savingAction === 'add-service'} onSubmit={onSubmit} />
          <ServicesList services={services} savingId={savingAction} onToggle={(service) => void toggleService(service)} />
        </div>
      )}
    </section>
  );
}
