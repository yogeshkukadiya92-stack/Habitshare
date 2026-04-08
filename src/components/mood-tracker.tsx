'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smile, Meh, Frown, Sparkles, Sun, CloudRain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const { toast } = useToast();

  const moods = [
    { id: 'great', label: 'Great', icon: <Sparkles className="h-6 w-6" />, color: 'bg-green-500', text: 'text-green-600' },
    { id: 'good', label: 'Good', icon: <Sun className="h-6 w-6" />, color: 'bg-yellow-500', text: 'text-yellow-600' },
    { id: 'okay', label: 'Okay', icon: <Meh className="h-6 w-6" />, color: 'bg-blue-500', text: 'text-blue-600' },
    { id: 'not-great', label: 'Tired', icon: <CloudRain className="h-6 w-6" />, color: 'bg-purple-500', text: 'text-purple-600' },
    { id: 'bad', label: 'Struggling', icon: <Frown className="h-6 w-6" />, color: 'bg-red-500', text: 'text-red-600' },
  ];

  const handleMoodSelect = (id: string) => {
    setSelectedMood(id);
    toast({
      title: "Mood Logged!",
      description: "Thanks for sharing how you feel today. Keep it up!",
    });
  };

  return (
    <Card className="shadow-lg border-none bg-white/40 backdrop-blur rounded-3xl overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-black text-slate-800">Daily Mood</CardTitle>
        <CardDescription className="text-slate-500 font-medium">How are you feeling while tracking your habits today?</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center gap-2">
          {moods.map((mood) => (
            <button
              key={mood.id}
              onClick={() => handleMoodSelect(mood.id)}
              className={`flex flex-col items-center gap-2 group transition-all duration-300 ${
                selectedMood && selectedMood !== mood.id ? 'opacity-40 scale-90' : 'opacity-100 scale-100'
              }`}
            >
              <div className={`p-4 rounded-full shadow-lg ${
                selectedMood === mood.id ? mood.color : 'bg-white'
              } ${selectedMood === mood.id ? 'text-white' : mood.text} group-hover:scale-110 transition-transform`}>
                {mood.icon}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${
                selectedMood === mood.id ? mood.text : 'text-slate-400'
              }`}>{mood.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
