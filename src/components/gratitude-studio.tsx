'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { CalendarDays, CheckCircle2, HeartHandshake, MessageCircle, NotebookPen, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { GratitudeEntry, HabitShareUser } from '@/lib/types';
import type { ReportRange } from '@/lib/habit-reports';
import { buildGratitudeReport, buildGratitudeShareText, getGratitudeRangeLabel } from '@/lib/gratitude-reports';

interface GratitudeStudioProps {
  entries: GratitudeEntry[];
  currentDate: Date;
  range: ReportRange;
  friends: HabitShareUser[];
  draft: string;
  isShared: boolean;
  sharedWithIds: string[];
  isReportOpen: boolean;
  isSaving: boolean;
  onDraftChange: (value: string) => void;
  onToggleShared: (value: boolean) => void;
  onToggleFriend: (friendId: string) => void;
  onToggleReportOpen: () => void;
  onRangeChange: (range: ReportRange) => void;
  onSave: () => Promise<void> | void;
  onShareWhatsApp: () => void;
}

const rangeOptions: ReportRange[] = ['daily', 'weekly', 'monthly', 'yearly'];

export function GratitudeStudio({
  entries,
  currentDate,
  range,
  friends,
  draft,
  isShared,
  sharedWithIds,
  isReportOpen,
  isSaving,
  onDraftChange,
  onToggleShared,
  onToggleFriend,
  onToggleReportOpen,
  onRangeChange,
  onSave,
  onShareWhatsApp,
}: GratitudeStudioProps) {
  const report = React.useMemo(() => buildGratitudeReport(entries, currentDate, range), [entries, currentDate, range]);
  const todayKey = format(currentDate, 'yyyy-MM-dd');
  const todaysEntry = entries.find((entry) => entry.entryDate === todayKey);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="creative-card border-none bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(255,244,248,0.86))]">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-950">
                <HeartHandshake className="h-5 w-5 text-rose-500" />
                Gratitude Studio
              </CardTitle>
              <CardDescription className="mt-2 text-sm font-medium text-slate-500">
                Write one gratitude reflection for the day, keep it private or share it with your circle.
              </CardDescription>
            </div>
            <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Date</div>
              <div className="mt-1 text-sm font-black text-slate-900">{format(currentDate, 'MMM d')}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-[26px] border border-white/80 bg-white/85 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.28em] text-slate-400">
              <NotebookPen className="h-3.5 w-3.5 text-rose-500" />
              Today&apos;s gratitude
            </div>
            <textarea
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              placeholder="What are you grateful for today? Keep it honest, specific, and meaningful."
              className="mt-4 min-h-[150px] w-full rounded-[22px] border border-slate-100 bg-slate-50/90 px-4 py-4 text-sm font-medium leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-rose-300 focus:ring-2 focus:ring-rose-200"
            />
            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
              <div className="rounded-full bg-slate-100 px-3 py-2 text-slate-600">Quick note: keep it short and real.</div>
              <button
                type="button"
                onClick={onToggleReportOpen}
                className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-black text-rose-700 transition hover:bg-rose-100"
              >
                {isReportOpen ? 'Hide report' : 'Open report'}
              </button>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/80 bg-white/85 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Checkbox id="share-gratitude" checked={isShared} onCheckedChange={(value) => onToggleShared(Boolean(value))} />
              <label htmlFor="share-gratitude" className="text-sm font-bold text-slate-800">
                Share this gratitude with selected friends
              </label>
            </div>

            {isShared ? (
              <div className="mt-4 space-y-3">
                {friends.length === 0 ? (
                  <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm font-medium text-slate-500">
                    No accepted friends yet. You can still save gratitude privately and share later.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {friends.map((friend) => {
                      const selected = sharedWithIds.includes(friend.id);
                      return (
                        <button
                          key={friend.id}
                          type="button"
                          onClick={() => onToggleFriend(friend.id)}
                          className={`rounded-[22px] border p-4 text-left transition-all ${
                            selected ? 'border-rose-300 bg-rose-50 shadow-md shadow-rose-100' : 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
                          }`}
                        >
                          <div className="text-sm font-black text-slate-900">{friend.name}</div>
                          <div className="mt-1 text-xs font-medium text-slate-500">{friend.email}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={onSave} disabled={isSaving} className="h-12 rounded-2xl font-black shadow-xl shadow-rose-200/60">
              {isSaving ? 'Saving...' : todaysEntry ? 'Update Gratitude' : 'Save Gratitude'}
              <CheckCircle2 className="ml-2 h-4 w-4" />
            </Button>
            <Button onClick={onShareWhatsApp} variant="outline" className="h-12 rounded-2xl border-rose-200 bg-white/85 font-black text-rose-600">
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp share
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className={`creative-card border-none bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(241,245,255,0.84))] ${isReportOpen ? '' : 'hidden'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl font-black text-slate-950">
                <CalendarDays className="h-5 w-5 text-primary" />
                Gratitude Report
              </CardTitle>
              <CardDescription className="mt-2 text-sm font-medium text-slate-500">
                Track how consistently you pause and write gratitude.
              </CardDescription>
            </div>
            <div className="rounded-2xl bg-primary/10 px-4 py-3 text-right shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-primary/70">Consistency</div>
              <div className="mt-1 text-lg font-black text-primary">Hidden</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {rangeOptions.map((option) => (
              <Button
                key={option}
                type="button"
                variant={range === option ? 'default' : 'outline'}
                className="rounded-full px-4"
                onClick={() => onRangeChange(option)}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Button>
            ))}
          </div>

          <div className="rounded-[24px] bg-slate-50/90 p-4">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Selected period</div>
            <div className="mt-2 text-lg font-black text-slate-900">{getGratitudeRangeLabel(range, currentDate)}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[22px] border border-white/80 bg-white/85 p-4 shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Written days</div>
              <div className="mt-2 text-lg font-black text-slate-900">Hidden</div>
            </div>
            <div className="rounded-[22px] border border-white/80 bg-white/85 p-4 shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Missed days</div>
              <div className="mt-2 text-lg font-black text-slate-900">Hidden</div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/80 bg-white/85 p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
              <Share2 className="h-3.5 w-3.5 text-rose-500" />
              Report breakdown
            </div>
            <div className="space-y-2">
              {report.buckets.map((bucket) => (
                <div key={bucket.key} className="flex items-center justify-between rounded-2xl bg-slate-50/90 px-4 py-3 text-sm font-medium text-slate-600">
                  <span>{bucket.label}</span>
                  <span className={`font-black ${bucket.wrote ? 'text-emerald-600' : 'text-slate-400'}`}>{bucket.wrote ? 'Written' : 'Missed'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-dashed border-slate-200 bg-white/75 p-4">
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Today</div>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
              {todaysEntry?.content || 'No gratitude saved for this day yet. Write a few honest lines and keep the reflection streak alive.'}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              const reportText = buildGratitudeShareText(entries, currentDate, range);
              window.open(`https://wa.me/?text=${encodeURIComponent(reportText)}`, '_blank', 'noopener,noreferrer');
            }}
            className="h-12 w-full rounded-2xl border-slate-200 bg-white/85 font-black"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Share gratitude report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
