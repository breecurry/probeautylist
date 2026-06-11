import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ShieldCheck, Star } from 'lucide-react';
import { serviceCategories } from '@shared/types';
import { apiFetch, formatMoney } from '@/lib/api';
import { safeBackgroundImageStyle } from '@/lib/safety';
import type { ProfessionalSummary } from '@/types';

const searchableFields = ['q', 'category', 'city', 'state', 'specialty', 'minRating', 'maxPriceCents', 'verified', 'hasPortfolio', 'sort'] as const;

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [pros, setPros] = useState<ProfessionalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const hasActiveFilters = useMemo(() => searchableFields.some((key) => Boolean(params.get(key))), [params]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError('');

      try {
        const query = params.toString();
        setPros(await apiFetch<ProfessionalSummary[]>(`/api/professionals${query ? `?${query}` : ''}`, { signal: controller.signal }));
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [params]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = new URLSearchParams();

    for (const key of searchableFields) {
      const value = String(form.get(key) || '').trim();
      if (value && value !== 'false') next.set(key, value);
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
        <p className="mt-3 text-ink/65">Search by service, location, specialty, trust signals, price, or verified status.</p>
      </div>

      <form onSubmit={onSubmit} className="card mb-6 grid gap-4 p-5 lg:grid-cols-[1fr_220px_150px_150px]">
        <input className="input" name="q" defaultValue={params.get('q') ?? ''} placeholder="Search style, service, or pro" />
        <select className="input" name="category" defaultValue={params.get('category') ?? ''}>
          <option value="">All categories</option>
          {serviceCategories.map((category) => <option key={category}>{category}</option>)}
        </select>
        <input className="input" name="city" defaultValue={params.get('city') ?? ''} placeholder="City" />
        <input className="input" name="state" defaultValue={params.get('state') ?? ''} placeholder="State" />
        <input className="input" name="specialty" defaultValue={params.get('specialty') ?? ''} placeholder="Specialty" />
        <select className="input" name="minRating" defaultValue={params.get('minRating') ?? ''}>
          <option value="">Any rating</option>
          <option value="5">5 stars</option>
          <option value="4">4+ stars</option>
          <option value="3">3+ stars</option>
        </select>
        <select className="input" name="maxPriceCents" defaultValue={params.get('maxPriceCents') ?? ''}>
          <option value="">Any starting price</option>
          <option value="5000">Up to $50</option>
          <option value="10000">Up to $100</option>
          <option value="20000">Up to $200</option>
        </select>
        <select className="input" name="sort" defaultValue={params.get('sort') ?? 'recommended'}>
          <option value="recommended">Recommended</option>
          <option value="rating">Highest rated</option>
          <option value="price_low">Lowest starting price</option>
          <option value="newest">Recently approved</option>
        </select>
        <label className="flex items-center gap-2 rounded-2xl bg-cream px-4 py-3 text-sm font-bold text-ink/70">
          <input name="verified" type="checkbox" value="true" defaultChecked={params.get('verified') === 'true'} />
          Verified only
        </label>
        <label className="flex items-center gap-2 rounded-2xl bg-cream px-4 py-3 text-sm font-bold text-ink/70">
          <input name="hasPortfolio" type="checkbox" value="true" defaultChecked={params.get('hasPortfolio') === 'true'} />
          Has portfolio
        </label>
        <button className="primary-button lg:col-span-2" type="submit"><Search size={18} className="mr-2" />Search</button>
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
        style={safeBackgroundImageStyle(pro.coverImageUrl)}
      />
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-bold text-berry">{pro.category}</p>
          {pro.isVerified && <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700"><ShieldCheck size={14} className="mr-1" />Verified</span>}
        </div>
        <h2 className="mt-2 text-2xl font-black text-ink">{pro.displayName}</h2>
        <p className="mt-2 text-sm leading-6 text-ink/65">{pro.headline}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-ink/60">
          <span className="rounded-full bg-cream px-3 py-1">{pro.city}, {pro.state}</span>
          {pro.averageRating && <span className="inline-flex items-center rounded-full bg-cream px-3 py-1"><Star size={13} fill="currentColor" className="mr-1 text-gold" />{pro.averageRating.toFixed(1)} ({pro.reviewCount ?? 0})</span>}
          {pro.startingPriceCents !== undefined && pro.startingPriceCents !== null && <span className="rounded-full bg-cream px-3 py-1">From {formatMoney(pro.startingPriceCents)}</span>}
          {pro.portfolioCount !== undefined && <span className="rounded-full bg-cream px-3 py-1">{pro.portfolioCount} portfolio</span>}
        </div>
        <p className="mt-4 text-xs font-bold text-ink/45">Trust score: {pro.trustScore ?? 0}/100</p>
      </div>
    </Link>
  );
}
