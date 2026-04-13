'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HeartHandshake, Target, Users, Calendar, MessageCircle, ChevronLeft, ChevronRight, Check, X, Share2 } from 'lucide-react';
import { HabitShareGroup, HabitShareHabit, GratitudeEntry, HabitShareUser } from '@/lib/types';
import { HabitCard } from './habit-card';
import { addMonths, eachDayOfInterval, endOfMonth, format, isSameMonth, startOfMonth, subMonths } from 'date-fns';
import { openWhatsAppShare } from '@/lib/whatsapp-share';

interface GroupFeedProps {
  group: HabitShareGroup;
  habits: HabitShareHabit[];
  gratitudeEntries: GratitudeEntry[];
  members: HabitShareUser[];
  currentUser: HabitShareUser;
  currentDate: Date;
  onCheer?: (habitId: string) => void;
  onViewDetails?: (habitId: string) => void;
}

export function GroupFeed({
  group,
  habits,
  gratitudeEntries,
  members,
  currentUser,
  currentDate,
  onCheer,
  onViewDetails,
}: GroupFeedProps) {
  const [activeTab, setActiveTab] = React.useState<'habits' | 'gratitude'>('habits');
  const [chartMonth, setChartMonth] = React.useState<Date>(startOfMonth(currentDate));

  const groupHabits = habits.filter(habit => habit.sharedWithGroups?.includes(group.id));
  const groupGratitude = gratitudeEntries.filter(entry => entry.sharedWithGroups?.includes(group.id));

  React.useEffect(() => {
    setChartMonth(startOfMonth(currentDate));
  }, [currentDate]);

  const getMemberInfo = (userId: string) => {
    return members.find(member => member.id === userId) || {
      name: 'Unknown',
      email: '',
      avatarUrl: '',
    };
  };

  const monthDays = React.useMemo(
    () => eachDayOfInterval({ start: startOfMonth(chartMonth), end: endOfMonth(chartMonth) }),
    [chartMonth],
  );

  const tableMembers = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string; avatarUrl: string }>();

    members.forEach((member) => {
      map.set(member.id, {
        id: member.id,
        name: member.name || member.email || 'Member',
        email: member.email || '',
        avatarUrl: member.avatarUrl || '',
      });
    });

    groupGratitude.forEach((entry) => {
      if (!map.has(entry.userId)) {
        map.set(entry.userId, {
          id: entry.userId,
          name: entry.userName || entry.userEmail || 'Member',
          email: entry.userEmail || '',
          avatarUrl: '',
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [groupGratitude, members]);

  const writtenByUserByDay = React.useMemo(() => {
    const map = new Map<string, Set<string>>();
    groupGratitude.forEach((entry) => {
      const entryDate = new Date(entry.entryDate);
      if (!isSameMonth(entryDate, chartMonth)) return;

      const key = format(entryDate, 'yyyy-MM-dd');
      const bucket = map.get(entry.userId) || new Set<string>();
      bucket.add(key);
      map.set(entry.userId, bucket);
    });
    return map;
  }, [chartMonth, groupGratitude]);

  const monthShareText = React.useMemo(() => {
    const header = monthDays.map((day) => format(day, 'dd')).join(' ');
    const lines = tableMembers.map((member) => {
      const writtenSet = writtenByUserByDay.get(member.id) || new Set<string>();
      const marks = monthDays.map((day) => (writtenSet.has(format(day, 'yyyy-MM-dd')) ? '✅' : '❌')).join(' ');
      const total = monthDays.filter((day) => writtenSet.has(format(day, 'yyyy-MM-dd'))).length;
      return `${member.name} (${total}/${monthDays.length}): ${marks}`;
    });

    return [
      `Group Gratitude Chart`,
      `Group: ${group.name}`,
      `Month: ${format(chartMonth, 'MMMM yyyy')}`,
      '',
      `Dates: ${header}`,
      ...lines,
    ].join('\n');
  }, [chartMonth, group.name, monthDays, tableMembers, writtenByUserByDay]);

  return (
    <div className="space-y-6">
      {/* Group Header */}
      <Card className="creative-card border-none bg-[linear-gradient(140deg,rgba(241,245,255,0.95),rgba(255,255,255,0.84))]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-black flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                {group.name}
              </CardTitle>
              {group.description && (
                <p className="text-slate-600 mt-2">{group.description}</p>
              )}
            </div>
            <Badge variant="secondary" className="text-sm">
              {group.memberCount} members
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex -space-x-2 mb-4">
            {members.slice(0, 8).map((member) => (
              <Avatar key={member.id} className="h-10 w-10 border-2 border-white">
                <AvatarImage src={member.avatarUrl} />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
            {group.memberCount > 8 && (
              <div className="h-10 w-10 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center">
                <span className="text-sm font-medium text-slate-600">+{group.memberCount - 8}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <Button
          variant={activeTab === 'habits' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('habits')}
          className="rounded-lg"
        >
          <Target className="h-4 w-4 mr-2" />
          Habits ({groupHabits.length})
        </Button>
        <Button
          variant={activeTab === 'gratitude' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('gratitude')}
          className="rounded-lg"
        >
          <HeartHandshake className="h-4 w-4 mr-2" />
          Gratitude ({groupGratitude.length})
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'habits' ? (
        <div className="space-y-4">
          {groupHabits.length === 0 ? (
            <Card className="creative-card border-none bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(248,250,255,0.84))]">
              <CardContent className="text-center py-12">
                <Target className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No shared habits yet</h3>
                <p className="text-slate-500">Group members haven't shared any habits with the group yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {groupHabits.map((habit) => {
                const member = getMemberInfo(habit.userId);
                return (
                  <div key={habit.id} className="relative">
                    <div className="absolute -top-2 -left-2 z-10">
                      <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                        <AvatarImage src={member.avatarUrl} />
                        <AvatarFallback className="text-xs">{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                    <HabitCard
                      habit={habit}
                      onToggleCheckIn={() => {}}
                      onCheer={onCheer}
                      onViewDetails={onViewDetails}
                      isFriendView={true}
                      currentDate={currentDate}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <Card className="creative-card border-none bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(241,245,255,0.86))]">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-lg font-black text-slate-900">Monthly Gratitude Chart</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setChartMonth((prev) => startOfMonth(subMonths(prev, 1)))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="min-w-[120px] text-center text-sm font-black text-slate-700">
                    {format(chartMonth, 'MMMM yyyy')}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setChartMonth((prev) => startOfMonth(addMonths(prev, 1)))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() => openWhatsAppShare(monthShareText)}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share chart
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-[980px] border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 min-w-[220px] bg-slate-100 px-3 py-2 text-left font-black text-slate-700">
                        Member
                      </th>
                      {monthDays.map((day) => (
                        <th
                          key={format(day, 'yyyy-MM-dd')}
                          className="min-w-[34px] border border-slate-200 bg-slate-50 px-1 py-2 text-center text-[11px] font-black text-slate-500"
                        >
                          {format(day, 'd')}
                        </th>
                      ))}
                      <th className="min-w-[90px] border border-slate-200 bg-slate-100 px-2 py-2 text-center text-xs font-black text-slate-700">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableMembers.map((member) => {
                      const writtenSet = writtenByUserByDay.get(member.id) || new Set<string>();
                      const writtenCount = monthDays.filter((day) => writtenSet.has(format(day, 'yyyy-MM-dd'))).length;

                      return (
                        <tr key={member.id}>
                          <td className="sticky left-0 z-10 border border-slate-200 bg-white px-3 py-2">
                            <div className="font-semibold text-slate-900">{member.name}</div>
                            <div className="text-[11px] text-slate-500">{member.email || 'No email'}</div>
                          </td>
                          {monthDays.map((day) => {
                            const dayKey = format(day, 'yyyy-MM-dd');
                            const wrote = writtenSet.has(dayKey);
                            return (
                              <td
                                key={`${member.id}_${dayKey}`}
                                className={`border border-slate-200 px-1 py-1 text-center ${
                                  wrote ? 'bg-emerald-50' : 'bg-rose-50'
                                }`}
                              >
                                {wrote ? (
                                  <Check className="mx-auto h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <X className="mx-auto h-3.5 w-3.5 text-rose-500" />
                                )}
                              </td>
                            );
                          })}
                          <td className="border border-slate-200 bg-slate-50 px-2 py-1 text-center font-black text-slate-800">
                            {writtenCount}/{monthDays.length}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {groupGratitude.length === 0 ? (
            <Card className="creative-card border-none bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(248,250,255,0.84))]">
              <CardContent className="text-center py-12">
                <HeartHandshake className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No shared gratitude yet</h3>
                <p className="text-slate-500">Group members haven't shared any gratitude entries with the group yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {groupGratitude.map((entry) => {
                const member = getMemberInfo(entry.userId);
                const entryDate = new Date(entry.entryDate);
                const isToday = format(entryDate, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd');

                return (
                  <Card key={entry.id} className="creative-card border-none bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(241,245,255,0.86))]">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatarUrl} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-slate-900">{member.name}</div>
                            <div className="text-sm text-slate-500 flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {isToday ? 'Today' : format(entryDate, 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
