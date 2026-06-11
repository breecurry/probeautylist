import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { User } from '@/types';

export function RequireAuth({ roles }: { roles?: Array<User['role']> }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="mx-auto max-w-7xl px-6 py-16 text-ink/70">Loading your secure session...</div>;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
