'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, Bot, User, Loader2 } from 'lucide-react';
import { HabitShareHabit } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AiCoachProps {
  habit?: HabitShareHabit;
}

function buildLocalAdvice(habit: HabitShareHabit | undefined, userMessage: string) {
  const normalized = userMessage.toLowerCase();
  const streak = habit?.checkIns.length || 0;
  const habitName = habit?.name || 'your next habit';

  if (normalized.includes('streak')) {
    return `Your current streak for ${habitName} is ${streak} day${streak === 1 ? '' : 's'}. Protect it by keeping today's version small and easy.`;
  }

  if (normalized.includes('motivation') || normalized.includes('lazy') || normalized.includes('tired')) {
    return `When motivation is low, shrink ${habitName} to a 2-minute version. Starting matters more than doing it perfectly.`;
  }

  if (normalized.includes('time') || normalized.includes('schedule')) {
    return `Anchor ${habitName} to an existing routine like after tea, after breakfast, or before sleep. Same cue, same action, every day.`;
  }

  if (normalized.includes('miss') || normalized.includes('skip')) {
    return `Missing one day does not break the habit. Your rule should be: never miss twice. Restart ${habitName} with the smallest possible action today.`;
  }

  return habit
    ? `For ${habitName}, focus on consistency over intensity. A small repeatable action today will strengthen your ${streak}-day rhythm.`
    : 'Pick one simple habit, attach it to a fixed daily cue, and make the first version easy enough to repeat every day.';
}

export function AiCoach({ habit }: AiCoachProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: habit 
        ? `Hi! I'm your AI Habit Coach. I see you're working on "${habit.name}". How can I help you stay consistent today?`
        : "Hi! I'm your AI Habit Coach. Select a habit or ask me anything about building better routines!",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    const advice = buildLocalAdvice(habit, userMessage);

    setMessages((prev) => [...prev, { role: 'assistant', content: advice }]);
    setIsLoading(false);
  };

  return (
    <Card className="w-full h-[500px] flex flex-col shadow-xl border-none bg-gradient-to-br from-indigo-50/50 to-white/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="border-b bg-white/50 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-lg">AI Habit Coach</CardTitle>
            <CardDescription className="text-xs">Powered by Gemini 2.0</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${
                  m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div className={`p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0 ${
                  m.role === 'user' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-sm font-medium leading-relaxed shadow-sm ${
                    m.role === 'user'
                      ? 'bg-primary text-white rounded-tr-none'
                      : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="bg-slate-100 text-slate-600 p-2 rounded-full h-8 w-8 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <div className="bg-white text-slate-400 rounded-2xl rounded-tl-none p-3 text-sm italic border border-slate-100 shadow-sm">
                  Coach is thinking...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 bg-white/50 border-t flex gap-2">
          <Input
            placeholder="Type your question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="rounded-xl border-slate-200 focus-visible:ring-primary shadow-inner"
            disabled={isLoading}
          />
          <Button 
            size="icon" 
            onClick={handleSend} 
            disabled={isLoading}
            className="rounded-xl shadow-lg shadow-primary/20 bg-primary shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
