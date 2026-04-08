import { endOfMonth, endOfYear, eachDayOfInterval, eachMonthOfInterval, format, startOfMonth, startOfYear, subDays } from 'date-fns';
import type { HabitShareHabit } from './types';

export type ReportRange = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface HabitReportBucket {
  key: string;
  label: string;
  completed: number;
  total: number;
}

export interface HabitReportSummary {
  range: ReportRange;
  rangeLabel: string;
  buckets: HabitReportBucket[];
  totalHabits: number;
  completedHabits: number;
  totalCheckIns: number;
  completionRate: number;
}

const getBucketDates = (currentDate: Date, range: ReportRange): Date[] => {
  if (range === 'daily') return [currentDate];
  if (range === 'weekly') {
    return eachDayOfInterval({ start: subDays(currentDate, 6), end: currentDate });
  }
  if (range === 'monthly') {
    return eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate),
    });
  }
  return eachMonthOfInterval({
    start: startOfYear(currentDate),
    end: endOfYear(currentDate),
  });
};

export const getReportRangeLabel = (range: ReportRange, currentDate: Date) => {
  if (range === 'daily') return format(currentDate, 'MMM d, yyyy');
  if (range === 'weekly') return `${format(subDays(currentDate, 6), 'MMM d')} - ${format(currentDate, 'MMM d, yyyy')}`;
  if (range === 'monthly') return format(currentDate, 'MMMM yyyy');
  return format(currentDate, 'yyyy');
};

export const buildHabitReport = (
  habits: HabitShareHabit[],
  currentDate: Date,
  range: ReportRange,
): HabitReportSummary => {
  const bucketDates = getBucketDates(currentDate, range);
  const totalCheckIns = habits.reduce((total, habit) => total + habit.checkIns.length, 0);

  const buckets = bucketDates.map((date) => {
    if (range === 'daily') {
      const completed = habits.filter((habit) => habit.checkIns.includes(format(date, 'yyyy-MM-dd'))).length;
      return {
        key: format(date, 'yyyy-MM-dd'),
        label: 'Today',
        completed,
        total: habits.length,
      };
    }

    if (range === 'yearly') {
      const monthKey = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMM');
      const completed = habits.reduce(
        (count, habit) => count + habit.checkIns.filter((checkIn) => checkIn.startsWith(monthKey)).length,
        0,
      );
      return {
        key: monthKey,
        label: monthLabel,
        completed,
        total: habits.length,
      };
    }

    const dayKey = format(date, 'yyyy-MM-dd');
    const dayLabel = range === 'weekly' ? format(date, 'EEE') : format(date, 'd');
    const completed = habits.reduce(
      (count, habit) => count + (habit.checkIns.includes(dayKey) ? 1 : 0),
      0,
    );
    return {
      key: dayKey,
      label: dayLabel,
      completed,
      total: habits.length,
    };
  });

  const periodCheckInCount = buckets.reduce((sum, bucket) => sum + bucket.completed, 0);
  const completedHabits = habits.filter((habit) =>
    habit.checkIns.some((checkIn) => {
      if (range === 'daily') {
        return checkIn === format(currentDate, 'yyyy-MM-dd');
      }

      if (range === 'weekly') {
        const bucketStart = subDays(currentDate, 6);
        const day = new Date(`${checkIn}T00:00:00`);
        return day >= bucketStart && day <= currentDate;
      }

      if (range === 'monthly') {
        const day = new Date(`${checkIn}T00:00:00`);
        return day >= startOfMonth(currentDate) && day <= endOfMonth(currentDate);
      }

      const month = checkIn.slice(0, 7);
      return month === format(currentDate, 'yyyy-MM');
    }),
  ).length;

  const completionRate = habits.length === 0 || buckets.length === 0
    ? 0
    : Math.round((periodCheckInCount / (habits.length * buckets.length)) * 100);

  return {
    range,
    rangeLabel: getReportRangeLabel(range, currentDate),
    buckets,
    totalHabits: habits.length,
    completedHabits,
    totalCheckIns,
    completionRate,
  };
};

export const buildShareReportText = (
  habits: HabitShareHabit[],
  currentDate: Date,
  range: ReportRange,
) => {
  const summary = buildHabitReport(habits, currentDate, range);
  const title = `${range.charAt(0).toUpperCase()}${range.slice(1)} Habit Report`;
  const lines = [
    title,
    `Period: ${summary.rangeLabel}`,
    `Habits tracked: ${summary.totalHabits}`,
    `Habits active in period: ${summary.completedHabits}`,
    `Total check-ins: ${summary.totalCheckIns}`,
    `Completion rate: ${summary.completionRate}%`,
    '',
    'Breakdown:',
    ...summary.buckets.map((bucket) => `${bucket.label}: ${bucket.completed}/${bucket.total}`),
  ];

  return lines.join('\n');
};
