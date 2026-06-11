import { FormEvent, useEffect, useState } from 'react';
import { serviceCategories } from '@shared/types';
import { apiFetch, formatMoney } from '@/lib/api';
import type { Service } from '@/types';

export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState('');

  async function load() {
    setServices(await apiFetch<Service[]>('/api/services/me'));
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : 'Services failed to load'));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
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
    }
  }

  async function toggleService(service: Service) {
    await apiFetch<Service>(`/api/services/${service.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !service.isActive }),
    });
    await load();
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black text-ink">Services</h1>
      <p className="mt-3 text-ink/65">Add and manage the services clients can request online. Disabled services stay in your records but no longer appear for booking.</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
        <form onSubmit={onSubmit} className="card grid gap-4 p-6">
          <input className="input" name="name" placeholder="Service name" required />
          <textarea className="input min-h-28" name="description" placeholder="Description" required />
          <select className="input" name="category">{serviceCategories.map((item) => <option key={item}>{item}</option>)}</select>
          <input className="input" name="durationMinutes" type="number" min="15" step="15" placeholder="Duration minutes" required />
          <input className="input" name="price" type="number" min="0" step="0.01" placeholder="Price" required />
          <input className="input" name="deposit" type="number" min="0" step="0.01" placeholder="Deposit optional" />
          <button className="primary-button">Add service</button>
          {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        </form>
        <div className="space-y-4">
          {services.map((service) => (
            <div key={service.id} className="card p-5">
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
                  <button className="secondary-button mt-4" onClick={() => void toggleService(service)}>{service.isActive ? 'Disable' : 'Enable'}</button>
                </div>
              </div>
            </div>
          ))}
          {services.length === 0 && <div className="card p-8 text-ink/60">No services yet.</div>}
        </div>
      </div>
    </section>
  );
}
