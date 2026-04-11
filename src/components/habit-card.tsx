'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Habit, HabitShareHabit } from "@/lib/types";
import { CheckCircle2, Share2, Target, Flame, Heart, ArrowUpRight } from 'lucide-react';
import { Button } from './ui/button';
import { format, subDays, isSameDay } from 'date-fns';

type HabitCardHabit = Pick<Habit, 'id' | 'name' | 'description'> & {
  checkIns: Array<Date | string>;
  isShared?: boolean;
  cheers?: number;
};

interface HabitCardProps {
  habit: HabitCardHabit | HabitShareHabit;
  onToggleCheckIn?: (habitId: string, dateStr: string) => void;
  onCheer?: (habitId: string) => void;
  onViewDetails?: (habitId: string) => void;
  isFriendView?: boolean;
  currentDate?: Date;
}

export function HabitCard({ habit, onToggleCheckIn, onCheer, onViewDetails, isFriendView = false, currentDate = new Date() }: HabitCardProps) {
  const checkInStrings = React.useMemo(
    () => habit.checkIns.map((checkIn) => (typeof checkIn === 'string' ? checkIn : format(new Date(checkIn), 'yyyy-MM-dd'))),
    [habit.checkIns],
  );

  // Generate the last 5 days up to currentDate
  const last5Days = Array.from({ length: 5 }).map((_, i) => subDays(currentDate, 4 - i));
  const activeDateStr = format(currentDate, 'yyyy-MM-dd');

  const calculateStreak = () => {
    const dates = new Set(checkInStrings);
    let streak = 0;
    let streakPointer = new Date(); // Streaks always calculate from actual today to be accurate?
    // Wait, the user asked to see previous dates. Usually streak should reflect the active current date!
    streakPointer = currentDate;
    
    if (dates.has(format(streakPointer, 'yyyy-MM-dd'))) {
      streak++;
      streakPointer = subDays(streakPointer, 1);
    } else {
      streakPointer = subDays(streakPointer, 1);
      if (!dates.has(format(streakPointer, 'yyyy-MM-dd'))) return 0;
    }

    while (dates.has(format(streakPointer, 'yyyy-MM-dd'))) {
      streak++;
      streakPointer = subDays(streakPointer, 1);
    }
    return streak;
  };

  const currentStreak = calculateStreak();

  const handleDayClick = (date: Date) => {
    if (isFriendView || !onToggleCheckIn) return; 
    onToggleCheckIn(habit.id, format(date, 'yyyy-MM-dd'));
  };

  const isCheckedIn = (date: Date) => {
    return checkInStrings.includes(format(date, 'yyyy-MM-dd'));
  };

  const activeDateChecked = isCheckedIn(currentDate);
  const completionRate = Math.round((checkInStrings.length / Math.max(checkInStrings.length + 2, 5)) * 100);
  const momentumWidth = Math.min(Math.max(completionRate, 8), 100);

  return (
    <Card className="creative-card group overflow-hidden border-none bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(241,245,255,0.88))]">
      <CardHeader className="relative border-b border-indigo-100/50 pb-5">
        <div className="absolute right-4 top-4 h-16 w-16 rounded-full bg-primary/10 blur-2xl transition duration-500 group-hover:scale-125" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${!isFriendView ? 'bg-primary/10 text-primary' : 'bg-orange-100 text-orange-500'}`}>
                {!isFriendView ? <Target className="h-4 w-4" /> : <Flame className="h-4 w-4" />}
              </div>
              <CardTitle className="truncate text-lg font-black tracking-tight text-slate-800">
                {habit.name}
              </CardTitle>
            </div>
            {habit.description && (
              <CardDescription className="mt-3 line-clamp-2 text-sm font-medium leading-6 text-slate-500">
                {habit.description}
              </CardDescription>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {currentStreak > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1.5 text-orange-600 shadow-[0_0_10px_rgba(251,146,60,0.2)] animate-in zoom-in duration-500">
                <Flame className="h-3.5 w-3.5 fill-orange-500" />
                <span className="text-xs font-black">{currentStreak}</span>
              </div>
            )}
            {habit.isShared && !isFriendView && (
              <div className="rounded-full bg-indigo-100 px-2.5 py-1.5 text-indigo-600 shadow-sm" title="Shared with friends">
                <Share2 className="h-3.5 w-3.5" />
              </div>
            )}
            {isFriendView && habit.cheers !== undefined && habit.cheers > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-pink-100 px-2.5 py-1.5 text-pink-600 shadow-sm animate-in zoom-in duration-500">
                <Heart className="h-3.5 w-3.5 fill-pink-500" />
                <span className="text-xs font-black">{habit.cheers}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 rounded-[24px] bg-slate-950/[0.045] px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Momentum</div>
              <div className="mt-1 text-2xl font-black text-slate-900">{completionRate}%</div>
            </div>
            <button
              type="button"
              onClick={() => onViewDetails && onViewDetails(habit.id)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              Open
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-violet-500 to-sky-400 transition-all duration-700"
              style={{ width: `${momentumWidth}%` }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {last5Days.map((date, idx) => {
              const checked = isCheckedIn(date);
              const label = format(date, 'EE').charAt(0); // M, T, W, etc.
              return (
                <div 
                  key={idx}
                  onClick={() => handleDayClick(date)}
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-black transition-all duration-300 cursor-pointer ${
                    checked 
                    ? 'bg-gradient-to-br from-primary to-violet-500 text-white shadow-[0_12px_25px_-10px_rgba(79,70,229,0.75)] scale-105' 
                    : 'bg-white text-slate-400 border border-slate-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-indigo-50'
                  } ${isFriendView ? 'pointer-events-none' : ''}`}
                >
                  {label}
                </div>
              );
            })}
          </div>
          
          {!isFriendView ? (
             <Button 
               size="icon"
               variant="ghost" 
               onClick={() => handleDayClick(currentDate)}
               className={`h-12 w-12 rounded-2xl border-2 transition-all active:scale-95 ${
                  activeDateChecked 
                  ? 'border-transparent text-white bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[0_10px_25px_-10px_rgba(16,185,129,0.8)] hover:scale-105' 
                  : 'border-slate-200 text-slate-300 hover:text-green-500 hover:border-green-200 hover:bg-green-50'
               }`}
             >
               <CheckCircle2 className="h-7 w-7" />
             </Button>
          ) : (
             <Button
                size="sm"
                className="h-11 rounded-2xl border border-pink-200 bg-pink-100 px-4 font-bold text-pink-600 shadow-sm transition-transform active:scale-95 gap-2 hover:bg-pink-200"
                onClick={() => onCheer && onCheer(habit.id)}
             >
                <Heart className="h-4 w-4" /> 
                Cheer
             </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
