'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Meh, Frown, Sparkles, Sun, CloudRain, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const { toast } = useToast();

  const moods = [
    { id: 'great', label: 'Great', icon: <Sparkles className="h-6 w-6" />, color: 'bg-emerald-500', text: 'text-emerald-600' },
    { id: 'good', label: 'Good', icon: <Sun className="h-6 w-6" />, color: 'bg-amber-400', text: 'text-amber-600' },
    { id: 'okay', label: 'Okay', icon: <Meh className="h-6 w-6" />, color: 'bg-sky-500', text: 'text-sky-600' },
    { id: 'not-great', label: 'Tired', icon: <CloudRain className="h-6 w-6" />, color: 'bg-violet-500', text: 'text-violet-600' },
    { id: 'bad', label: 'Struggling', icon: <Frown className="h-6 w-6" />, color: 'bg-rose-500', text: 'text-rose-600' },
  ];

  const handleMoodSelect = (id: string) => {
    setSelectedMood(id);
    toast({
      title: 'Mood Logged!',
      description: 'Thanks for sharing how you feel today. Keep the rhythm going.',
    });
  };

  return (
    <Card className="creative-card overflow-hidden border-none bg-[linear-gradient(155deg,rgba(255,255,255,0.92),rgba(246,248,255,0.78))]">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-black text-slate-800">Daily Mood</CardTitle>
            <CardDescription className="text-slate-500 font-medium">Track your energy so your habits match your real day.</CardDescription>
          </div>
          <div className="rounded-2xl bg-slate-950/5 p-3 text-slate-700">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2">
          {moods.map((mood) => (
            <button
              key={mood.id}
              onClick={() => handleMoodSelect(mood.id)}
              className={`rounded-[24px] border p-3 flex flex-col items-center gap-2 group transition-all duration-300 ${
                selectedMood && selectedMood !== mood.id ? 'opacity-40 scale-95' : 'opacity-100 scale-100'
              } ${selectedMood === mood.id ? 'border-transparent bg-slate-950/5 shadow-sm' : 'border-white/60 bg-white/80'}`}
            >
              <div
                className={`p-4 rounded-2xl shadow-lg ${
                  selectedMood === mood.id ? mood.color : 'bg-white'
                } ${selectedMood === mood.id ? 'text-white' : mood.text} group-hover:scale-110 transition-transform`}
              >
                {mood.icon}
              </div>
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${
                  selectedMood === mood.id ? mood.text : 'text-slate-400'
                }`}
              >
                {mood.label}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
