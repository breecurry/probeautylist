import { FormEvent, useEffect, useState } from 'react';

import { apiFetch } from '@/lib/api';
import { formText, optionalFormText, parseMoneyToCents } from '@/lib/forms';
import type { BookingPolicy, CalendarConnection } from '@/types';

const defaultPolicy: BookingPolicy = {
  professionalId: '',
  cancellationWindowHours: 24,
  cancellationFeeCents: 0,
  depositRequired: true,
  remindersEnabled: true,
  reminderHoursBefore: 24,
  policySummary: 'Deposits may be required to hold appointments. Cancellation rules are shown before booking.',
};

export function ProfessionalOperations() {
  const [policy, setPolicy] = useState<BookingPolicy>(defaultPolicy);
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [savingCalendar, setSavingCalendar] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [policyData, connectionData] = await Promise.all([
        apiFetch<BookingPolicy>('/api/professionals/me/booking-policy'),
        apiFetch<CalendarConnection[]>('/api/professionals/me/calendar-connections'),
      ]);
      setPolicy({ ...defaultPolicy, ...policyData });
      setConnections(connectionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operational settings failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function savePolicy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingPolicy) return;
    setMessage('');
    setError('');
    setSavingPolicy(true);
    const form = new FormData(event.currentTarget);
    try {
      const saved = await apiFetch<BookingPolicy>('/api/professionals/me/booking-policy', {
        method: 'PUT',
        body: JSON.stringify({
          cancellationWindowHours: Number(form.get('cancellationWindowHours') || 0),
          cancellationFeeCents: parseMoneyToCents(form.get('cancellationFee')),
          depositRequired: form.get('depositRequired') === 'on',
          remindersEnabled: form.get('remindersEnabled') === 'on',
          reminderHoursBefore: Number(form.get('reminderHoursBefore') || 24),
          policySummary: formText(form, 'policySummary'),
        }),
      });
      setPolicy(saved);
      setMessage('Booking policy saved. Clients will see these rules before booking.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking policy could not be saved');
    } finally {
      setSavingPolicy(false);
    }
  }

  async function saveCalendar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingCalendar) return;
    setMessage('');
    setError('');
    setSavingCalendar(true);
    const form = new FormData(event.currentTarget);
    try {
      const saved = await apiFetch<CalendarConnection>('/api/professionals/me/calendar-connections', {
        method: 'PUT',
        body: JSON.stringify({
          provider: formText(form, 'provider'),
          externalCalendarId: optionalFormText(form, 'externalCalendarId'),
          status: formText(form, 'status'),
          syncDirection: formText(form, 'syncDirection'),
          notes: optionalFormText(form, 'notes'),
        }),
      });
      setConnections((current) => [saved, ...current.filter((item) => item.provider !== saved.provider)]);
      setMessage('Calendar sync preference saved. Provider credentials can be connected when live integration keys are configured.');
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calendar connection could not be saved');
    } finally {
      setSavingCalendar(false);
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-gold">Operations</p>
        <h1 className="mt-2 text-4xl font-black text-ink">Booking policies and calendar sync</h1>
        <p className="mt-3 max-w-3xl text-ink/65">Control deposit expectations, cancellation rules, reminders, and provider-ready calendar preferences from one professional operations hub.</p>
      </div>
      {loading ? <p className="card p-5 font-semibold text-ink/65">Loading operational settings…</p> : (
        <div className="grid gap-6">
          <form onSubmit={savePolicy} className="card grid gap-5 p-6">
            <h2 className="text-2xl font-black text-ink">Booking policy</h2>
            <label className="label">Client-facing policy summary<textarea className="input mt-2 min-h-28" name="policySummary" defaultValue={policy.policySummary} minLength={20} maxLength={1000} required /></label>
            <div className="grid gap-4 md:grid-cols-3">
              <Field name="cancellationWindowHours" label="Cancellation window hours" type="number" defaultValue={String(policy.cancellationWindowHours)} min="0" max="720" />
              <Field name="cancellationFee" label="Cancellation fee" type="number" defaultValue={(policy.cancellationFeeCents / 100).toFixed(2)} min="0" step="0.01" />
              <Field name="reminderHoursBefore" label="Reminder hours before" type="number" defaultValue={String(policy.reminderHoursBefore)} min="1" max="336" />
            </div>
            <div className="flex flex-wrap gap-4 text-sm font-bold text-ink/70">
              <label className="inline-flex items-center gap-2"><input name="depositRequired" type="checkbox" defaultChecked={policy.depositRequired} /> Require listed deposits when services define them</label>
              <label className="inline-flex items-center gap-2"><input name="remindersEnabled" type="checkbox" defaultChecked={policy.remindersEnabled} /> Schedule booking reminders</label>
            </div>
            <button className="primary-button w-fit" type="submit" disabled={savingPolicy}>{savingPolicy ? 'Saving...' : 'Save booking policy'}</button>
          </form>

          <form onSubmit={saveCalendar} className="card grid gap-5 p-6">
            <h2 className="text-2xl font-black text-ink">Calendar connection</h2>
            <p className="text-sm text-ink/60">This stores provider-ready sync preferences now. OAuth credentials and provider webhooks can be enabled without changing booking data later.</p>
            <div className="grid gap-4 md:grid-cols-4">
              <Field name="provider" label="Provider" defaultValue="google" />
              <Field name="externalCalendarId" label="Calendar ID" required={false} />
              <label className="label">Status<select className="input mt-2" name="status" defaultValue="not_connected"><option value="not_connected">Not connected</option><option value="connected">Connected</option><option value="paused">Paused</option><option value="error">Error</option></select></label>
              <label className="label">Sync direction<select className="input mt-2" name="syncDirection" defaultValue="export_only"><option value="export_only">Export only</option><option value="import_only">Import only</option><option value="two_way">Two-way</option></select></label>
            </div>
            <label className="label">Notes<input className="input mt-2" name="notes" maxLength={1000} /></label>
            <button className="secondary-button w-fit" type="submit" disabled={savingCalendar}>{savingCalendar ? 'Saving...' : 'Save calendar preference'}</button>
          </form>

          <section className="card p-6">
            <h2 className="text-2xl font-black text-ink">Saved calendar preferences</h2>
            {connections.length === 0 ? <p className="mt-3 text-sm text-ink/60">No calendar preferences saved yet.</p> : (
              <div className="mt-4 grid gap-3">
                {connections.map((connection) => <div key={connection.id} className="rounded-2xl bg-cream p-4 text-sm text-ink/70"><span className="font-black text-ink">{connection.provider}</span> · {connection.status.replaceAll('_', ' ')} · {connection.syncDirection.replaceAll('_', ' ')}</div>)}
              </div>
            )}
          </section>
          {(message || error) && <p className={`rounded-2xl p-4 text-sm font-semibold ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{error || message}</p>}
        </div>
      )}
    </section>
  );
}

function Field({ name, label, defaultValue = '', type = 'text', required = true, min, max, step }: { name: string; label: string; defaultValue?: string; type?: string; required?: boolean; min?: string; max?: string; step?: string }) {
  return <label className="label">{label}<input className="input mt-2" name={name} type={type} defaultValue={defaultValue} required={required} min={min} max={max} step={step} /></label>;
}
