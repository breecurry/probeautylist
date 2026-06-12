import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth as useClerkAuth, useClerk, useUser } from '@clerk/react';
import { apiFetch, setApiAuthTokenProvider } from '@/lib/api';
import type { User } from '@/types';

type SignupRole = 'client' | 'professional' | 'business';
type OrganizationRole = 'owner' | 'admin' | 'member';

type AuthResponse = {
  user: User;
  organization?: unknown;
};

type SyncUserInput = {
  role: SignupRole;
  phone?: string;
};

type SyncOrganizationInput = {
  clerkOrgId?: string;
  name?: string;
  slug?: string;
  imageUrl?: string;
  role?: OrganizationRole;
  clerkMembershipId?: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  clerkLoaded: boolean;
  clerkSignedIn: boolean;
  syncUser: (input: SyncUserInput) => Promise<User>;
  syncOrganization: (input: SyncOrganizationInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setApiAuthTokenProvider(() => getToken());
    return () => setApiAuthTokenProvider(null);
  }, [getToken]);

  const refresh = useCallback(async () => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch<AuthResponse>('/api/auth/me');
      setUser(response.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  const syncUser = useCallback(async (input: SyncUserInput) => {
    const response = await apiFetch<AuthResponse>('/api/auth/sync-user', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    setUser(response.user);
    return response.user;
  }, []);

  const syncOrganization = useCallback(async (input: SyncOrganizationInput) => {
    await apiFetch('/api/auth/sync-organization', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
  }, [signOut]);

  useEffect(() => {
    void refresh();
  }, [refresh, clerkUser?.id]);

  const value = useMemo(() => ({
    user,
    loading,
    clerkLoaded: isLoaded,
    clerkSignedIn: Boolean(isSignedIn),
    syncUser,
    syncOrganization,
    logout,
    refresh,
  }), [user, loading, isLoaded, isSignedIn, syncUser, syncOrganization, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
