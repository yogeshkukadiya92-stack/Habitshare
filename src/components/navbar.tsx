
'use client';

import React from 'react';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { auth } from '@/lib/firebase';
import { Button } from './ui/button';
import { ShieldCheck } from 'lucide-react';
import { Badge } from './ui/badge';
import { SidebarTrigger } from './ui/sidebar';

export const Navbar = () => {
  const { user, currentUserRole } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const isAdmin = currentUserRole === 'Admin';

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <SidebarTrigger className="sm:hidden" />
      {user && (
        <div className="ml-auto flex items-center gap-4">
            <div className='flex items-center gap-2'>
              <span className="text-sm text-muted-foreground hidden sm:inline">Welcome, {user.email}</span>
              {isAdmin && (
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin
                </Badge>
              )}
            </div>
          <Button onClick={handleLogout} variant="outline">Logout</Button>
        </div>
      )}
    </header>
  );
};
