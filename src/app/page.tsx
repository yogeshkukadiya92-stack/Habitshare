'use client';

import * as React from 'react';
import { addDays, format, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, LogOut, PlusCircle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HabitCard } from '@/components/habit-card';
import { HabitCalendarDialog } from '@/components/habit-calendar-dialog';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import type { HabitShareHabit } from '@/lib/types';

type HabitRow = {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  name: string;
  description: string | null;
  check_ins: string[] | null;
  cheers: number | null;
  is_shared: boolean | null;
  created_at: string;
  updated_at: string | null;
};

function mapHabit(row: HabitRow): HabitShareHabit {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || '',
    userEmail: row.user_email || '',
    name: row.name,
    description: row.description || '',
    checkIns: row.check_ins || [],
    cheers: row.cheers || 0,
    isShared: Boolean(row.is_shared),
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

export default function Dashboard() {
  const { user, currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
  const [myHabits, setMyHabits] = React.useState<HabitShareHabit[]>([]);
  const [isDashboardLoading, setIsDashboardLoading] = React.useState(true);

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [newHabitName, setNewHabitName] = React.useState('');
  const [newHabitDesc, setNewHabitDesc] = React.useState('');
  const [isSavingHabit, setIsSavingHabit] = React.useState(false);

  const [selectedHabitId, setSelectedHabitId] = React.useState<string | null>(null);

  const loadMyHabits = React.useCallback(async () => {
    if (!user) {
      setMyHabits([]);
      setIsDashboardLoading(false);
      return;
    }

    setIsDashboardLoading(true);
    try {
      const { data, error } = await supabase
        .from('habit_share_habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyHabits((data || []).map((row) => mapHabit(row as HabitRow)));
    } catch (error) {
      console.error('Failed to load habits:', error);
      toast({
        title: 'Load failed',
        description: 'Could not load your habits from Supabase.',
        variant: 'destructive',
      });
    } finally {
      setIsDashboardLoading(false);
    }
  }, [toast, user]);

  React.useEffect(() => {
    void loadMyHabits();
  }, [loadMyHabits]);

  const selectedHabit = selectedHabitId
    ? myHabits.find((habit) => habit.id === selectedHabitId) || null
    : null;

  const currentDateStr = format(currentDate, 'yyyy-MM-dd');
  const totalCheckIns = myHabits.reduce((sum, habit) => sum + habit.checkIns.length, 0);
  const longestStreak = myHabits.reduce((best, habit) => Math.max(best, habit.checkIns.length), 0);
  const doneTodayCount = myHabits.filter((habit) => habit.checkIns.includes(currentDateStr)).length;

  const resetCreateForm = () => {
    setNewHabitName('');
    setNewHabitDesc('');
  };

  const closeCreateDialog = (open: boolean) => {
    setIsCreateOpen(open);
    if (!open) {
      resetCreateForm();
    }
  };

  const saveHabit = async () => {
    if (!user || !newHabitName.trim()) {
      toast({
        title: 'Habit name required',
        description: 'Please enter a habit name before saving.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingHabit(true);
    try {
      const payload = {
        id: `habit_${Date.now()}`,
        user_id: user.id,
        user_name: currentUser?.name || user.email?.split('@')[0] || 'User',
        user_email: user.email || '',
        name: newHabitName.trim(),
        description: newHabitDesc.trim(),
        check_ins: [] as string[],
        cheers: 0,
        is_shared: false,
        shared_with_ids: [] as string[],
        shared_with_groups: [] as string[],
      };

      const { error } = await supabase.from('habit_share_habits').insert(payload);
      if (error) throw error;

      toast({ title: 'Habit created', description: 'Your habit has been added.' });
      closeCreateDialog(false);
      await loadMyHabits();
    } catch (error) {
      console.error('Failed to save habit:', error);
      toast({
        title: 'Save failed',
        description: 'Could not save this habit right now.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingHabit(false);
    }
  };

  const toggleHabitCheckIn = async (habitId: string, dateStr: string) => {
    const habit = myHabits.find((item) => item.id === habitId);
    if (!habit) return;

    const nextCheckIns = habit.checkIns.includes(dateStr)
      ? habit.checkIns.filter((value) => value !== dateStr)
      : [...habit.checkIns, dateStr];

    setMyHabits((prev) =>
      prev.map((item) =>
        item.id === habitId
          ? {
              ...item,
              checkIns: nextCheckIns,
            }
          : item,
      ),
    );

    const { error } = await supabase
      .from('habit_share_habits')
      .update({
        check_ins: nextCheckIns,
        updated_at: new Date().toISOString(),
      })
      .eq('id', habitId);

    if (error) {
      console.error('Failed to update check-in:', error);
      setMyHabits((prev) => prev.map((item) => (item.id === habitId ? habit : item)));
      toast({
        title: 'Update failed',
        description: 'Could not update your check-in right now.',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (authLoading) {
    return <main className="p-6 text-sm text-slate-500">Loading...</main>;
  }

  if (!user) {
    return <main className="p-6 text-sm text-slate-500">Please login to continue.</main>;
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f3f6ff_0%,#ffffff_100%)] p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-indigo-500">
                <Target className="h-3.5 w-3.5" />
                Habit tracker
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Habit Share</h1>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Welcome back, {currentUser?.name || user.email?.split('@')[0] || 'User'}.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsCreateOpen(true)} className="rounded-2xl font-bold">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Habit
              </Button>
              <Button variant="outline" onClick={handleLogout} className="rounded-2xl font-bold">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Habits</div>
              <div className="mt-2 text-3xl font-black text-slate-900">{myHabits.length}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Done today</div>
              <div className="mt-2 text-3xl font-black text-slate-900">{doneTodayCount}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Best streak</div>
              <div className="mt-2 text-3xl font-black text-slate-900">{longestStreak}</div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-slate-900">Active habits</h2>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-1">
              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl" onClick={() => setCurrentDate((d) => subDays(d, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" className="rounded-xl px-3 font-black text-slate-700" onClick={() => setCurrentDate(new Date())}>
                {format(currentDate, 'MMM d, yyyy')}
              </Button>
              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl" onClick={() => setCurrentDate((d) => addDays(d, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="mt-2 text-sm font-medium text-slate-500">
            Total check-ins: {totalCheckIns}
          </p>

          {isDashboardLoading ? (
            <div className="mt-6 text-sm text-slate-500">Loading your habits...</div>
          ) : myHabits.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <div className="text-base font-black text-slate-900">No habits yet</div>
              <p className="mt-1 text-sm text-slate-500">Create your first habit and start your streak today.</p>
              <Button className="mt-4 rounded-2xl font-bold" onClick={() => setIsCreateOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add First Habit
              </Button>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {myHabits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onToggleCheckIn={toggleHabitCheckIn}
                  onViewDetails={(habitId) => setSelectedHabitId(habitId)}
                  currentDate={currentDate}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={closeCreateDialog}>
        <DialogContent className="max-w-[95vw] rounded-[26px] border-none p-0 sm:max-w-lg">
          <div className="border-b border-slate-100 px-5 py-5">
            <DialogTitle className="text-3xl font-black tracking-tight text-slate-950">Create Habit</DialogTitle>
            <p className="mt-1 text-sm text-slate-500">Simple and fast. Name it and start tracking.</p>
          </div>

          <div className="space-y-4 px-5 py-5">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Habit name</Label>
              <Input
                value={newHabitName}
                onChange={(event) => setNewHabitName(event.target.value)}
                placeholder="Morning walk"
                className="h-12 rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Description</Label>
              <textarea
                value={newHabitDesc}
                onChange={(event) => setNewHabitDesc(event.target.value)}
                placeholder="Keep it simple..."
                className="min-h-[110px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 px-5 py-4">
            <div className="flex w-full gap-3">
              <Button variant="ghost" className="h-11 flex-1 rounded-2xl" onClick={() => closeCreateDialog(false)}>
                Cancel
              </Button>
              <Button className="h-11 flex-1 rounded-2xl font-bold" onClick={saveHabit} disabled={isSavingHabit}>
                {isSavingHabit ? 'Saving...' : 'Save Habit'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HabitCalendarDialog
        habit={selectedHabit}
        isOpen={Boolean(selectedHabit)}
        onClose={() => setSelectedHabitId(null)}
      />
    </main>
  );
}

