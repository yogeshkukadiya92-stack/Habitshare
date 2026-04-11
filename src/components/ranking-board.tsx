'use client';

import * as React from 'react';
import { endOfMonth, endOfYear, format, isSameDay, startOfMonth, startOfYear, subDays } from 'date-fns';
import { Award, Crown, Flame, Medal, Sparkles, Trophy, Maximize2, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { GratitudeEntry, HabitShareHabit, HabitShareUser } from '@/lib/types';
import type { ReportRange } from '@/lib/habit-reports';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RankingBoardProps {
  habits: HabitShareHabit[];
  gratitudeEntries: GratitudeEntry[];
  friends: HabitShareUser[];
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
  currentDate: Date;
  onMyPointsChange?: (points: number) => void;
}

interface RankRow {
  userId: string;
  name: string;
  email: string;
  habitPoints: number;
  gratitudePoints: number;
  bonusPoints: number;
  totalPoints: number;
}

const pointRules = {
  habitCheckIn: 10,
  gratitudeEntry: 15,
  streakBonusMultiplier: 2,
} as const;

const rangeOptions: ReportRange[] = ['weekly', 'monthly', 'yearly', 'daily'];

const dateInRange = (dateStr: string, currentDate: Date, range: ReportRange) => {
  const day = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(day.getTime())) return false;
  if (range === 'daily') return isSameDay(day, currentDate);
  if (range === 'weekly') {
    const start = subDays(currentDate, 6);
    return day >= start && day <= currentDate;
  }
  if (range === 'monthly') {
    return day >= startOfMonth(currentDate) && day <= endOfMonth(currentDate);
  }
  return day >= startOfYear(currentDate) && day <= endOfYear(currentDate);
};

