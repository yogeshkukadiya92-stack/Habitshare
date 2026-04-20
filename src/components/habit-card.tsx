'use client';

import * as React from 'react';
import { format, subDays } from 'date-fns';
import { CalendarDays, Heart, Share2, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { HabitDayStatus, getHabitDayStatus, getHabitDoneSet } from '@/lib/habit-status';
import type { Habit, HabitShareHabit } from '@/lib/types';

type HabitCardHabit = Pick<Habit, 'id' | 'name' | 'description'> & {
  checkIns: Array<Date | string>;
  isShared?: boolean;
  cheers?: number;
};

interface HabitCardProps {
  habit: HabitCardHabit | HabitShareHabit;
  onCheer?: (habitId: string) => void;
  onViewDetails?: (habitId: string) => void;
  onSetDayStatus?: (habitId: string, dateStr: string, status: HabitDayStatus) => void;
  onEdit?: (habitId: string) => void;
  onDelete?: (habitId: string) => void;
  isFriendView?: boolean;
  currentDate?: Date;
  showMemberName?: boolean;
  memberName?: string;
}

export function HabitCard({
  habit,
  onCheer,
  onViewDetails,
  onSetDayStatus,
  onEdit,
  onDelete,
  isFriendView = false,
  currentDate = new Date(),
  showMemberName = false,
  memberName,
}: HabitCardProps) {
  const [quickPickDate, setQuickPickDate] = React.useState<string | null>(null);
  const doneSet = React.useMemo(() => getHabitDoneSet(habit.checkIns), [habit.checkIns]);

  const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(currentDate, 6 - i));
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const currentStreak = React.useMemo(() => {
    const dates = new Set(doneSet);
    let streak = 0;
    let cursor = currentDate;

    if (dates.has(format(cursor, 'yyyy-MM-dd'))) {
      streak++;
      cursor = subDays(cursor, 1);
    } else {
      cursor = subDays(cursor, 1);
      if (!dates.has(format(cursor, 'yyyy-MM-dd'))) return 0;
    }

    while (dates.has(format(cursor, 'yyyy-MM-dd'))) {
      streak++;
      cursor = subDays(cursor, 1);
    }
    return streak;
  }, [doneSet, currentDate]);

  const completionRate = Math.round((doneSet.size / Math.max(doneSet.size + 2, 5)) * 100);
  const activeDateStr = format(currentDate, 'yyyy-MM-dd');
  const activeStatus = getHabitDayStatus(habit.checkIns, activeDateStr);
  const activeIsDone = activeStatus === 'done';
  const activeIsSkipped = activeStatus === 'skipped';
  const activeIsFuture = activeDateStr > todayKey;

  const openCalendar = () => onViewDetails?.(habit.id);

  const getDayStatus = (date: Date) => getHabitDayStatus(habit.checkIns, format(date, 'yyyy-MM-dd'));

  return (
    <button
      type="button"
      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-slate-300"
      onClick={() => {
        if (!isFriendView) {
          onEdit?.(habit.id);
        } else {
          onViewDetails?.(habit.id);
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="truncate text-left text-lg font-black text-slate-900">{habit.name}</div>
            {!isFriendView && onDelete ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(habit.id);
                }}
                title="Delete habit"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
          {showMemberName && memberName ? <div className="text-xs font-semibold text-slate-500">By {memberName}</div> : null}
          <div className="mt-1 text-sm font-semibold text-slate-700">
            Streak: +{currentStreak} | Overall: {completionRate}% | {habit.isShared ? 'Shared' : 'Private'}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {habit.isShared && !isFriendView ? (
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <Share2 className="h-3.5 w-3.5" />
            </span>
          ) : null}
          {isFriendView && habit.cheers ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-2 py-1 text-xs font-bold text-pink-600">
              <Heart className="h-3 w-3 fill-pink-500" />
              {habit.cheers}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid min-w-0 flex-1 grid-cols-7 gap-1.5 sm:flex sm:overflow-x-auto">
          {last7Days.map((date) => {
            const status = getDayStatus(date);
            const dateKey = format(date, 'yyyy-MM-dd');
            const isFuture = dateKey > todayKey;
            const label = format(date, 'EE').charAt(0);
            return (
              <button
                key={format(date, 'yyyy-MM-dd')}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isFriendView) return;
                  const selectedDate = format(date, 'yyyy-MM-dd');
                  if (selectedDate > todayKey) return;
                  setQuickPickDate(selectedDate);
                }}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-9 sm:w-9 sm:text-sm ${
                  status === 'done' ? 'bg-emerald-500 text-white' : status === 'skipped' ? 'bg-slate-300 text-slate-700' : isFuture ? 'border border-slate-200 bg-white text-slate-400' : 'bg-rose-100 text-rose-500'
                } ${isFriendView ? 'pointer-events-none' : ''}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          {!isFriendView ? (
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                openCalendar();
              }}
              className={`h-9 w-9 rounded-full border ${
                activeIsDone
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                  : activeIsSkipped
                    ? 'border-slate-400 bg-slate-200 text-slate-700'
                    : activeIsFuture
                      ? 'border-slate-200 bg-white text-slate-400'
                      : 'border-rose-200 bg-rose-50 text-rose-500'
              }`}
            >
              <CalendarDays className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-9 rounded-xl bg-pink-100 px-3 text-pink-700 hover:bg-pink-200"
              onClick={(e) => {
                e.stopPropagation();
                onCheer?.(habit.id);
              }}
            >
              <Heart className="mr-1.5 h-3.5 w-3.5" />
              Cheer
            </Button>
          )}

        </div>
      </div>

      {quickPickDate && !isFriendView ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2" onClick={(e) => e.stopPropagation()}>
          <div className="mb-2 text-xs font-bold text-slate-500">{format(new Date(`${quickPickDate}T00:00:00`), 'dd MMM yyyy')} status</div>
          <div className="grid grid-cols-4 gap-2">
            <Button
              type="button"
              className="h-8 rounded-lg bg-emerald-500 text-xs font-bold hover:bg-emerald-600"
              onClick={() => {
                onSetDayStatus?.(habit.id, quickPickDate, 'done');
                setQuickPickDate(null);
              }}
            >
              Green
            </Button>
            <Button
              type="button"
              className="h-8 rounded-lg bg-rose-500 text-xs font-bold hover:bg-rose-600"
              onClick={() => {
                onSetDayStatus?.(habit.id, quickPickDate, 'none');
                setQuickPickDate(null);
              }}
            >
              Red
            </Button>
            <Button
              type="button"
              className="h-8 rounded-lg bg-slate-500 text-xs font-bold hover:bg-slate-600"
              onClick={() => {
                onSetDayStatus?.(habit.id, quickPickDate, 'skipped');
                setQuickPickDate(null);
              }}
            >
              Gray
            </Button>
            <Button type="button" variant="outline" className="h-8 rounded-lg text-xs font-bold" onClick={() => setQuickPickDate(null)}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </button>
  );
}
