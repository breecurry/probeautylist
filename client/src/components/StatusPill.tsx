const tone: Record<string, string> = {
  confirmed: 'bg-green-50 text-green-700',
  approved: 'bg-green-50 text-green-700',
  completed: 'bg-blue-50 text-blue-700',
  pending: 'bg-amber-50 text-amber-700',
  pending_review: 'bg-amber-50 text-amber-700',
  declined: 'bg-red-50 text-red-700',
  suspended: 'bg-red-50 text-red-700',
  cancelled_by_client: 'bg-red-50 text-red-700',
  cancelled_by_professional: 'bg-red-50 text-red-700',
  no_show: 'bg-stone-100 text-stone-700',
};

export function StatusPill({ status }: { status: string }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${tone[status] || 'bg-blush text-rosewood'}`}>{status.replaceAll('_', ' ')}</span>;
}
