
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { Button } from './ui/button';
import { Check, ShieldCheck, Settings, UserRound } from 'lucide-react';
import { Badge } from './ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export const Navbar = () => {
  const { user, currentUser, refreshProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [displayName, setDisplayName] = React.useState('');
  const [isSavingName, setIsSavingName] = React.useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  React.useEffect(() => {
    setDisplayName(currentUser?.name || '');
  }, [currentUser?.name]);

  const handleSaveName = async () => {
    if (!currentUser) return;
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      toast({ title: 'Name Required', description: 'Please enter a valid name.', variant: 'destructive' });
      return;
    }
    if (trimmedName === currentUser.name) return;

    setIsSavingName(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: trimmedName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (error) throw error;
      await refreshProfile();
      toast({ title: 'Profile Updated', description: 'Your name has been updated.' });
    } catch (error) {
      console.error('Failed to update profile name:', error);
      toast({ title: 'Update Failed', description: 'Could not save your name right now.', variant: 'destructive' });
    } finally {
      setIsSavingName(false);
    }
  };

  const isAdmin = currentUser?.role === 'Admin';

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <UserRound className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold tracking-wide text-slate-700">Habit Share</span>
      </div>
      
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
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 rounded-lg font-semibold text-slate-600 border-slate-200">
                <Settings className="mr-2 h-4 w-4" />
                Profile
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[340px] sm:w-[420px]">
              <SheetHeader>
                <SheetTitle>User Information</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div className="rounded-lg border bg-slate-50/60 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Name</p>
                  <div className="mt-2 flex gap-2">
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your name"
                      className="h-9"
                    />
                    <Button type="button" onClick={handleSaveName} size="sm" className="h-9 px-3" disabled={isSavingName}>
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="rounded-lg border bg-slate-50/60 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Email</p>
                  <p className="mt-1 font-medium text-slate-800">{user.email || 'N/A'}</p>
                </div>
                <div className="rounded-lg border bg-slate-50/60 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Role</p>
                  <p className="mt-1 font-medium text-slate-800">{currentUser?.role || 'Employee'}</p>
                </div>
                <div className="rounded-lg border bg-slate-50/60 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Branch</p>
                  <p className="mt-1 font-medium text-slate-800">{currentUser?.branch || 'Not set'}</p>
                </div>
                <Separator />
                <div className="rounded-lg border bg-slate-50/60 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">User ID</p>
                  <p className="mt-1 break-all font-mono text-xs text-slate-700">{user.id}</p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Button onClick={handleLogout} variant="outline" size="sm" className="h-9 rounded-lg font-semibold text-slate-600 border-slate-200">Logout</Button>
        </div>
      )}
    </header>
  );
};
