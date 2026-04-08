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
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { HabitShareHabit } from '@/lib/types';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';

interface HabitAnalyticsProps {
  habits: HabitShareHabit[];
}

export function HabitAnalytics({ habits }: HabitAnalyticsProps) {
  // Generate data for the last 7 days
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  const chartData = last7Days.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const completedCount = habits.filter(h => h.checkIns.includes(dateStr)).length;
    return {
      name: format(date, 'EEE'),
      fullDate: dateStr,
      completed: completedCount,
    };
  });

  const totalPossible = habits.length * 7;
  const totalActual = chartData.reduce((acc, d) => acc + d.completed, 0);
  const consistencyScore = totalPossible > 0 ? Math.round((totalActual / totalPossible) * 100) : 0;

  return (
    <Card className="shadow-2xl border-none bg-white/40 backdrop-blur rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-700">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">Performance Analytics</CardTitle>
            <CardDescription className="text-slate-500 font-medium">Your consistency over the last 7 days.</CardDescription>
          </div>
          <div className="bg-primary/5 rounded-2xl px-6 py-3 border border-primary/10 flex flex-col items-center sm:items-end">
            <span className="text-xs font-black text-primary uppercase tracking-widest leading-none mb-1">Consistency Score</span>
            <span className="text-3xl font-black text-primary">{consistencyScore}%</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="h-[300px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }}
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
              labelStyle={{ fontWeight: 800, color: '#1E293B', marginBottom: '4px' }}
              itemStyle={{ fontWeight: 700, color: '#4f46e5' }}
            />
            <Area 
              type="monotone" 
              dataKey="completed" 
              stroke="#4f46e5" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorCompleted)" 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
