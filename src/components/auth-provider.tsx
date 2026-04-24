'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Employee, EmployeePermissions, PermissionLevel } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  currentUser: Employee | null;
  getPermission: (page: keyof EmployeePermissions) => PermissionLevel;
  refreshProfile: () => Promise<void>;
}

const defaultPermissions: EmployeePermissions = {
  habit_tracker: 'view',
  settings: 'none',
};

const adminPermissions: EmployeePermissions = {
  habit_tracker: 'download',
  settings: 'download',
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: false,
  currentUser: null,
  getPermission: () => 'none',
  refreshProfile: async () => {},
});

type ProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  branch: string | null;
  role: string | null;
  permissions: EmployeePermissions | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function mapProfile(row: ProfileRow): Employee {
  return {
    id: row.id,
    name: row.name || 'New User',
    email: row.email || '',
    avatarUrl: row.avatar_url || `https://placehold.co/32x32.png?text=${(row.email || 'U').charAt(0).toUpperCase()}`,
    branch: row.branch || undefined,
    role: (row.role as Employee['role']) || 'Employee',
    permissions: row.permissions || defaultPermissions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);

  const withTimeout = useCallback(async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
        }),
      ]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }, []);

  const ensureProfile = useCallback(async (authUser: User) => {
    const normalizedEmail = authUser.email?.toLowerCase().trim() || '';
    const isInitialAdmin =
      normalizedEmail === 'connect@luvfitnessworld.com' ||
      normalizedEmail === 'yogeshkukadiya92@gmail.com';

    const payload = {
      id: authUser.id,
      name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'New User',
      email: normalizedEmail,
      avatar_url:
        authUser.user_metadata?.avatar_url ||
        `https://placehold.co/32x32.png?text=${(normalizedEmail || 'U').charAt(0).toUpperCase()}`,
      role: isInitialAdmin ? 'Admin' : 'Employee',
      permissions: isInitialAdmin ? adminPermissions : defaultPermissions,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  }, []);

  const loadProfile = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setCurrentUser(null);
      return;
    }

    await ensureProfile(authUser);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url, branch, role, permissions, created_at, updated_at')
      .eq('id', authUser.id)
      .single();

    if (error) throw error;
    setCurrentUser(mapProfile(data as ProfileRow));
  }, [ensureProfile]);

  const refreshProfile = useCallback(async () => {
    await loadProfile(user);
  }, [loadProfile, user]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const { data, error } = await withTimeout(supabase.auth.getSession(), 3000, 'auth.getSession');
        if (cancelled) return;
        if (error) {
          console.error('Failed to load Supabase session:', error);
        }

        setSession(data.session);
        setUser(data.session?.user || null);
        setLoading(false);

        if (data.session?.user) {
          queueMicrotask(async () => {
            try {
              await withTimeout(loadProfile(data.session!.user), 7000, 'loadProfile');
            } catch (profileError) {
              console.error('Failed to prepare profile:', profileError);
            }
          });
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Auth bootstrap timeout/failure:', error);
          setSession(null);
          setUser(null);
          setCurrentUser(null);
          setLoading(false);
        }
      }
    };

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user || null);

      if (!nextSession?.user) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      queueMicrotask(async () => {
        try {
          await withTimeout(loadProfile(nextSession.user), 7000, 'authState.loadProfile');
        } catch (profileError) {
          console.error('Failed to sync auth profile:', profileError);
        }
      });
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [loadProfile, withTimeout]);

  const getPermission = (page: keyof EmployeePermissions): PermissionLevel => {
    if (loading || !currentUser) return 'none';
    if (currentUser.role === 'Admin') return 'download';
    return currentUser.permissions?.[page] || 'none';
  };

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      currentUser,
      getPermission,
      refreshProfile,
    }),
    [user, session, loading, currentUser, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
