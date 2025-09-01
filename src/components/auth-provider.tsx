
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';
import type { UserRole } from '@/lib/types';
import { mockKras } from '@/lib/data';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  currentUserRole: UserRole | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  currentUserRole: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        // In a real app, you'd fetch this from your database.
        // For now, we'll find it from mock data.
        const employeeData = mockKras.find(k => k.employee.email === user.email);
        setCurrentUserRole(employeeData?.employee.role || 'Employee');
      } else {
        setCurrentUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
        <div className="flex flex-col h-screen">
            <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6">
                 <Skeleton className="h-6 w-40" />
                 <div className="ml-auto">
                    <Skeleton className="h-8 w-20" />
                 </div>
            </header>
            <div className="flex-1 p-6">
                <Skeleton className="h-full w-full" />
            </div>
        </div>
    )
  }

  return <AuthContext.Provider value={{ user, loading, currentUserRole }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
