'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import LoginPage from '@/app/login/page';
import { Navbar } from '@/components/navbar';
import { useAuth } from '@/components/auth-provider';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (user && isLoginPage) {
      router.replace('/');
    }

    return undefined;
  }, [user, isLoginPage, router]);

  if (!user && !isLoginPage) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-transparent overflow-x-hidden">
      {user && !isLoginPage ? <Navbar /> : null}
      <main className="w-full p-4 sm:px-8 sm:py-8">
        <div className="w-full">{loading ? <div className="text-sm font-semibold text-slate-500">Opening HabitShare...</div> : children}</div>
      </main>
    </div>
  );
}
