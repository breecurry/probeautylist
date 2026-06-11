import { FormEvent, useEffect, useState } from 'react';
import { serviceCategories } from '@shared/types';
import { apiFetch } from '@/lib/api';
import { safeImageUrl } from '@/lib/safety';

type PortfolioItem = {
  id: string;
  imageUrl: string;
  beforeImageUrl?: string | null;
  afterImageUrl?: string | null;
  caption: string;
  category: string;
  serviceTags?: string[];
  transformationNotes?: string | null;
  isVisible: boolean;
};

export function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    const rows = await apiFetch<PortfolioItem[]>('/api/portfolio/me');
    setItems(rows);
  }

  useEffect(() => {
    void load()
      .catch((err) => setError(err instanceof Error ? err.message : 'Portfolio failed to load'))
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setError('');
    setSaving(true);

    const form = new FormData(event.currentTarget);
    const imageUrl = String(form.get('imageUrl') || '').trim();
    const beforeImageUrl = String(form.get('beforeImageUrl') || '').trim();
    const afterImageUrl = String(form.get('afterImageUrl') || '').trim();
    const caption = String(form.get('caption') || '').trim();
    const category = String(form.get('category') || '').trim();
    const serviceTags = String(form.get('serviceTags') || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    const transformationNotes = String(form.get('transformationNotes') || '').trim();

    if (!safeImageUrl(imageUrl) || (beforeImageUrl && !safeImageUrl(beforeImageUrl)) || (afterImageUrl && !safeImageUrl(afterImageUrl))) {
      setError('Use valid HTTPS image URLs.');
      setSaving(false);
      return;
    }
    if (caption.length > 500 || transformationNotes.length > 1000) {
      setError('Captions must be 500 characters or fewer and notes must be 1,000 characters or fewer.');
      setSaving(false);
      return;
    }

    try {
      await apiFetch<PortfolioItem>('/api/portfolio/me', {
        method: 'POST',
        body: JSON.stringify({
          imageUrl,
          beforeImageUrl,
          afterImageUrl,
          caption,
          category,
          serviceTags,
          transformationNotes,
          isVisible: true,
          sortOrder: 0,
        }),
      });
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Portfolio item could not be saved');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (deletingId) return;

    setError('');
    setDeletingId(id);

    try {
      await apiFetch(`/api/portfolio/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Portfolio item could not be removed');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <PortfolioHeader />
      {error && <StatusMessage message={error} />}
      <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
        <PortfolioForm onSubmit={onSubmit} saving={saving} />
        <PortfolioGrid items={items} loading={loading} deletingId={deletingId} onRemove={remove} />
      </div>
    </section>
  );
}

function PortfolioHeader() {
  return (
    <div>
      <h1 className="text-4xl font-black text-ink">Portfolio</h1>
      <p className="mt-3 max-w-3xl leading-7 text-ink/65">
        Show clients recent work from your chair, treatment room, studio, or shop. Use image URLs from your own hosting or CDN so the project remains fully under your control.
      </p>
    </div>
  );
}

function PortfolioForm({ onSubmit, saving }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; saving: boolean }) {
  return (
    <form onSubmit={onSubmit} className="card grid h-fit gap-4 p-6">
      <h2 className="text-2xl font-black text-ink">Add work</h2>
      <input className="input" name="imageUrl" type="url" placeholder="Primary image URL" required />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="input" name="beforeImageUrl" type="url" placeholder="Before image URL optional" />
        <input className="input" name="afterImageUrl" type="url" placeholder="After image URL optional" />
      </div>
      <textarea className="input min-h-28" name="caption" placeholder="Caption" maxLength={500} />
      <input className="input" name="serviceTags" placeholder="Service tags, comma-separated" maxLength={500} />
      <textarea className="input min-h-24" name="transformationNotes" placeholder="Transformation notes optional" maxLength={1000} />
      <select className="input" name="category">
        {serviceCategories.map((item) => <option key={item}>{item}</option>)}
      </select>
      <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Adding...' : 'Add portfolio item'}</button>
    </form>
  );
}

function PortfolioGrid({ items, loading, deletingId, onRemove }: { items: PortfolioItem[]; loading: boolean; deletingId: string | null; onRemove: (id: string) => void }) {
  if (loading) return <div className="card p-8 text-ink/60">Loading portfolio items...</div>;

  if (items.length === 0) return <div className="card p-8 text-ink/60">No portfolio items yet.</div>;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <PortfolioCard key={item.id} item={item} deleting={deletingId === item.id} onRemove={onRemove} />
      ))}
    </div>
  );
}

function PortfolioCard({ item, deleting, onRemove }: { item: PortfolioItem; deleting: boolean; onRemove: (id: string) => void }) {
  const imageUrl = safeImageUrl(item.imageUrl);

  return (
    <div className="card overflow-hidden">
      {imageUrl ? <img src={imageUrl} alt={item.caption} className="h-56 w-full object-cover" /> : <div className="h-56 bg-gradient-to-r from-rosewood to-berry" />}
      <div className="p-5">
        <p className="text-xs font-black uppercase tracking-wide text-berry">{item.category}</p>
        <p className="mt-2 leading-6 text-ink/70">{item.caption || 'Portfolio item'}</p>
        {item.transformationNotes && <p className="mt-2 text-sm leading-6 text-ink/55">{item.transformationNotes}</p>}
        {item.serviceTags && item.serviceTags.length > 0 && <p className="mt-3 flex flex-wrap gap-2">{item.serviceTags.map((tag) => <span key={tag} className="rounded-full bg-blush px-2 py-1 text-xs font-bold text-rosewood">{tag}</span>)}</p>}
        {item.beforeImageUrl && item.afterImageUrl && <p className="mt-3 text-xs font-bold text-ink/45">Before-and-after pair attached</p>}
        {!item.isVisible && <p className="mt-3 rounded-full bg-blush px-3 py-1 text-xs font-bold text-rosewood">Hidden from public profile</p>}
        <button className="secondary-button mt-4" type="button" onClick={() => onRemove(item.id)} disabled={deleting}>
          {deleting ? 'Removing...' : 'Remove'}
        </button>
      </div>
    </div>
  );
}

function StatusMessage({ message }: { message: string }) {
  return <p className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">{message}</p>;
}
