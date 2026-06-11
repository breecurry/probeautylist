import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { serviceCategories } from '@shared/types';
import { apiFetch, formatMoney } from '@/lib/api';
import type { ProfessionalSummary, SavedSearch } from '@/types';

function buildSearchLink(search: SavedSearch) {
  const params = new URLSearchParams();
  if (search.query) params.set('q', search.query);
  if (search.category) params.set('category', search.category);
  if (search.city) params.set('city', search.city);
  if (search.state) params.set('state', search.state);
  if (search.maxPriceCents) params.set('maxPrice', String(Math.round(search.maxPriceCents / 100)));
  return `/search?${params.toString()}`;
}

export function SavedSearchesPage() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [recommendations, setRecommendations] = useState<ProfessionalSummary[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  async function load() {
    const [searches, recs] = await Promise.all([
      apiFetch<SavedSearch[]>('/api/discovery/saved-searches'),
      apiFetch<ProfessionalSummary[]>('/api/discovery/recommendations?limit=6'),
    ]);
    setSavedSearches(searches);
    setRecommendations(recs);
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : 'Saved searches failed to load')).finally(() => setIsLoading(false));
  }, []);

  async function createSavedSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      await apiFetch('/api/discovery/saved-searches', {
        method: 'POST',
        body: JSON.stringify({
          name: String(form.get('name') ?? ''),
          query: String(form.get('query') ?? ''),
          category: String(form.get('category') ?? ''),
          city: String(form.get('city') ?? ''),
          state: String(form.get('state') ?? ''),
          maxPriceCents: form.get('maxPrice') ? Number(form.get('maxPrice')) * 100 : null,
          notifyOnNewMatches: form.get('notifyOnNewMatches') === 'on',
        }),
      });
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Saved search could not be created');
    }
  }

  async function removeSavedSearch(id: string) {
    setBusyId(id);
    setError('');
    try {
      await apiFetch(`/api/discovery/saved-searches/${id}`, { method: 'DELETE' });
      setSavedSearches((current) => current.filter((search) => search.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Saved search could not be removed');
    } finally {
      setBusyId('');
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <p className="eyebrow">Client discovery</p>
      <h1 className="text-4xl font-black text-ink">Saved searches and recommendations</h1>
      <p className="mt-3 max-w-3xl text-ink/70">Save discovery criteria for repeat searches and review recommendation cards based on your saved professionals, bookings, and preferred categories.</p>
      {error && <p className="mt-6 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}

      {isLoading ? <div className="card mt-8 p-8 text-ink/60">Loading saved discovery tools...</div> : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <form className="card space-y-4 p-6" onSubmit={createSavedSearch}>
            <h2 className="text-2xl font-black text-ink">Create a saved search</h2>
            <input className="input" name="name" placeholder="Name this search" required />
            <input className="input" name="query" placeholder="Keyword, specialty, or style" />
            <select className="input" name="category">
              <option value="">Any category</option>
              {serviceCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <div className="grid gap-3 sm:grid-cols-3">
              <input className="input" name="city" placeholder="City" />
              <input className="input" name="state" placeholder="State" />
              <input className="input" name="maxPrice" min="0" placeholder="Max price" type="number" />
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-ink/70"><input defaultChecked name="notifyOnNewMatches" type="checkbox" /> Notify me about new matches</label>
            <button className="primary-button" type="submit">Save search</button>
          </form>

          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-2xl font-black text-ink">Your saved searches</h2>
              <div className="mt-5 space-y-3">
                {savedSearches.length === 0 && <p className="text-ink/60">No saved searches yet. Create one from the form.</p>}
                {savedSearches.map((search) => (
                  <div className="rounded-2xl border border-rosewood/10 bg-white p-4" key={search.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-ink">{search.name}</p>
                        <p className="text-sm text-ink/60">{[search.query, search.category, search.city, search.state].filter(Boolean).join(' · ') || 'All approved professionals'}{search.maxPriceCents ? ` · up to ${formatMoney(search.maxPriceCents)}` : ''}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link className="secondary-button px-4 py-2 text-xs" to={buildSearchLink(search)}>Run search</Link>
                        <button className="rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-red-700 disabled:opacity-60" disabled={busyId === search.id} onClick={() => void removeSavedSearch(search.id)}>{busyId === search.id ? 'Removing...' : 'Remove'}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-2xl font-black text-ink">Recommended professionals</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {recommendations.length === 0 && <p className="text-ink/60">Recommendations will appear as you save searches, favorite professionals, and book services.</p>}
                {recommendations.map((profile) => (
                  <Link className="rounded-2xl border border-rosewood/10 bg-blush/40 p-4 transition hover:-translate-y-0.5" key={profile.id} to={`/pros/${profile.slug}`}>
                    <p className="font-black text-ink">{profile.displayName}</p>
                    <p className="text-sm text-ink/60">{profile.category} · {profile.city}, {profile.state}</p>
                    <p className="mt-2 text-sm text-ink/70">Trust score {profile.trustScore ?? 0}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
