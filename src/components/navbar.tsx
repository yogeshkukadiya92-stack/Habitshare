'use client';

import React from 'react';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { auth } from '@/lib/firebase';
import { Button } from './ui/button';
import { Package2 } from 'lucide-react';

export const Navbar = () => {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6">
        <div
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <Package2 className="h-4 w-4 transition-all group-hover:scale-110" />
            <span className="sr-only">KRA Dashboard</span>
        </div>
        <h1 className="text-lg font-semibold">KRA Dashboard</h1>
      {user && (
        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Welcome, {user.email}</span>
          <Button onClick={handleLogout} variant="outline">Logout</Button>
        </div>
      )}
    </header>
  );
};
