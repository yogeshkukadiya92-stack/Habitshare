'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { HeartHandshake, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { GratitudeEntry } from '@/lib/types';

interface GratitudeFeedProps {
  entries: GratitudeEntry[];
}

export function GratitudeFeed({ entries }: GratitudeFeedProps) {
  const sharedEntries = React.useMemo(
    () => [...entries].sort((a, b) => b.entryDate.localeCompare(a.entryDate)).slice(0, 6),
    [entries],
  );

  return (
    <Card className="creative-card border-none bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(255,245,247,0.86))]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-black text-slate-950">
          <HeartHandshake className="h-5 w-5 text-rose-500" />
          Friends&apos; Gratitude
        </CardTitle>
        <CardDescription>See the gratitude your circle chose to share with you.</CardDescription>
      </CardHeader>
      <CardContent>
        {sharedEntries.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-white/80 p-6 text-center">
            <div className="text-base font-black text-slate-900">No shared gratitude yet</div>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Once friends start sharing gratitude entries, they will show up here as a calmer social feed.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sharedEntries.map((entry) => (
              <div key={entry.id} className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-black text-slate-900">{entry.userName || entry.userEmail || 'Friend'}</div>
                    <div className="mt-1 text-xs font-medium text-slate-400">{format(new Date(`${entry.entryDate}T00:00:00`), 'MMM d, yyyy')}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const text = `Gratitude from ${entry.userName || 'a friend'}\n${entry.entryDate}\n\n${entry.content}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
                    }}
                    className="rounded-full text-rose-600"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{entry.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
