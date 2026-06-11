import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { AvailabilityException, AvailabilityRule } from '@/types';

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function AvailabilityPage() {
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [error, setError] = useState('');

  async function load() {
    const [loadedRules, loadedExceptions] = await Promise.all([
      apiFetch<AvailabilityRule[]>('/api/availability/me'),
      apiFetch<AvailabilityException[]>('/api/availability/exceptions/me'),
    ]);
    setRules(loadedRules);
    setExceptions(loadedExceptions);
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : 'Availability failed to load'));
  }, []);

  async function addRule(event: FormEvent<HTMLFormElement>) {
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

  async function addException(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const startTime = String(form.get('startTime') || '');
    const endTime = String(form.get('endTime') || '');
    try {
      await apiFetch<AvailabilityException>('/api/availability/exceptions/me', {
        method: 'POST',
        body: JSON.stringify({
          date: String(form.get('date')),
          startTime: startTime || null,
          endTime: endTime || null,
          reason: String(form.get('reason') || ''),
          isBlocked: true,
        }),
      });
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Blocked time could not be saved');
    }
  }

  async function toggle(rule: AvailabilityRule) {
    await apiFetch<AvailabilityRule>(`/api/availability/${rule.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !rule.isActive }),
    });
    await load();
  }

  async function removeException(exception: AvailabilityException) {
    await apiFetch(`/api/availability/exceptions/${exception.id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black text-ink">Availability</h1>
      <p className="mt-3 max-w-3xl leading-7 text-ink/65">Set weekly hours and block vacation days, lunch breaks, sick days, or any time clients should not be able to request online.</p>
      {error && <p className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">{error}</p>}
      <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
        <div className="space-y-6">
          <form onSubmit={addRule} className="card grid gap-4 p-6">
            <h2 className="text-xl font-black text-ink">Weekly hours</h2>
            <label className="label">Day
              <select className="input mt-2" name="weekday" defaultValue="1">
                {weekdays.map((day, index) => <option key={day} value={index}>{day}</option>)}
              </select>
            </label>
            <label className="label">Start time<input className="input mt-2" name="startTime" type="time" required /></label>
            <label className="label">End time<input className="input mt-2" name="endTime" type="time" required /></label>
            <button className="primary-button" type="submit">Add hours</button>
          </form>
          <form onSubmit={addException} className="card grid gap-4 p-6">
            <h2 className="text-xl font-black text-ink">Block time</h2>
            <label className="label">Date<input className="input mt-2" name="date" type="date" required /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="label">Start<input className="input mt-2" name="startTime" type="time" /></label>
              <label className="label">End<input className="input mt-2" name="endTime" type="time" /></label>
            </div>
            <input className="input" name="reason" placeholder="Reason, optional" />
            <p className="text-xs font-semibold text-ink/50">Leave start and end blank to block the entire day.</p>
            <button className="secondary-button" type="submit">Add blocked time</button>
          </form>
        </div>
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-ink">Weekly schedule</h2>
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
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-ink">Blocked dates</h2>
            {exceptions.map((exception) => (
              <div key={exception.id} className="card flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-xl font-black text-ink">{exception.date}</p>
                  <p className="mt-1 text-sm font-semibold text-ink/60">{exception.startTime && exception.endTime ? `${exception.startTime} to ${exception.endTime}` : 'Full day'}{exception.reason ? ` · ${exception.reason}` : ''}</p>
                </div>
                <button className="secondary-button" onClick={() => void removeException(exception)}>Remove</button>
              </div>
            ))}
            {exceptions.length === 0 && <div className="card p-8 text-ink/60">No blocked dates yet.</div>}
          </div>
        </div>
      </div>
    </section>
  );
}
