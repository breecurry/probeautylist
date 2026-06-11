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

  async function load() {
    setItems(await apiFetch<PortfolioItem[]>('/api/portfolio/me'));
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : 'Portfolio failed to load'));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
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
    }
  }

  async function remove(id: string) {
    await apiFetch(`/api/portfolio/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black text-ink">Portfolio</h1>
      <p className="mt-3 max-w-3xl leading-7 text-ink/65">Show clients recent work from your chair, treatment room, studio, or shop. Use image URLs from your own hosting or CDN so the project remains fully under your control.</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
        <form onSubmit={onSubmit} className="card grid gap-4 p-6">
          <input className="input" name="imageUrl" type="url" placeholder="Image URL" required />
          <textarea className="input min-h-28" name="caption" placeholder="Caption" required />
          <select className="input" name="category">{serviceCategories.map((item) => <option key={item}>{item}</option>)}</select>
          <button className="primary-button">Add portfolio item</button>
          {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        </form>
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="card overflow-hidden">
              <img src={item.imageUrl} alt={item.caption} className="h-56 w-full object-cover" />
              <div className="p-5">
                <p className="text-xs font-black uppercase tracking-wide text-berry">{item.category}</p>
                <p className="mt-2 leading-6 text-ink/70">{item.caption}</p>
                <button className="secondary-button mt-4" onClick={() => void remove(item.id)}>Remove</button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="card p-8 text-ink/60 sm:col-span-2">No portfolio items yet.</div>}
        </div>
      </div>
    </section>
  );
}
