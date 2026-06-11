import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { formText, isTimeRange, optionalFormText } from '@/lib/forms';
import type { AvailabilityException, AvailabilityRule } from '@/types';

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type AvailabilityState = {
  rules: AvailabilityRule[];
  exceptions: AvailabilityException[];
};

function ErrorNotice({ message }: { message: string }) {
  if (!message) return null;
  return <p className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">{message}</p>;
}

function WeeklyHoursForm({ onSubmit, isSaving }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; isSaving: boolean }) {
  return (
    <form onSubmit={onSubmit} className="card grid gap-4 p-6">
      <h2 className="text-xl font-black text-ink">Weekly hours</h2>
      <label className="label">Day
        <select className="input mt-2" name="weekday" defaultValue="1">
          {weekdays.map((day, index) => <option key={day} value={index}>{day}</option>)}
        </select>
      </label>
      <label className="label">Start time<input className="input mt-2" name="startTime" type="time" required /></label>
      <label className="label">End time<input className="input mt-2" name="endTime" type="time" required /></label>
      <button className="primary-button disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSaving}>{isSaving ? 'Saving hours...' : 'Add hours'}</button>
    </form>
  );
}

function BlockedTimeForm({ onSubmit, isSaving }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; isSaving: boolean }) {
  return (
    <form onSubmit={onSubmit} className="card grid gap-4 p-6">
      <h2 className="text-xl font-black text-ink">Block time</h2>
      <label className="label">Date<input className="input mt-2" name="date" type="date" required /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="label">Start<input className="input mt-2" name="startTime" type="time" /></label>
        <label className="label">End<input className="input mt-2" name="endTime" type="time" /></label>
      </div>
      <label className="label">Reason optional<input className="input mt-2" name="reason" maxLength={120} /></label>
      <p className="text-xs font-semibold text-ink/50">Leave start and end blank to block the entire day.</p>
      <button className="secondary-button disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSaving}>{isSaving ? 'Saving block...' : 'Add blocked time'}</button>
    </form>
  );
}

function WeeklySchedule({ rules, actionId, onToggle }: { rules: AvailabilityRule[]; actionId: string; onToggle: (rule: AvailabilityRule) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black text-ink">Weekly schedule</h2>
      {rules.map((rule) => {
        const isWorking = actionId === rule.id;
        return (
          <div key={rule.id} className="card flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xl font-black text-ink">{weekdays[rule.weekday]}</p>
              <p className="mt-1 text-sm font-semibold text-ink/60">{rule.startTime} to {rule.endTime}</p>
            </div>
            <button className={`${rule.isActive ? 'secondary-button' : 'primary-button'} disabled:cursor-not-allowed disabled:opacity-60`} type="button" onClick={() => onToggle(rule)} disabled={isWorking}>
              {isWorking ? 'Saving...' : rule.isActive ? 'Disable' : 'Enable'}
            </button>
          </div>
        );
      })}
      {rules.length === 0 && <div className="card p-8 text-ink/60">No availability rules yet. Add the days and times clients can request.</div>}
    </div>
  );
}

function BlockedDates({ exceptions, actionId, onRemove }: { exceptions: AvailabilityException[]; actionId: string; onRemove: (exception: AvailabilityException) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black text-ink">Blocked dates</h2>
      {exceptions.map((exception) => {
        const isWorking = actionId === exception.id;
        return (
          <div key={exception.id} className="card flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xl font-black text-ink">{exception.date}</p>
              <p className="mt-1 text-sm font-semibold text-ink/60">{exception.startTime && exception.endTime ? `${exception.startTime} to ${exception.endTime}` : 'Full day'}{exception.reason ? ` · ${exception.reason}` : ''}</p>
            </div>
            <button className="secondary-button disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={() => onRemove(exception)} disabled={isWorking}>{isWorking ? 'Removing...' : 'Remove'}</button>
          </div>
        );
      })}
      {exceptions.length === 0 && <div className="card p-8 text-ink/60">No blocked dates yet.</div>}
    </div>
  );
}

export function AvailabilityPage() {
  const [state, setState] = useState<AvailabilityState>({ rules: [], exceptions: [] });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [savingAction, setSavingAction] = useState('');

  async function load() {
    const [loadedRules, loadedExceptions] = await Promise.all([
      apiFetch<AvailabilityRule[]>('/api/availability/me'),
      apiFetch<AvailabilityException[]>('/api/availability/exceptions/me'),
    ]);
    setState({ rules: loadedRules, exceptions: loadedExceptions });
  }

  useEffect(() => {
    void load()
      .catch((err) => setError(err instanceof Error ? err.message : 'Availability failed to load'))
      .finally(() => setIsLoading(false));
  }, []);

  async function addRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSavingAction('add-rule');
    const form = new FormData(event.currentTarget);
    const startTime = formText(form, 'startTime');
    const endTime = formText(form, 'endTime');

    if (!isTimeRange(startTime, endTime)) {
      setError('Weekly hours need a valid start time before the end time.');
      setSavingAction('');
      return;
    }

    try {
      await apiFetch<AvailabilityRule>('/api/availability/me', {
        method: 'POST',
        body: JSON.stringify({
          weekday: Number(form.get('weekday')),
          startTime,
          endTime,
          isActive: true,
        }),
      });
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Availability could not be saved');
    } finally {
      setSavingAction('');
    }
  }

  async function addException(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSavingAction('add-exception');
    const form = new FormData(event.currentTarget);
    const startTime = optionalFormText(form, 'startTime');
    const endTime = optionalFormText(form, 'endTime');

    if ((startTime || endTime) && !isTimeRange(startTime, endTime)) {
      setError('Blocked time needs both a start and end time, with start before end.');
      setSavingAction('');
      return;
    }

    try {
      await apiFetch<AvailabilityException>('/api/availability/exceptions/me', {
        method: 'POST',
        body: JSON.stringify({
          date: formText(form, 'date'),
          startTime: startTime || null,
          endTime: endTime || null,
          reason: optionalFormText(form, 'reason'),
          isBlocked: true,
        }),
      });
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Blocked time could not be saved');
    } finally {
      setSavingAction('');
    }
  }

  async function toggle(rule: AvailabilityRule) {
    setError('');
    setSavingAction(rule.id);
    try {
      await apiFetch<AvailabilityRule>(`/api/availability/${rule.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Availability could not be updated');
    } finally {
      setSavingAction('');
    }
  }

  async function removeException(exception: AvailabilityException) {
    setError('');
    setSavingAction(exception.id);
    try {
      await apiFetch(`/api/availability/exceptions/${exception.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Blocked time could not be removed');
    } finally {
      setSavingAction('');
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black text-ink">Availability</h1>
      <p className="mt-3 max-w-3xl leading-7 text-ink/65">Set weekly hours and block vacation days, lunch breaks, sick days, or any time clients should not be able to request online.</p>
      <ErrorNotice message={error} />
      {isLoading ? (
        <div className="card mt-8 p-8 text-ink/60">Loading availability...</div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
          <div className="space-y-6">
            <WeeklyHoursForm onSubmit={addRule} isSaving={savingAction === 'add-rule'} />
            <BlockedTimeForm onSubmit={addException} isSaving={savingAction === 'add-exception'} />
          </div>
          <div className="space-y-8">
            <WeeklySchedule rules={state.rules} actionId={savingAction} onToggle={(rule) => void toggle(rule)} />
            <BlockedDates exceptions={state.exceptions} actionId={savingAction} onRemove={(exception) => void removeException(exception)} />
          </div>
        </div>
      )}
    </section>
  );
}
