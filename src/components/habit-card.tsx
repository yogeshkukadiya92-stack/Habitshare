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

  return (
    <Card className="creative-card overflow-hidden border-none bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(242,245,255,0.84))]">
      <CardHeader className="relative pb-4 border-b border-indigo-100/50">
        <div className="absolute right-4 top-4 h-16 w-16 rounded-full bg-primary/10 blur-2xl" />
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {!isFriendView ? <Target className="h-4 w-4 text-primary" /> : <Flame className="h-4 w-4 text-orange-500" />}
            {habit.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            {currentStreak > 0 && (
               <div className="flex items-center gap-1 p-1 px-2.5 bg-orange-100 rounded-full text-orange-600 shadow-[0_0_10px_rgba(251,146,60,0.2)] animate-in zoom-in duration-500">
                 <Flame className="h-3.5 w-3.5 fill-orange-500" />
                 <span className="text-xs font-black">{currentStreak}</span>
               </div>
            )}
            {habit.isShared && !isFriendView && (
               <div className="p-1 px-2 bg-indigo-100 rounded-full text-indigo-600 shadow-sm" title="Shared with friends">
                 <Share2 className="h-3.5 w-3.5" />
               </div>
            )}
            {isFriendView && habit.cheers !== undefined && habit.cheers > 0 && (
               <div className="flex items-center gap-1 p-1 px-2 bg-pink-100 rounded-full text-pink-600 shadow-sm animate-in zoom-in duration-500">
                 <Heart className="h-3.5 w-3.5 fill-pink-500" />
                 <span className="text-xs font-black">{habit.cheers}</span>
               </div>
            )}
          </div>
        </div>
        {habit.description && (
          <CardDescription className="text-xs font-medium text-slate-500 mt-1">
            {habit.description}
          </CardDescription>
        )}
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-950/5 px-4 py-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Momentum</div>
            <div className="mt-1 text-lg font-black text-slate-900">{completionRate}%</div>
          </div>
          <button
            type="button"
            onClick={() => onViewDetails && onViewDetails(habit.id)}
            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Open
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-1.5">
            {last5Days.map((date, idx) => {
              const checked = isCheckedIn(date);
              const label = format(date, 'EE').charAt(0); // M, T, W, etc.
              return (
                <div 
                  key={idx}
                  onClick={() => handleDayClick(date)}
                  className={`h-9 w-9 rounded-2xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                    checked 
                    ? 'bg-gradient-to-br from-primary to-violet-500 text-white shadow-[0_10px_25px_-10px_rgba(79,70,229,0.75)] scale-105' 
                    : 'bg-white text-slate-400 border border-slate-200 hover:border-primary/50 hover:bg-indigo-50'
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
               className={`h-11 w-11 transition-all rounded-2xl border-2 ${
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
                className="rounded-xl font-bold bg-pink-100 hover:bg-pink-200 text-pink-600 shadow-sm border border-pink-200 transition-transform active:scale-95 gap-2"
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
