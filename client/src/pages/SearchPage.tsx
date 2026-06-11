import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { serviceCategories } from '@shared/types';
import { apiFetch } from '@/lib/api';
import type { ProfessionalSummary } from '@/types';

const searchableFields = ['q', 'category', 'city', 'state'] as const;

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [pros, setPros] = useState<ProfessionalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const hasActiveFilters = useMemo(() => searchableFields.some((key) => Boolean(params.get(key))), [params]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');

      try {
        const query = params.toString();
        setPros(await apiFetch<ProfessionalSummary[]>(`/api/professionals${query ? `?${query}` : ''}`));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [params]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = new URLSearchParams();

    for (const key of searchableFields) {
      const value = String(form.get(key) || '').trim();
      if (value) next.set(key, value);
    }

    setParams(next);
  }

  function clearFilters() {
    setParams(new URLSearchParams());
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-ink">Find beauty professionals</h1>
        <p className="mt-3 text-ink/65">Search by service, location, specialty, or name.</p>
      </div>

      <form onSubmit={onSubmit} className="card mb-6 grid gap-4 p-5 md:grid-cols-[1fr_220px_160px_160px_auto]">
        <input className="input" name="q" defaultValue={params.get('q') ?? ''} placeholder="Search style, service, or pro" />
        <select className="input" name="category" defaultValue={params.get('category') ?? ''}>
          <option value="">All categories</option>
          {serviceCategories.map((category) => <option key={category}>{category}</option>)}
        </select>
        <input className="input" name="city" defaultValue={params.get('city') ?? ''} placeholder="City" />
        <input className="input" name="state" defaultValue={params.get('state') ?? ''} placeholder="State" />
        <button className="primary-button" type="submit"><Search size={18} className="mr-2" />Search</button>
      </form>

      <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm font-semibold text-ink/60">
          {loading ? 'Searching approved professionals...' : `${pros.length} approved professional${pros.length === 1 ? '' : 's'} found`}
        </p>
        {hasActiveFilters && <button className="text-sm font-bold text-berry" type="button" onClick={clearFilters}>Clear filters</button>}
      </div>

      {error && <p className="rounded-2xl bg-red-50 p-4 font-semibold text-red-700">{error}</p>}
      {loading ? <p className="text-ink/60">Loading professionals...</p> : <SearchResults pros={pros} />}
    </section>
  );
}

function SearchResults({ pros }: { pros: ProfessionalSummary[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {pros.map((pro) => <ProfessionalCard key={pro.id} pro={pro} />)}
      {pros.length === 0 && <div className="card col-span-full p-8 text-center text-ink/60">No approved professionals match this search yet.</div>}
    </div>
  );
}

function ProfessionalCard({ pro }: { pro: ProfessionalSummary }) {
  return (
    <Link to={`/pros/${pro.slug}`} className="card overflow-hidden transition hover:-translate-y-1">
      <div
        className="h-36 bg-gradient-to-br from-blush to-rosewood/20"
        style={pro.coverImageUrl ? { backgroundImage: `url(${pro.coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      />
      <div className="p-6">
        <p className="text-sm font-bold text-berry">{pro.category}</p>
        <h2 className="mt-2 text-2xl font-black text-ink">{pro.displayName}</h2>
        <p className="mt-2 text-sm leading-6 text-ink/65">{pro.headline}</p>
        <p className="mt-4 text-sm font-bold text-ink/60">{pro.city}, {pro.state}</p>
      </div>
    </Link>
  );
}
