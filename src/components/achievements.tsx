'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Star, Zap, Flame, Calendar, Award } from 'lucide-react';
import { HabitShareHabit } from '@/lib/types';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  color: string;
}

interface AchievementsProps {
  habits: HabitShareHabit[];
}

export function Achievements({ habits }: AchievementsProps) {
  const totalCheckIns = habits.reduce((acc, h) => acc + h.checkIns.length, 0);
  const maxStreak = habits.reduce((acc, h) => Math.max(acc, h.checkIns.length), 0); // Simplified streak check
  const totalHabits = habits.length;

  const badges: Achievement[] = [
    {
      id: 'first-step',
      name: 'First Step',
      description: 'Your very first check-in!',
      icon: <Star className="h-5 w-5" />,
      unlocked: totalCheckIns >= 1,
      color: 'bg-yellow-500',
    },
    {
      id: 'week-warrior',
      name: 'Week Warrior',
      description: '7-day streak on any habit!',
      icon: <Flame className="h-5 w-5" />,
      unlocked: maxStreak >= 7,
      color: 'bg-orange-500',
    },
    {
      id: 'habit-master',
      name: 'Habit Master',
      description: 'Track 5 or more active habits.',
      icon: <Trophy className="h-5 w-5" />,
      unlocked: totalHabits >= 5,
      color: 'bg-primary',
    },
    {
      id: 'consistency-king',
      name: 'Consistency King',
      description: 'Total of 50 check-ins across all habits.',
      icon: <Award className="h-5 w-5" />,
      unlocked: totalCheckIns >= 50,
      color: 'bg-purple-500',
    },
  ];

  return (
    <Card className="shadow-lg border-none bg-white/40 backdrop-blur rounded-3xl overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-black text-slate-800">Your Achievements</CardTitle>
            <div className="bg-primary/10 px-3 py-1 rounded-full flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-primary">{badges.filter(b => b.unlocked).length}/{badges.length}</span>
            </div>
        </div>
        <CardDescription className="text-slate-500 font-medium font-sans">Unlock badges by staying consistent!</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 overflow-x-auto">
        <div className="flex gap-6 pb-2 min-w-max px-1">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`flex flex-col items-center gap-3 group transition-all duration-500 ${
                badge.unlocked ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'
              }`}
            >
              <div className={`p-4 rounded-3xl shadow-xl transition-all duration-300 transform group-hover:scale-110 ${badge.color} text-white`}>
                {badge.icon}
              </div>
              <div className="text-center w-24">
                <p className="text-xs font-black text-slate-800 leading-tight">{badge.name}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1 leading-none">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
