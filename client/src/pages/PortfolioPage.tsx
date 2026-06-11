import { FormEvent, useEffect, useState } from 'react';
import { serviceCategories } from '@shared/types';
import { apiFetch } from '@/lib/api';

type PortfolioItem = {
  id: string;
  imageUrl: string;
  caption: string;
  category: string;
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
    try {
      await apiFetch<PortfolioItem>('/api/portfolio/me', {
        method: 'POST',
        body: JSON.stringify({
          imageUrl: String(form.get('imageUrl')),
          caption: String(form.get('caption')),
          category: String(form.get('category')),
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
      <input className="input" name="imageUrl" type="url" placeholder="Image URL" required />
      <textarea className="input min-h-28" name="caption" placeholder="Caption" required />
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
  return (
    <div className="card overflow-hidden">
      <img src={item.imageUrl} alt={item.caption} className="h-56 w-full object-cover" />
      <div className="p-5">
        <p className="text-xs font-black uppercase tracking-wide text-berry">{item.category}</p>
        <p className="mt-2 leading-6 text-ink/70">{item.caption}</p>
        {!item.isVisible && <p className="mt-3 rounded-full bg-blush px-3 py-1 text-xs font-bold text-rosewood">Hidden from public profile</p>}
        <button className="secondary-button mt-4" onClick={() => onRemove(item.id)} disabled={deleting}>
          {deleting ? 'Removing...' : 'Remove'}
        </button>
      </div>
    </div>
  );
}

function StatusMessage({ message }: { message: string }) {
  return <p className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">{message}</p>;
}
