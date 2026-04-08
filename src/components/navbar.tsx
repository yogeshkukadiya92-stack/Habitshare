
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
  const { user, currentUser } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const isAdmin = currentUser?.role === 'Admin';

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <SidebarTrigger className="h-9 w-9 hover:bg-slate-100 rounded-md transition-colors" />
      
      {user && (
        <div className="ml-auto flex items-center gap-4">
            <div className='flex items-center gap-2'>
              <span className="text-sm text-muted-foreground hidden sm:inline font-medium">Welcome, {currentUser?.name || user.email}</span>
              {isAdmin && (
                <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-none">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin
                </Badge>
              )}
            </div>
          <Button onClick={handleLogout} variant="outline" size="sm" className="h-9 rounded-lg font-semibold text-slate-600 border-slate-200">Logout</Button>
        </div>
      )}
    </header>
  );
};
