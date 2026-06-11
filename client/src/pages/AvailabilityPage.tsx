import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type AvailabilityRule = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function AvailabilityPage() {
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [error, setError] = useState('');

  async function load() {
    setRules(await apiFetch<AvailabilityRule[]>('/api/availability/me'));
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : 'Availability failed to load'));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      await apiFetch<AvailabilityRule>('/api/availability/me', {
        method: 'POST',
        body: JSON.stringify({
          weekday: Number(form.get('weekday')),
          startTime: String(form.get('startTime')),
          endTime: String(form.get('endTime')),
          isActive: true,
        }),
      });
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Availability could not be saved');
    }
  }

  async function toggle(rule: AvailabilityRule) {
    await apiFetch<AvailabilityRule>(`/api/availability/${rule.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !rule.isActive }),
    });
    await load();
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black text-ink">Availability</h1>
      <p className="mt-3 max-w-3xl leading-7 text-ink/65">Set the weekly hours clients can request online. Existing pending or confirmed bookings also block overlapping requests, so clients cannot stack appointments into the same time slot.</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
        <form onSubmit={onSubmit} className="card grid gap-4 p-6">
          <label className="label">Day
            <select className="input mt-2" name="weekday" defaultValue="1">
              {weekdays.map((day, index) => <option key={day} value={index}>{day}</option>)}
            </select>
          </label>
          <label className="label">Start time<input className="input mt-2" name="startTime" type="time" required /></label>
          <label className="label">End time<input className="input mt-2" name="endTime" type="time" required /></label>
          <button className="primary-button" type="submit">Add hours</button>
          {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        </form>
        <div className="space-y-4">
          {rules.map((rule) => (
            <div key={rule.id} className="card flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-xl font-black text-ink">{weekdays[rule.weekday]}</p>
                <p className="mt-1 text-sm font-semibold text-ink/60">{rule.startTime} to {rule.endTime}</p>
              </div>
              <button className={rule.isActive ? 'secondary-button' : 'primary-button'} onClick={() => void toggle(rule)}>{rule.isActive ? 'Disable' : 'Enable'}</button>
            </div>
          ))}
          {rules.length === 0 && <div className="card p-8 text-ink/60">No availability rules yet. Add the days and times clients can request.</div>}
        </div>
      </div>
    </section>
  );
}
