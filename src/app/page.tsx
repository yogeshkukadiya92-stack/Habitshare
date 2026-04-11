'use client';

import * as React from 'react';
import { format, subDays, addDays, isSameDay } from 'date-fns';
import { CheckCircle2, LayoutDashboard, PlusCircle, Users, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HabitCard } from '@/components/habit-card';
import { FriendsFeed } from '@/components/friends-feed';
import { HabitCalendarDialog } from '@/components/habit-calendar-dialog';
import { AiCoach } from '@/components/ai-coach';
import { Achievements } from '@/components/achievements';
import { HabitAnalytics } from '@/components/habit-analytics';
import { MoodTracker } from '@/components/mood-tracker';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { buildShareReportText, type ReportRange, getReportRangeLabel } from '@/lib/habit-reports';
import type { HabitFriendRequest, HabitShareHabit, HabitShareUser } from '@/lib/types';

type HabitRow = {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  name: string;
  description: string | null;
  check_ins: string[] | null;
  cheers: number | null;
  is_shared: boolean | null;
  shared_with_ids: string[] | null;
  created_at: string;
  updated_at: string | null;
};

type FriendRequestRow = {
  id: string;
  requester_id: string;
  requester_name: string | null;
  requester_email: string | null;
  receiver_id: string;
  receiver_name: string | null;
  receiver_email: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
};

type ProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
};

