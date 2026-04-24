
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { Button } from './ui/button';
import { Check, ShieldCheck, Settings, UserRound, Sparkles, LogOut } from 'lucide-react';
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
    <header className="sticky top-0 z-20 px-4 py-4 sm:px-6">
      <div className="glass-panel mx-auto flex h-16 max-w-7xl items-center gap-2 rounded-[26px] px-3 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 shrink items-center gap-2 sm:gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-violet-500 to-sky-400 text-white shadow-[0_12px_30px_-12px_rgba(79,70,229,0.85)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.26em] text-slate-400 sm:text-xs sm:tracking-[0.35em]">Habit Share</div>
            <span className="block whitespace-nowrap text-xs font-semibold tracking-tight text-slate-800 sm:text-sm sm:tracking-wide">Coach for Life</span>
          </div>
        </div>
      
        {user && (
          <div className="ml-auto flex items-center gap-3">
            <div className='hidden items-center gap-2 rounded-2xl bg-slate-950/5 px-3 py-2 sm:flex'>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                <UserRound className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Logged in</div>
                <span className="text-sm font-semibold text-slate-700">{currentUser?.name || user.email}</span>
              </div>
              {isAdmin && (
                <Badge variant="secondary" className="gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary border-none">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin
                </Badge>
              )}
            </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 rounded-2xl border-white/70 bg-white/80 px-4 font-semibold text-slate-700">
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
            <Button onClick={handleLogout} variant="outline" size="sm" className="h-10 rounded-2xl border-white/70 bg-white/80 px-4 font-semibold text-slate-700">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
