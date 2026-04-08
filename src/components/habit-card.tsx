'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Habit, HabitShareHabit } from "@/lib/types";
import { CheckCircle2, Share2, Target, Flame, Heart } from 'lucide-react';
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

  return (
    <Card className="creative-card border-none bg-gradient-to-br from-indigo-50 to-white/60">
      <CardHeader className="pb-3 border-b border-indigo-100/50">
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
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-1.5">
            {last5Days.map((date, idx) => {
              const checked = isCheckedIn(date);
              const label = format(date, 'EE').charAt(0); // M, T, W, etc.
              return (
                <div 
                  key={idx}
                  onClick={() => handleDayClick(date)}
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                    checked 
                    ? 'bg-primary text-white shadow-[0_4px_10px_rgba(79,70,229,0.3)] scale-110' 
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
               className={`h-11 w-11 transition-all rounded-full border-2 ${
                  activeDateChecked 
                  ? 'border-transparent text-white bg-gradient-to-r from-green-400 to-green-500 shadow-[0_4px_15px_rgba(34,197,94,0.4)] hover:scale-105' 
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