function mapHabit(row: HabitRow): HabitShareHabit {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || '',
    userEmail: row.user_email || '',
    name: row.name,
    description: row.description || '',
    checkIns: row.check_ins || [],
    cheers: row.cheers || 0,
    isShared: Boolean(row.is_shared),
    sharedWithIds: row.shared_with_ids || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

function mapFriendRequest(row: FriendRequestRow): HabitFriendRequest {
  return {
    id: row.id,
    requesterId: row.requester_id,
    requesterName: row.requester_name || row.requester_email || 'User',
    requesterEmail: row.requester_email || '',
    receiverId: row.receiver_id,
    receiverName: row.receiver_name || row.receiver_email || 'User',
    receiverEmail: row.receiver_email || '',
    status: row.status,
    createdAt: row.created_at,
  };
}

export default function Dashboard() {
  const { user, currentUser, loading: authLoading, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = React.useState('habits');
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isShareReportOpen, setIsShareReportOpen] = React.useState(false);
  const [reportRange, setReportRange] = React.useState<ReportRange>('weekly');
  const [selectedHabitId, setSelectedHabitId] = React.useState<string | null>(null);
  const [newHabitName, setNewHabitName] = React.useState('');
  const [newHabitDesc, setNewHabitDesc] = React.useState('');
  const [isNewShared, setIsNewShared] = React.useState(false);
  const [sharedWithIds, setSharedWithIds] = React.useState<string[]>([]);
  const [isSavingHabit, setIsSavingHabit] = React.useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = React.useState(true);
  const [myHabits, setMyHabits] = React.useState<HabitShareHabit[]>([]);
  const [friendHabits, setFriendHabits] = React.useState<HabitShareHabit[]>([]);
  const [incomingRequests, setIncomingRequests] = React.useState<HabitFriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = React.useState<HabitFriendRequest[]>([]);
  const [acceptedSent, setAcceptedSent] = React.useState<HabitFriendRequest[]>([]);
  const [acceptedReceived, setAcceptedReceived] = React.useState<HabitFriendRequest[]>([]);

  const loadDashboardData = React.useCallback(async () => {
    if (!user) {
      setMyHabits([]);
      setFriendHabits([]);
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setAcceptedSent([]);
      setAcceptedReceived([]);
      setIsDashboardLoading(false);
      return;
    }

    setIsDashboardLoading(true);

    try {
      const [
        myHabitsResult,
        sharedHabitsResult,
        incomingResult,
        outgoingResult,
        acceptedSentResult,
        acceptedReceivedResult,
      ] = await Promise.all([
        supabase.from('habit_share_habits').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('habit_share_habits').select('*').contains('shared_with_ids', [user.id]).eq('is_shared', true),
        supabase.from('habit_friend_requests').select('*').eq('receiver_id', user.id).eq('status', 'pending').order('created_at', { ascending: false }),
        supabase.from('habit_friend_requests').select('*').eq('requester_id', user.id).eq('status', 'pending').order('created_at', { ascending: false }),
        supabase.from('habit_friend_requests').select('*').eq('requester_id', user.id).eq('status', 'accepted').order('created_at', { ascending: false }),
        supabase.from('habit_friend_requests').select('*').eq('receiver_id', user.id).eq('status', 'accepted').order('created_at', { ascending: false }),
      ]);

      if (myHabitsResult.error) throw myHabitsResult.error;
      if (sharedHabitsResult.error) throw sharedHabitsResult.error;
      if (incomingResult.error) throw incomingResult.error;
      if (outgoingResult.error) throw outgoingResult.error;
      if (acceptedSentResult.error) throw acceptedSentResult.error;
      if (acceptedReceivedResult.error) throw acceptedReceivedResult.error;

      setMyHabits((myHabitsResult.data || []).map((row) => mapHabit(row as HabitRow)));
      setFriendHabits(
        (sharedHabitsResult.data || [])
          .map((row) => mapHabit(row as HabitRow))
          .filter((habit) => habit.userId !== user.id),
      );
      setIncomingRequests((incomingResult.data || []).map((row) => mapFriendRequest(row as FriendRequestRow)));
      setOutgoingRequests((outgoingResult.data || []).map((row) => mapFriendRequest(row as FriendRequestRow)));
      setAcceptedSent((acceptedSentResult.data || []).map((row) => mapFriendRequest(row as FriendRequestRow)));
      setAcceptedReceived((acceptedReceivedResult.data || []).map((row) => mapFriendRequest(row as FriendRequestRow)));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: 'Load failed',
        description: 'Could not load your habit dashboard from Supabase.',
        variant: 'destructive',
      });
    } finally {
      setIsDashboardLoading(false);
    }
  }, [toast, user]);

  React.useEffect(() => {
    if (!authLoading) {
      loadDashboardData();
    }
  }, [authLoading, loadDashboardData]);

  const friends = React.useMemo(() => {
    const allAccepted = [...acceptedSent, ...acceptedReceived];
    const unique = new Map<string, HabitShareUser>();

    allAccepted.forEach((request) => {
      const isRequester = request.requesterId === user?.id;
      const id = isRequester ? request.receiverId : request.requesterId;
      const name = isRequester
        ? request.receiverName || request.receiverEmail || 'Friend'
        : request.requesterName || request.requesterEmail || 'Friend';
      const email = isRequester ? request.receiverEmail || '' : request.requesterEmail || '';
      const avatarText = name.charAt(0).toUpperCase() || 'F';

      unique.set(id, {
        id,
        name,
        email,
        avatarUrl: `https://placehold.co/100x100/e0e7ff/4f46e5?text=${avatarText}`,
      });
    });

    return Array.from(unique.values());
  }, [acceptedReceived, acceptedSent, user?.id]);

  const toggleCheckIn = async (habitId: string, dateStr: string) => {
    const habit = myHabits.find((item) => item.id === habitId);
    if (!habit) return;

    const nextCheckIns = habit.checkIns.includes(dateStr)
      ? habit.checkIns.filter((entry) => entry !== dateStr)
      : [...habit.checkIns, dateStr];

    const { error } = await supabase
      .from('habit_share_habits')
      .update({
        check_ins: nextCheckIns,
        updated_at: new Date().toISOString(),
      })
      .eq('id', habitId);

    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      return;
    }

    await loadDashboardData();
  };

  const handleCheer = async (habitId: string) => {
    const habit = friendHabits.find((item) => item.id === habitId);
    const currentCheers = habit?.cheers || 0;

    const { error } = await supabase
      .from('habit_share_habits')
      .update({
        cheers: currentCheers + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', habitId);

    if (error) {
      toast({ title: 'Cheer failed', description: error.message, variant: 'destructive' });
      return;
    }

    await loadDashboardData();
  };

  const handleAddFriend = async (rawEmail: string) => {
    if (!user) return;

    const email = rawEmail.toLowerCase().trim();
    if (email === (user.email || '').toLowerCase()) {
      toast({ title: 'Invalid Action', description: 'You cannot send request to yourself.', variant: 'destructive' });
      return;
    }

    const { data: target, error: targetError } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url')
      .eq('email', email)
      .limit(1)
      .maybeSingle();

    if (targetError) {
      toast({ title: 'Lookup Failed', description: targetError.message, variant: 'destructive' });
      return;
    }

    if (!target) {
      toast({ title: 'User Not Found', description: 'No Supabase user exists with this email.', variant: 'destructive' });
      return;
    }

    const alreadyConnectedOrRequested = [...incomingRequests, ...outgoingRequests, ...acceptedSent, ...acceptedReceived].some(
      (request) =>
        (request.requesterId === user.id && request.receiverId === target.id) ||
        (request.requesterId === target.id && request.receiverId === user.id),
    );

    if (alreadyConnectedOrRequested) {
      toast({ title: 'Already Connected', description: 'Request already exists or user is already your friend.' });
      return;
    }

    const requestDoc = {
      id: `${user.id}_${target.id}_${Date.now()}`,
      requester_id: user.id,
      requester_name: currentUser?.name || user.email || 'User',
      requester_email: user.email || '',
      receiver_id: target.id,
      receiver_name: target.name || email.split('@')[0],
      receiver_email: target.email || email,
      status: 'pending' as const,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('habit_friend_requests').insert(requestDoc);
    if (error) {
      toast({ title: 'Request Failed', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Request Sent', description: `Friend request sent to ${requestDoc.receiver_name}.` });
    await loadDashboardData();
  };

  const handleAcceptRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('habit_friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (error) {
      toast({ title: 'Accept failed', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Request Accepted', description: 'You are now friends.' });
    await loadDashboardData();
  };

  const handleRejectRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('habit_friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) {
      toast({ title: 'Reject failed', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Request Declined' });
    await loadDashboardData();
  };

  const toggleSharedWithFriend = (friendId: string) => {
    setSharedWithIds((prev) => (prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]));
  };

  const saveHabit = async () => {
    if (!user || !newHabitName.trim()) {
      toast({
        title: 'Missing details',
        description: 'Please enter a habit name before saving.',
        variant: 'destructive',
      });
      return;
    }

    const ownerName =
      currentUser?.name?.trim() ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'User';
    const selectedFriendIds = isNewShared ? sharedWithIds.filter(Boolean) : [];
    const shouldShare = selectedFriendIds.length > 0;

    setIsSavingHabit(true);

    try {
      const habitDoc = {
        id: `habit_${Date.now()}`,
        user_id: user.id,
        user_name: ownerName,
        user_email: user.email || '',
        name: newHabitName.trim(),
        description: newHabitDesc.trim(),
        check_ins: [] as string[],
        is_shared: shouldShare,
        shared_with_ids: selectedFriendIds,
        cheers: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('habit_share_habits').insert(habitDoc);
      if (error) throw error;

      setNewHabitName('');
      setNewHabitDesc('');
      setIsNewShared(false);
      setSharedWithIds([]);
      setIsAddOpen(false);
      toast({
        title: 'Habit Added',
        description: shouldShare ? 'Your habit has been saved and shared with friends.' : 'Your habit has been saved.',
      });
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to save habit:', error);
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'We could not save this habit. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingHabit(false);
    }
  };

  const shareReport = async (range: ReportRange) => {
    const summaryText = buildShareReportText(myHabits, currentDate, range);

    try {
      await navigator.clipboard.writeText(summaryText);
      toast({
        title: 'Report copied',
        description: 'The report summary has been copied to your clipboard.',
      });
    } catch {
      // Clipboard access can fail in some browsers or contexts.
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(summaryText)}`, '_blank', 'noopener,noreferrer');
  };

  const reportOptions: { key: ReportRange; label: string; description: string }[] = [
    { key: 'daily', label: 'Daily', description: "Today's habits" },
    { key: 'weekly', label: 'Weekly', description: 'Last 7 days' },
    { key: 'monthly', label: 'Monthly', description: 'This month' },
    { key: 'yearly', label: 'Yearly', description: 'This year' },
  ];

  const getCombinedHabits = () => [...myHabits, ...friendHabits];
  const selectedHabit = selectedHabitId ? getCombinedHabits().find((habit) => habit.id === selectedHabitId) || null : null;

  React.useEffect(() => {
    if (user) {
      refreshProfile().catch((error) => console.error('Failed to refresh profile:', error));
    }
  }, [refreshProfile, user]);

  return (
    <div className="flex flex-col min-h-screen w-full p-2 sm:p-4 lg:p-6 space-y-8 animate-in fade-in duration-1000">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2.5 rounded-2xl shadow-xl shadow-primary/20 transform hover:rotate-12 transition-transform">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-500 to-purple-600">
              Habit Share
            </h1>
          </div>
          <p className="text-sm font-bold text-slate-500 mt-2">
            Welcome back, <span className="text-primary font-black uppercase tracking-tight">{currentUser?.name || 'Explorer'}</span>!
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button onClick={() => setIsAddOpen(true)} className="rounded-2xl h-14 shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1 transition-all bg-primary px-8 font-black text-lg">
            <PlusCircle className="h-6 w-6 mr-2" /> New Habit
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 rounded-[28px] border border-white/70 bg-white/70 p-4 shadow-xl shadow-slate-100/60 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">Insight Center</h2>
                <p className="text-sm font-medium text-slate-500">Switch the report scope to review daily, monthly, or yearly consistency.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {reportOptions.map((option) => (
                  <Button
                    key={option.key}
                    type="button"
                    variant={reportRange === option.key ? 'default' : 'outline'}
                    className="rounded-full px-4"
                    onClick={() => setReportRange(option.key)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <HabitAnalytics habits={myHabits} currentDate={currentDate} range={reportRange} />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white/70 backdrop-blur-md border border-slate-200/50 p-1.5 rounded-[24px] mb-8 shadow-xl shadow-slate-100/50">
              <TabsTrigger value="habits" className="rounded-[18px] px-8 py-3 text-sm font-black data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                <LayoutDashboard className="h-4 w-4 mr-2" /> DASHBOARD
              </TabsTrigger>
              <TabsTrigger value="friends" className="rounded-[18px] px-8 py-3 text-sm font-black data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all">
                <Users className="h-4 w-4 mr-2" /> FRIENDS
              </TabsTrigger>
            </TabsList>

            <TabsContent value="habits" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Active Habits</h2>
                  <div className="flex items-center gap-1 bg-white/90 backdrop-blur rounded-2xl p-1.5 border border-slate-200/80 shadow-sm">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setCurrentDate(subDays(currentDate, 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-black min-w-[80px] text-center tracking-widest">{isSameDay(currentDate, new Date()) ? 'TODAY' : format(currentDate, 'MMM d').toUpperCase()}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setCurrentDate(addDays(currentDate, 1))} disabled={isSameDay(currentDate, new Date())}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button onClick={() => setIsShareReportOpen(true)} variant="outline" className="rounded-2xl bg-green-50/50 text-green-700 border-green-200/50 font-black h-11">
                  <MessageCircle className="h-4 w-4 mr-2" /> REPORTS
                </Button>
              </div>

              {isDashboardLoading ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white/40 p-10 text-center text-slate-500">
                  Loading your Supabase habits...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myHabits.map((habit) => (
                    <HabitCard key={habit.id} habit={habit} onToggleCheckIn={toggleCheckIn} currentDate={currentDate} onViewDetails={setSelectedHabitId} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="friends">
              <FriendsFeed
                friends={friends}
                friendHabits={friendHabits}
                incomingRequests={incomingRequests}
                outgoingRequests={outgoingRequests}
                currentUserEmail={user?.email || ''}
                onAddFriend={handleAddFriend}
                onAcceptRequest={handleAcceptRequest}
                onRejectRequest={handleRejectRequest}
                onCheer={handleCheer}
                currentDate={currentDate}
                onViewDetails={setSelectedHabitId}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <MoodTracker />
          <AiCoach habit={myHabits[0]} />
          <Achievements habits={myHabits} />
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md rounded-[40px] border-none shadow-3xl p-8">
          <DialogTitle className="text-3xl font-black tracking-tight mb-4">Create Habit</DialogTitle>
          <div className="space-y-6 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400 ml-1 tracking-widest">HABIT NAME</Label>
              <Input value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} placeholder="e.g. Morning Run" className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400 ml-1 tracking-widest">DESCRIPTION</Label>
              <Input value={newHabitDesc} onChange={(e) => setNewHabitDesc(e.target.value)} placeholder="Keep it short..." className="h-14 rounded-2xl bg-slate-50 border-none font-medium" />
            </div>

            <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox id="share-habit" checked={isNewShared} onCheckedChange={(value) => setIsNewShared(Boolean(value))} />
                <Label htmlFor="share-habit" className="font-semibold">Share this habit with selected friends</Label>
              </div>
              {isNewShared ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {friends.length === 0 ? <p className="text-sm text-slate-500">No accepted friends yet.</p> : null}
                  {friends.map((friend) => (
                    <div key={friend.id} className="flex items-center gap-3">
                      <Checkbox id={`friend-${friend.id}`} checked={sharedWithIds.includes(friend.id)} onCheckedChange={() => toggleSharedWithFriend(friend.id)} />
                      <Label htmlFor={`friend-${friend.id}`} className="font-medium">{friend.name} ({friend.email})</Label>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <DialogFooter className="mt-8 flex justify-between gap-4">
            <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-2xl h-12 font-black text-slate-400">Cancel</Button>
            <Button onClick={saveHabit} disabled={isSavingHabit} className="rounded-2xl h-12 bg-primary font-black px-10 shadow-xl shadow-primary/20 disabled:opacity-70">
              {isSavingHabit ? 'SAVING...' : 'SAVE HABIT'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isShareReportOpen} onOpenChange={setIsShareReportOpen}>
        <DialogContent className="sm:max-w-md rounded-[40px] border-none p-8">
          <DialogTitle className="text-3xl font-black flex items-center gap-3">
            <MessageCircle className="h-8 w-8 text-green-500" />
            Reports
          </DialogTitle>
          <div className="grid gap-4 py-6">
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Selected range</p>
              <p className="mt-2 text-xl font-black text-slate-900">{reportOptions.find((option) => option.key === reportRange)?.label} report</p>
              <p className="text-sm font-medium text-slate-500">{getReportRangeLabel(reportRange, currentDate)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {reportOptions.map((option) => (
                <Button
                  key={option.key}
                  onClick={() => setReportRange(option.key)}
                  variant={reportRange === option.key ? 'default' : 'outline'}
                  className="h-16 rounded-[22px] border-slate-100 p-4 justify-start font-black text-lg"
                >
                  <span className="flex flex-col items-start">
                    <span>{option.label}</span>
                    <span className="text-xs font-semibold opacity-80">{option.description}</span>
                  </span>
                </Button>
              ))}
            </div>

            <Button onClick={() => shareReport(reportRange)} className="h-14 rounded-[22px] font-black text-base bg-green-600 hover:bg-green-700">
              <MessageCircle className="h-4 w-4 mr-2" />
              Share report
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <HabitCalendarDialog isOpen={!!selectedHabitId} onClose={() => setSelectedHabitId(null)} habit={selectedHabit} />
    </div>
  );
}
