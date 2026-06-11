import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { safeBackgroundImageStyle } from '@/lib/safety';
import type { Favorite, ProfessionalSummary } from '@/types';

export function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function load() {
    const rows = await apiFetch<Favorite[]>('/api/favorites');
    setFavorites(rows);
  }

  useEffect(() => {
    void load()
      .catch((err) => setError(err instanceof Error ? err.message : 'Saved professionals failed to load'))
      .finally(() => setLoading(false));
  }, []);

  async function remove(professionalId: string) {
    if (removingId) return;

    setError('');
    setRemovingId(professionalId);

    try {
      await apiFetch(`/api/favorites/${professionalId}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Saved professional could not be removed');
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <FavoritesHeader />
      {error && <StatusMessage message={error} />}
      <FavoritesGrid favorites={favorites} loading={loading} removingId={removingId} onRemove={remove} />
    </section>
  );
}

function FavoritesHeader() {
  return (
    <div>
      <h1 className="text-4xl font-black text-ink">Saved professionals</h1>
      <p className="mt-3 text-ink/65">Keep track of professionals you may want to book later.</p>
    </div>
  );
}

function FavoritesGrid({ favorites, loading, removingId, onRemove }: { favorites: Favorite[]; loading: boolean; removingId: string | null; onRemove: (professionalId: string) => void }) {
  if (loading) return <div className="card mt-8 p-8 text-ink/60">Loading saved professionals...</div>;

  if (favorites.length === 0) {
    return <div className="card mt-8 p-8 text-center text-ink/60">No saved professionals yet. Search and save professionals you like.</div>;
  }

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {favorites.map(({ professional }) => (
        <FavoriteCard key={professional.id} professional={professional} removing={removingId === professional.id} onRemove={onRemove} />
      ))}
    </div>
  );
}

function FavoriteCard({ professional, removing, onRemove }: { professional: ProfessionalSummary; removing: boolean; onRemove: (professionalId: string) => void }) {
  return (
    <div className="card overflow-hidden">
      <div className="h-36 bg-gradient-to-br from-blush to-rosewood/20" style={safeBackgroundImageStyle(professional.coverImageUrl)} />
      <div className="p-6">
        <p className="text-sm font-bold text-berry">{professional.category}</p>
        <h2 className="mt-2 text-2xl font-black text-ink">{professional.displayName}</h2>
        <p className="mt-2 text-sm leading-6 text-ink/65">{professional.headline}</p>
        <p className="mt-4 text-sm font-bold text-ink/60">{professional.city}, {professional.state}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link className="primary-button" to={`/pros/${professional.slug}`}>View profile</Link>
          <button className="secondary-button" type="button" onClick={() => onRemove(professional.id)} disabled={removing}>
            {removing ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusMessage({ message }: { message: string }) {
  return <p className="mt-6 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">{message}</p>;
}