const longestStreak = (dates: string[]) => {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort();
  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = new Date(`${sorted[i - 1]}T00:00:00`);
    const next = new Date(`${sorted[i]}T00:00:00`);
    const diff = Math.round((next.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return best;
};

const getRangeLabel = (range: ReportRange, currentDate: Date) => {
  if (range === 'daily') return format(currentDate, 'MMM d, yyyy');
  if (range === 'weekly') return `${format(subDays(currentDate, 6), 'MMM d')} - ${format(currentDate, 'MMM d')}`;
  if (range === 'monthly') return format(currentDate, 'MMMM yyyy');
  return format(currentDate, 'yyyy');
};

const getLevel = (points: number) => {
  if (points >= 1200) return { name: 'Legend', tone: 'text-amber-700 bg-amber-100' };
  if (points >= 800) return { name: 'Diamond', tone: 'text-sky-700 bg-sky-100' };
  if (points >= 500) return { name: 'Platinum', tone: 'text-indigo-700 bg-indigo-100' };
  if (points >= 300) return { name: 'Gold', tone: 'text-yellow-700 bg-yellow-100' };
  if (points >= 150) return { name: 'Silver', tone: 'text-slate-700 bg-slate-100' };
  return { name: 'Bronze', tone: 'text-amber-700 bg-orange-100' };
};

export const calculateLeaderboard = (
  habits: HabitShareHabit[],
  gratitudeEntries: GratitudeEntry[],
  friends: HabitShareUser[],
  currentUser: { id: string; name: string; email: string },
  currentDate: Date,
  range: ReportRange,
) => {
  const users = new Map<string, { name: string; email: string }>();
  users.set(currentUser.id, { name: currentUser.name || 'You', email: currentUser.email || '' });
  friends.forEach((friend) => {
    users.set(friend.id, { name: friend.name || 'Friend', email: friend.email || '' });
  });

  const scoreMap = new Map<string, RankRow>();

  const ensureRow = (userId: string, name: string, email: string) => {
    if (!scoreMap.has(userId)) {
      scoreMap.set(userId, {
        userId,
        name,
        email,
        habitPoints: 0,
        gratitudePoints: 0,
        bonusPoints: 0,
        totalPoints: 0,
      });
    }
    return scoreMap.get(userId)!;
  };

  users.forEach((meta, userId) => {
    ensureRow(userId, meta.name, meta.email);
  });

  const habitByUser = new Map<string, string[]>();
  habits.forEach((habit) => {
    const inRangeCheckins = habit.checkIns.filter((date) => dateInRange(date, currentDate, range));
    if (inRangeCheckins.length === 0) return;
    const userName = habit.userName || users.get(habit.userId)?.name || 'Member';
    const userEmail = habit.userEmail || users.get(habit.userId)?.email || '';
    const row = ensureRow(habit.userId, userName, userEmail);
    row.habitPoints += inRangeCheckins.length * pointRules.habitCheckIn;
    const existingDates = habitByUser.get(habit.userId) || [];
    habitByUser.set(habit.userId, [...existingDates, ...inRangeCheckins]);
  });

  gratitudeEntries.forEach((entry) => {
    if (!dateInRange(entry.entryDate, currentDate, range)) return;
    const userName = entry.userName || users.get(entry.userId)?.name || 'Member';
    const userEmail = entry.userEmail || users.get(entry.userId)?.email || '';
    const row = ensureRow(entry.userId, userName, userEmail);
    row.gratitudePoints += pointRules.gratitudeEntry;
  });

  habitByUser.forEach((checkins, userId) => {
    const row = scoreMap.get(userId);
    if (!row) return;
    row.bonusPoints += longestStreak(checkins) * pointRules.streakBonusMultiplier;
  });

  return Array.from(scoreMap.values())
    .map((row) => ({
      ...row,
      totalPoints: row.habitPoints + row.gratitudePoints + row.bonusPoints,
    }))
    .filter((row) => row.totalPoints > 0)
    .sort((a, b) => b.totalPoints - a.totalPoints);
};

export function RankingBoard({
  habits,
  gratitudeEntries,
  friends,
  currentUser,
  currentDate,
  onMyPointsChange,
}: RankingBoardProps) {
  const [range, setRange] = React.useState<ReportRange>('weekly');
  const [isExpandedOpen, setIsExpandedOpen] = React.useState(false);

  const leaderboard = React.useMemo(() => {
    return calculateLeaderboard(habits, gratitudeEntries, friends, currentUser, currentDate, range);
  }, [currentDate, currentUser.email, currentUser.id, currentUser.name, friends, gratitudeEntries, habits, range]);

  React.useEffect(() => {
    if (!onMyPointsChange) return;
    const me = leaderboard.find((row) => row.userId === currentUser.id);
    onMyPointsChange(me?.totalPoints || 0);
  }, [currentUser.id, leaderboard, onMyPointsChange]);

  return (
    <>
    <Card className="creative-card border-none bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(241,245,255,0.88))]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-black text-slate-900">
              <Trophy className="h-5 w-5 text-amber-500" />
              Ranking System
            </CardTitle>
            <CardDescription className="mt-1 text-sm font-medium text-slate-500">
              Points from habit follow + gratitude writing
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" className="h-9 w-9 rounded-xl" onClick={() => setIsExpandedOpen(true)}>
              <Maximize2 className="h-4 w-4" />
            </Button>
            <div className="rounded-2xl bg-white/80 px-3 py-2 text-right shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Period</div>
              <div className="mt-1 text-xs font-black text-slate-700">{getRangeLabel(range, currentDate)}</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {rangeOptions.map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={range === option ? 'default' : 'outline'}
              className="rounded-full px-3 text-xs font-black"
              onClick={() => setRange(option)}
            >
              {option}
            </Button>
          ))}
        </div>

        {leaderboard.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-5 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-700">No ranking data yet</p>
            <p className="mt-1 text-xs text-slate-500">Complete habits and write gratitude to start earning points.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.slice(0, 10).map((row, index) => {
              const level = getLevel(row.totalPoints);
              const medal =
                index === 0 ? <Crown className="h-4 w-4 text-amber-500" /> : index === 1 ? <Medal className="h-4 w-4 text-slate-500" /> : index === 2 ? <Award className="h-4 w-4 text-amber-700" /> : <span className="text-xs font-black text-slate-500">#{index + 1}</span>;
              return (
                <div key={row.userId} className={`rounded-2xl border px-3 py-3 ${index === 0 ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200 bg-white/85'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm">{medal}</div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-slate-900">{row.name}</div>
                        <div className="truncate text-[11px] text-slate-500">{row.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-primary">{row.totalPoints}</div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">pts</div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Flame className="h-3 w-3 text-emerald-500" />
                      Habit {row.habitPoints}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-rose-500" />
                      Gratitude {row.gratitudePoints}
                    </span>
                    <span>Bonus {row.bonusPoints}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] ${level.tone}`}>{level.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
    <Dialog open={isExpandedOpen} onOpenChange={setIsExpandedOpen}>
      <DialogContent className="max-w-6xl h-[88vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-black">
            <Trophy className="h-5 w-5 text-amber-500" />
            Leaderboard Arena
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="ranking" className="h-full flex flex-col">
          <TabsList className="w-fit">
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
            <TabsTrigger value="rules">Point Rules</TabsTrigger>
          </TabsList>
          <TabsContent value="ranking" className="mt-4 overflow-y-auto">
            <div className="grid gap-3">
              {leaderboard.map((row, index) => {
                const level = getLevel(row.totalPoints);
                return (
                  <div key={row.userId} className="rounded-2xl border bg-white p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-black text-slate-700">
                          #{index + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-base font-black">{row.name}</div>
                          <div className="truncate text-xs text-slate-500">{row.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.2em] ${level.tone}`}>{level.name}</span>
                        <div className="text-right">
                          <div className="text-2xl font-black text-primary">{row.totalPoints}</div>
                          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">points</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
          <TabsContent value="rules" className="mt-4 overflow-y-auto">
            <div className="grid gap-3">
              <div className="rounded-2xl border bg-white p-4">
                <div className="font-black">Habit check-in</div>
                <div className="text-sm text-slate-500 mt-1">+{pointRules.habitCheckIn} points per completed check-in</div>
              </div>
              <div className="rounded-2xl border bg-white p-4">
                <div className="font-black">Gratitude entry</div>
                <div className="text-sm text-slate-500 mt-1">+{pointRules.gratitudeEntry} points per daily gratitude entry</div>
              </div>
              <div className="rounded-2xl border bg-white p-4">
                <div className="font-black">Streak bonus</div>
                <div className="text-sm text-slate-500 mt-1">Longest streak x {pointRules.streakBonusMultiplier} bonus points</div>
              </div>
              <div className="rounded-2xl border bg-white p-4">
                <div className="font-black flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" /> Levels</div>
                <div className="text-sm text-slate-500 mt-1">Bronze 0+, Silver 150+, Gold 300+, Platinum 500+, Diamond 800+, Legend 1200+</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
    </>
  );
}
