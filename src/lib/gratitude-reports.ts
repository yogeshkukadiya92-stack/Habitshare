import { endOfMonth, endOfYear, eachDayOfInterval, eachMonthOfInterval, format, startOfMonth, startOfYear, subDays } from 'date-fns';
import type { GratitudeEntry } from './types';
import type { ReportRange } from './habit-reports';

export interface GratitudeReportBucket {
  key: string;
  label: string;
  wrote: number;
}

export interface GratitudeReportSummary {
  range: ReportRange;
  rangeLabel: string;
  buckets: GratitudeReportBucket[];
  writtenDays: number;
  missedDays: number;
  totalEntries: number;
  consistencyRate: number;
}

const getBucketDates = (currentDate: Date, range: ReportRange): Date[] => {
  if (range === 'daily') return [currentDate];
  if (range === 'weekly') {
    return eachDayOfInterval({ start: subDays(currentDate, 6), end: currentDate });
  }
  if (range === 'monthly') {
    return eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
  }
  return eachMonthOfInterval({ start: startOfYear(currentDate), end: endOfYear(currentDate) });
};

export const getGratitudeRangeLabel = (range: ReportRange, currentDate: Date) => {
  if (range === 'daily') return format(currentDate, 'MMM d, yyyy');
  if (range === 'weekly') return `${format(subDays(currentDate, 6), 'MMM d')} - ${format(currentDate, 'MMM d, yyyy')}`;
  if (range === 'monthly') return format(currentDate, 'MMMM yyyy');
  return format(currentDate, 'yyyy');
};

export const buildGratitudeReport = (
  entries: GratitudeEntry[],
  currentDate: Date,
  range: ReportRange,
): GratitudeReportSummary => {
  const bucketDates = getBucketDates(currentDate, range);
  const entryDays = new Set(entries.map((entry) => entry.entryDate));

  const buckets = bucketDates.map((date) => {
    if (range === 'yearly') {
      const monthKey = format(date, 'yyyy-MM');
      return {
        key: monthKey,
        label: format(date, 'MMM'),
        wrote: entries.some((entry) => entry.entryDate.startsWith(monthKey)) ? 1 : 0,
      };
    }

    const dayKey = format(date, 'yyyy-MM-dd');
    return {
      key: dayKey,
      label: range === 'weekly' ? format(date, 'EEE') : range === 'monthly' ? format(date, 'd') : 'Today',
      wrote: entryDays.has(dayKey) ? 1 : 0,
    };
  });

  const writtenDays = buckets.reduce((sum, bucket) => sum + bucket.wrote, 0);
  const missedDays = Math.max(bucketDates.length - writtenDays, 0);
  const totalEntries = entries.filter((entry) => {
    if (range === 'daily') return entry.entryDate === format(currentDate, 'yyyy-MM-dd');
    if (range === 'weekly') {
      const start = subDays(currentDate, 6);
      const day = new Date(`${entry.entryDate}T00:00:00`);
      return day >= start && day <= currentDate;
    }
    if (range === 'monthly') {
      const day = new Date(`${entry.entryDate}T00:00:00`);
      return day >= startOfMonth(currentDate) && day <= endOfMonth(currentDate);
    }
    return entry.entryDate.startsWith(format(currentDate, 'yyyy'));
  }).length;

  return {
    range,
    rangeLabel: getGratitudeRangeLabel(range, currentDate),
    buckets,
    writtenDays,
    missedDays,
    totalEntries,
    consistencyRate: bucketDates.length === 0 ? 0 : Math.round((writtenDays / bucketDates.length) * 100),
  };
};

export const buildGratitudeShareText = (
  entries: GratitudeEntry[],
  currentDate: Date,
  range: ReportRange,
) => {
  const report = buildGratitudeReport(entries, currentDate, range);
  return [
    `${range.charAt(0).toUpperCase()}${range.slice(1)} Gratitude Report`,
    `Period: ${report.rangeLabel}`,
    `Days gratitude written: ${report.writtenDays}`,
    `Days missed: ${report.missedDays}`,
    `Entries saved: ${report.totalEntries}`,
    `Consistency: ${report.consistencyRate}%`,
    '',
    'Breakdown:',
    ...report.buckets.map((bucket) => `${bucket.label}: ${bucket.wrote ? 'Written' : 'Missed'}`),
  ].join('\n');
};
