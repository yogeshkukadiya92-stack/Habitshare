'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { useAuth } from '@/components/auth-provider';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (loading) return;

    if (!user && !isLoginPage) {
      router.replace('/login');
      return;
    }

    if (user && isLoginPage) {
      router.replace('/');
    }
  }, [loading, user, isLoginPage, router]);

  if (loading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!user && !isLoginPage) {
    return null;
  }

  return (
    <div className="min-h-screen bg-transparent overflow-x-hidden">
      {user && !isLoginPage ? <Navbar /> : null}
      <main className="w-full p-4 sm:px-8 sm:py-8">
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}
