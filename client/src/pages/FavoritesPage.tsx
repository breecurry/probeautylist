import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import type { Favorite } from '@/types';

export function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [error, setError] = useState('');
  async function load() { setFavorites(await apiFetch<Favorite[]>('/api/favorites')); }
  useEffect(() => { void load().catch((err) => setError(err instanceof Error ? err.message : 'Saved professionals failed to load')); }, []);
  async function remove(professionalId: string) { await apiFetch(`/api/favorites/${professionalId}`, { method: 'DELETE' }); await load(); }

  return <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"><h1 className="text-4xl font-black text-ink">Saved professionals</h1><p className="mt-3 text-ink/65">Keep track of professionals you may want to book later.</p>{error && <p className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">{error}</p>}<div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{favorites.map(({ professional }) => <div key={professional.id} className="card overflow-hidden"><div className="h-36 bg-gradient-to-br from-blush to-rosewood/20" style={professional.coverImageUrl ? { backgroundImage: `url(${professional.coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} /><div className="p-6"><p className="text-sm font-bold text-berry">{professional.category}</p><h2 className="mt-2 text-2xl font-black text-ink">{professional.displayName}</h2><p className="mt-2 text-sm leading-6 text-ink/65">{professional.headline}</p><p className="mt-4 text-sm font-bold text-ink/60">{professional.city}, {professional.state}</p><div className="mt-5 flex gap-2"><Link className="primary-button" to={`/pros/${professional.slug}`}>View profile</Link><button className="secondary-button" onClick={() => void remove(professional.id)}>Remove</button></div></div></div>)}{favorites.length === 0 && <div className="card col-span-full p-8 text-center text-ink/60">No saved professionals yet. Search and save professionals you like.</div>}</div></section>;
}
