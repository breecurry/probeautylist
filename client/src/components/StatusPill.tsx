export function StatusPill({ status }: { status: string }) {
  const label = status.replaceAll('_', ' ');
  const tone = status === 'confirmed' || status === 'approved' ? 'bg-emerald-100 text-emerald-800' : status === 'pending' || status === 'pending_review' ? 'bg-amber-100 text-amber-800' : status.includes('cancel') || status === 'declined' || status === 'suspended' ? 'bg-red-100 text-red-800' : 'bg-blush text-rosewood';
  return <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${tone}`}>{label}</span>;
}
