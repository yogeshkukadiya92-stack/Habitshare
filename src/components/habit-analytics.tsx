'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { CalendarDays, CheckCircle2, Flame, Rocket, Target } from 'lucide-react';
import { HabitShareHabit } from '@/lib/types';
import { buildHabitReport, ReportRange } from '@/lib/habit-reports';

interface HabitAnalyticsProps {
  habits: HabitShareHabit[];
  currentDate?: Date;
  range?: ReportRange;
}

const summaryCards = [
  { key: 'habits', label: 'Habits', icon: Target },
  { key: 'active', label: 'Active', icon: CheckCircle2 },
  { key: 'checkins', label: 'Check-ins', icon: CalendarDays },
  { key: 'score', label: 'Score', icon: Flame },
];

export function HabitAnalytics({ habits, currentDate = new Date(), range = 'weekly' }: HabitAnalyticsProps) {
  const report = React.useMemo(() => buildHabitReport(habits, currentDate, range), [habits, currentDate, range]);
  const chartData = React.useMemo(
    () =>
      report.buckets.map((bucket) => ({
        name: bucket.label,
        completed: bucket.completed,
        total: bucket.total,
      })),
    [report.buckets],
  );

  const useBarChart = range === 'daily' || range === 'yearly';
  const chartHeight = range === 'daily' ? 260 : 300;

  if (habits.length === 0) {
    return (
      <Card className="overflow-hidden rounded-[32px] border-none bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(241,245,255,0.8))] shadow-2xl backdrop-blur">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] text-primary">
                <Rocket className="h-3.5 w-3.5" />
                Insight engine ready
              </div>
              <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-950">Your analytics will feel alive once the first habit lands.</h3>
              <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
                We&apos;ll transform check-ins into streak score, consistency views, and daily-to-yearly patterns as soon as your first routine starts.
              </p>
            </div>
            <div className="grid gap-3 sm:min-w-[260px]">
              {['Daily momentum snapshots', 'Monthly completion trends', 'Yearly consistency overview'].map((item) => (
                <div key={item} className="rounded-[22px] border border-white/70 bg-white/80 px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-none bg-white/50 shadow-2xl backdrop-blur rounded-3xl animate-in fade-in zoom-in duration-700">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-black tracking-tight text-slate-900">Habit Analytics</CardTitle>
              <CardDescription className="font-medium text-slate-500">
                {range === 'daily'
                  ? `Today at a glance for ${report.rangeLabel}.`
                  : `A ${range} summary for ${report.rangeLabel}.`}
              </CardDescription>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-3 shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600">Consistency</div>
              <div className="mt-1 text-3xl font-black text-indigo-700">{report.completionRate}%</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              const value =
                card.key === 'habits'
                  ? report.totalHabits
                  : card.key === 'active'
                    ? report.completedHabits
                    : card.key === 'checkins'
                      ? report.totalCheckIns
                      : `${report.completionRate}%`;

              return (
                <div key={card.key} className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">{card.label}</div>
                      <div className="text-lg font-black text-slate-900">{value}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="w-full pt-0" style={{ height: `${chartHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          {useBarChart ? (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                labelStyle={{ fontWeight: 800, color: '#1E293B', marginBottom: '4px' }}
                itemStyle={{ fontWeight: 700, color: '#4f46e5' }}
              />
              <Bar dataKey="completed" radius={[12, 12, 0, 0]} fill="#4f46e5" />
            </BarChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                labelStyle={{ fontWeight: 800, color: '#1E293B', marginBottom: '4px' }}
                itemStyle={{ fontWeight: 700, color: '#4f46e5' }}
              />
              <Area type="monotone" dataKey="completed" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorCompleted)" animationDuration={2000} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
