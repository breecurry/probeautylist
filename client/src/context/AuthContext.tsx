import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { User } from '@/types';

type LoginInput = { email: string; password: string };
type RegisterInput = LoginInput & { firstName: string; lastName: string; phone?: string; role: 'client' | 'professional' };

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const me = await apiFetch<User>('/api/auth/me');
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(input: LoginInput) {
    const me = await apiFetch<User>('/api/auth/login', { method: 'POST', body: JSON.stringify(input) });
    setUser(me);
  }

  async function register(input: RegisterInput) {
    const me = await apiFetch<User>('/api/auth/register', { method: 'POST', body: JSON.stringify(input) });
    setUser(me);
  }

  async function logout() {
    await apiFetch<{ message: string }>('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout, refresh }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
