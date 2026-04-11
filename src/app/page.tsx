'use client';

import * as React from 'react';
import { format, subDays, addDays, isSameDay } from 'date-fns';
import { CheckCircle2, LayoutDashboard, PlusCircle, Users, ChevronLeft, ChevronRight, MessageCircle, Sparkles, Flame, Target, Trophy, Wand2, ArrowRight, Lock, Share2, Rocket, Check, Compass, ShieldCheck, PlayCircle } from 'lucide-react';
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
import { GratitudeStudio } from '@/components/gratitude-studio';
import { GratitudeFeed } from '@/components/gratitude-feed';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { buildShareReportText, type ReportRange, getReportRangeLabel } from '@/lib/habit-reports';
import { buildGratitudeShareText } from '@/lib/gratitude-reports';
import type { GratitudeEntry, HabitFriendRequest, HabitShareHabit, HabitShareUser } from '@/lib/types';

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

type GratitudeRow = {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  content: string;
  entry_date: string;
  is_shared: boolean | null;
  shared_with_ids: string[] | null;
  created_at: string;
  updated_at: string | null;
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

function mapGratitude(row: GratitudeRow): GratitudeEntry {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || '',
    userEmail: row.user_email || '',
    content: row.content,
    entryDate: row.entry_date,
    isShared: Boolean(row.is_shared),
    sharedWithIds: row.shared_with_ids || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

export default function Dashboard() {
  const { user, currentUser, loading: authLoading, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = React.useState('habits');
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [createHabitStep, setCreateHabitStep] = React.useState<0 | 1 | 2>(0);
  const [isShareReportOpen, setIsShareReportOpen] = React.useState(false);
  const [reportRange, setReportRange] = React.useState<ReportRange>('weekly');
  const [selectedHabitId, setSelectedHabitId] = React.useState<string | null>(null);
  const [isOnboardingDismissed, setIsOnboardingDismissed] = React.useState(false);
  const [newHabitName, setNewHabitName] = React.useState('');
  const [newHabitDesc, setNewHabitDesc] = React.useState('');
  const [isNewShared, setIsNewShared] = React.useState(false);
  const [sharedWithIds, setSharedWithIds] = React.useState<string[]>([]);
  const [isSavingHabit, setIsSavingHabit] = React.useState(false);
  const [gratitudeDraft, setGratitudeDraft] = React.useState('');
  const [gratitudeRange, setGratitudeRange] = React.useState<ReportRange>('weekly');
  const [isGratitudeShared, setIsGratitudeShared] = React.useState(false);
  const [gratitudeSharedWithIds, setGratitudeSharedWithIds] = React.useState<string[]>([]);
  const [isGratitudeReportOpen, setIsGratitudeReportOpen] = React.useState(false);
  const [isSavingGratitude, setIsSavingGratitude] = React.useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = React.useState(true);
  const [myHabits, setMyHabits] = React.useState<HabitShareHabit[]>([]);
  const [friendHabits, setFriendHabits] = React.useState<HabitShareHabit[]>([]);
  const [myGratitudeEntries, setMyGratitudeEntries] = React.useState<GratitudeEntry[]>([]);
  const [friendGratitudeEntries, setFriendGratitudeEntries] = React.useState<GratitudeEntry[]>([]);
  const [incomingRequests, setIncomingRequests] = React.useState<HabitFriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = React.useState<HabitFriendRequest[]>([]);
  const [acceptedSent, setAcceptedSent] = React.useState<HabitFriendRequest[]>([]);
  const [acceptedReceived, setAcceptedReceived] = React.useState<HabitFriendRequest[]>([]);

  const quickTemplates = [
    { name: 'Morning Walk', description: '20-minute outdoor reset' },
    { name: 'Deep Focus', description: '25 minutes distraction free' },
    { name: 'Reading Sprint', description: '10 pages before bed' },
  ];

  const onboardingCards = [
    {
      title: 'Create your first anchor habit',
      description: 'Start with one tiny repeatable routine that feels impossible to miss.',
      icon: Target,
    },
    {
      title: 'Connect one accountability friend',
      description: 'Invite a trusted person so progress becomes visible and social.',
      icon: Users,
    },
    {
      title: 'Protect momentum with reports',
      description: 'Use daily, monthly, and yearly trends to keep the streak real.',
      icon: ShieldCheck,
    },
  ] as const;

  const createHabitSteps = [
    { title: 'Identity', caption: 'Name the routine' },
    { title: 'Sharing', caption: 'Choose accountability' },
    { title: 'Review', caption: 'Launch your streak' },
  ] as const;

  const loadDashboardData = React.useCallback(async () => {
    if (!user) {
      setMyHabits([]);
      setFriendHabits([]);
      setMyGratitudeEntries([]);
      setFriendGratitudeEntries([]);
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
        myGratitudeResult,
        sharedGratitudeResult,
        incomingResult,
        outgoingResult,
        acceptedSentResult,
        acceptedReceivedResult,
      ] = await Promise.all([
        supabase.from('habit_share_habits').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('habit_share_habits').select('*').contains('shared_with_ids', [user.id]).eq('is_shared', true),
        supabase.from('habit_gratitude_entries').select('*').eq('user_id', user.id).order('entry_date', { ascending: false }),
        supabase.from('habit_gratitude_entries').select('*').contains('shared_with_ids', [user.id]).eq('is_shared', true).order('entry_date', { ascending: false }),
        supabase.from('habit_friend_requests').select('*').eq('receiver_id', user.id).eq('status', 'pending').order('created_at', { ascending: false }),
        supabase.from('habit_friend_requests').select('*').eq('requester_id', user.id).eq('status', 'pending').order('created_at', { ascending: false }),
        supabase.from('habit_friend_requests').select('*').eq('requester_id', user.id).eq('status', 'accepted').order('created_at', { ascending: false }),
        supabase.from('habit_friend_requests').select('*').eq('receiver_id', user.id).eq('status', 'accepted').order('created_at', { ascending: false }),
      ]);

      if (myHabitsResult.error) throw myHabitsResult.error;
      if (sharedHabitsResult.error) throw sharedHabitsResult.error;
      if (myGratitudeResult.error) throw myGratitudeResult.error;
      if (sharedGratitudeResult.error) throw sharedGratitudeResult.error;
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
      setMyGratitudeEntries((myGratitudeResult.data || []).map((row) => mapGratitude(row as GratitudeRow)));
      setFriendGratitudeEntries(
        (sharedGratitudeResult.data || [])
          .map((row) => mapGratitude(row as GratitudeRow))
          .filter((entry) => entry.userId !== user.id),
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

  React.useEffect(() => {
    const stored = window.localStorage.getItem('habitshare:onboarding-dismissed');
    if (stored === 'true') {
      setIsOnboardingDismissed(true);
    }
  }, []);

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

  const toggleGratitudeFriend = (friendId: string) => {
    setGratitudeSharedWithIds((prev) => (prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]));
  };

  const resetCreateHabitFlow = React.useCallback(() => {
    setCreateHabitStep(0);
    setNewHabitName('');
    setNewHabitDesc('');
    setIsNewShared(false);
    setSharedWithIds([]);
  }, []);

  const closeCreateHabitDialog = React.useCallback((open: boolean) => {
    setIsAddOpen(open);
    if (!open) {
      resetCreateHabitFlow();
    }
  }, [resetCreateHabitFlow]);

  const openCreateHabitDialog = React.useCallback((template?: { name: string; description: string }) => {
    if (template) {
      setNewHabitName(template.name);
      setNewHabitDesc(template.description);
      setCreateHabitStep(1);
    } else {
      setCreateHabitStep(0);
      setNewHabitName('');
      setNewHabitDesc('');
      setIsNewShared(false);
      setSharedWithIds([]);
    }
    setIsAddOpen(true);
  }, []);

  const handleCreateNext = () => {
    if (createHabitStep === 0 && !newHabitName.trim()) {
      toast({
        title: 'Name your habit',
        description: 'Give this routine a clear name so we can build the plan around it.',
        variant: 'destructive',
      });
      return;
    }
    setCreateHabitStep((prev) => Math.min(prev + 1, 2) as 0 | 1 | 2);
  };

  const handleCreateBack = () => {
    setCreateHabitStep((prev) => Math.max(prev - 1, 0) as 0 | 1 | 2);
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

      closeCreateHabitDialog(false);
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
  const totalCheckIns = myHabits.reduce((sum, habit) => sum + habit.checkIns.length, 0);
  const longestStreak = myHabits.reduce((best, habit) => Math.max(best, habit.checkIns.length), 0);
  const sharedCount = myHabits.filter((habit) => habit.isShared).length;
  const gratitudeTodayKey = format(currentDate, 'yyyy-MM-dd');
  const gratitudeEntryForDate = myGratitudeEntries.find((entry) => entry.entryDate === gratitudeTodayKey);
  const selectedShareFriends = friends.filter((friend) => sharedWithIds.includes(friend.id));
  const shouldShowOnboarding =
    !isOnboardingDismissed &&
    !isDashboardLoading &&
    myHabits.length === 0 &&
    friends.length === 0 &&
    incomingRequests.length === 0 &&
    outgoingRequests.length === 0;

  React.useEffect(() => {
    if (user) {
      refreshProfile().catch((error) => console.error('Failed to refresh profile:', error));
    }
  }, [refreshProfile, user]);

  React.useEffect(() => {
    if (!gratitudeEntryForDate) {
      setGratitudeDraft('');
      setIsGratitudeShared(false);
      setGratitudeSharedWithIds([]);
      return;
    }

    setGratitudeDraft(gratitudeEntryForDate.content);
    setIsGratitudeShared(gratitudeEntryForDate.isShared);
    setGratitudeSharedWithIds(gratitudeEntryForDate.sharedWithIds || []);
  }, [gratitudeEntryForDate]);

  const saveGratitude = async () => {
    if (!user || !gratitudeDraft.trim()) {
      toast({
        title: 'Write gratitude first',
        description: 'Add a few lines before saving your gratitude entry.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingGratitude(true);
    try {
      const ownerName =
        currentUser?.name?.trim() ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'User';
      const selectedFriendIds = isGratitudeShared ? gratitudeSharedWithIds.filter(Boolean) : [];
      const payload = {
        id: gratitudeEntryForDate?.id || `gratitude_${Date.now()}`,
        user_id: user.id,
        user_name: ownerName,
        user_email: user.email || '',
        content: gratitudeDraft.trim(),
        entry_date: gratitudeTodayKey,
        is_shared: selectedFriendIds.length > 0,
        shared_with_ids: selectedFriendIds,
        created_at: gratitudeEntryForDate?.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (gratitudeEntryForDate) {
        const { error } = await supabase.from('habit_gratitude_entries').update(payload).eq('id', gratitudeEntryForDate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('habit_gratitude_entries').insert(payload);
        if (error) throw error;
      }

      toast({
        title: gratitudeEntryForDate ? 'Gratitude updated' : 'Gratitude saved',
        description: selectedFriendIds.length > 0 ? 'Your gratitude has been saved and shared.' : 'Your gratitude has been saved privately.',
      });
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to save gratitude:', error);
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'We could not save your gratitude right now.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingGratitude(false);
    }
  };

  const shareGratitudeWhatsApp = () => {
    const text = gratitudeDraft.trim()
      ? `Today I'm grateful for:\n${gratitudeDraft.trim()}`
      : buildGratitudeShareText(myGratitudeEntries, currentDate, gratitudeRange);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col space-y-6 p-2 animate-in fade-in duration-1000 sm:p-4 lg:space-y-8 lg:p-6">
      <div className="hero-orb left-8 top-20 h-32 w-32 bg-violet-300/50" />
      <div className="hero-orb right-20 top-24 h-36 w-36 bg-sky-300/40" />

      <header className="glass-panel relative overflow-hidden rounded-[30px] p-5 sm:p-6">
        <div className="absolute inset-y-0 right-0 w-[34%] bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_58%)]" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-950/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.35em] text-slate-500">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Premium habit operating system
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary p-2.5 shadow-xl shadow-primary/20 transition-transform hover:rotate-12">
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
              <h1 className="bg-gradient-to-r from-slate-900 via-primary to-sky-500 bg-clip-text text-3xl font-black tracking-tighter text-transparent sm:text-4xl">
                Habit Share
              </h1>
            </div>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600 sm:text-base">
              Build disciplined routines, stay accountable with friends, and turn your daily consistency into something that feels premium.
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-500 sm:text-sm sm:tracking-normal">
              Welcome back, <span className="text-primary font-black uppercase tracking-tight">{currentUser?.name || 'Explorer'}</span>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[430px]">
            <div className="rounded-[22px] bg-white/80 p-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Habits</span>
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">{myHabits.length}</div>
            </div>
            <div className="rounded-[22px] bg-white/80 p-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Check-ins</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">{totalCheckIns}</div>
            </div>
            <div className="rounded-[22px] bg-white/80 p-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Best streak</span>
                <Flame className="h-4 w-4 text-amber-500" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">{longestStreak}</div>
            </div>
            <div className="rounded-[22px] bg-white/80 p-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Shared</span>
                <Trophy className="h-4 w-4 text-sky-500" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">{sharedCount}</div>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="glass-panel rounded-[30px] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Quick Start Templates</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Launch a polished routine in one tap and customize it later.</p>
            </div>
            <Wand2 className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {quickTemplates.map((template) => (
              <button
                key={template.name}
                type="button"
                onClick={() => openCreateHabitDialog(template)}
                className="rounded-[24px] border border-white/70 bg-white/85 p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="text-sm font-black text-slate-900">{template.name}</div>
                <div className="mt-2 text-sm font-medium text-slate-500">{template.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[30px] p-5">
          <div className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400">Focus prompt</div>
          <h3 className="mt-3 text-2xl font-black text-slate-900">Protect your streak with a habit that feels too easy to skip.</h3>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
            High-growth users keep one minimum version for every routine. On low-energy days, do that version and keep the chain alive.
          </p>
          <Button onClick={() => openCreateHabitDialog()} className="mt-5 h-12 rounded-2xl bg-slate-900 px-5 font-black text-white hover:bg-slate-800">
            <PlusCircle className="mr-2 h-4 w-4" />
            Start a fresh habit
          </Button>
        </div>
      </section>

      <section className="glass-panel rounded-[30px] border border-white/70 bg-gradient-to-br from-slate-950/5 via-white/70 to-slate-950/10 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.35em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Premium experience
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">A premium routine experience, designed to feel luxurious and effortless.</h2>
            <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-600">
              Get fast access to the best habit patterns, rich accountability insights, and a cleaner dashboard that makes progress feel meaningful every day.
            </p>
          </div>
          <Button onClick={() => openCreateHabitDialog()} className="h-12 rounded-2xl bg-slate-950 px-6 font-black text-white shadow-xl shadow-slate-950/20 hover:bg-slate-800">
            <Rocket className="mr-2 h-4 w-4" />
            Explore premium flow
          </Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Wand2 className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-black text-slate-900">Premium habit recipes</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Launch better routines with curated templates and structure that help you win the day.</p>
          </div>
          <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-black text-slate-900">Shared streak clubs</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Invite friends and turn accountability into a premium social momentum loop.</p>
          </div>
          <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-black text-slate-900">Insights that matter</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Focus on your highest-impact habits with analytics built for consistency, not complexity.</p>
          </div>
        </div>
      </section>

      {shouldShowOnboarding ? (
        <section className="glass-panel relative overflow-hidden rounded-[32px] p-5 sm:p-6">
          <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.14),transparent_60%)]" />
          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] text-primary">
                  <Compass className="h-3.5 w-3.5" />
                  First-time onboarding
                </div>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Let&apos;s turn this into a habit system you&apos;ll actually keep.</h2>
                <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-500">
                  You&apos;re one guided setup away from a premium accountability flow. Start with a tiny anchor routine, then layer in friends and reports as the streak grows.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => openCreateHabitDialog()} className="h-12 rounded-2xl px-5 font-black shadow-xl shadow-primary/20">
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Start onboarding
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsOnboardingDismissed(true);
                    window.localStorage.setItem('habitshare:onboarding-dismissed', 'true');
                  }}
                  className="h-12 rounded-2xl font-black text-slate-500"
                >
                  Skip for now
                </Button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {onboardingCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="rounded-[26px] border border-white/80 bg-white/80 p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-md">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300">0{index + 1}</div>
                    </div>
                    <h3 className="mt-5 text-lg font-black text-slate-900">{card.title}</h3>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{card.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-8 grid h-auto grid-cols-2 gap-2 rounded-[28px] border border-slate-200/60 bg-white/75 p-2 shadow-xl shadow-slate-100/50 backdrop-blur-xl">
              <TabsTrigger value="habits" className="group rounded-[20px] px-4 py-4 text-sm font-black transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-[0_18px_40px_-18px_rgba(79,70,229,0.7)]">
                <LayoutDashboard className="h-4 w-4 mr-2" /> DASHBOARD
              </TabsTrigger>
              <TabsTrigger value="friends" className="group rounded-[20px] px-4 py-4 text-sm font-black transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-sky-500 data-[state=active]:text-white data-[state=active]:shadow-[0_18px_40px_-18px_rgba(59,130,246,0.75)]">
                <Users className="h-4 w-4 mr-2" /> FRIENDS
              </TabsTrigger>
            </TabsList>

            <TabsContent value="habits" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
              ) : myHabits.length === 0 ? (
                <div className="rounded-[32px] border border-dashed border-slate-200 bg-white/70 p-6 shadow-sm sm:p-8">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-xl">
                      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] text-primary">
                        <Rocket className="h-3.5 w-3.5" />
                        First habit launch
                      </div>
                      <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-900">Your dashboard is ready for its first streak.</h3>
                      <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
                        Start with one routine that feels lightweight enough to repeat daily. We&apos;ll turn it into momentum, analytics, and social accountability.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:min-w-[240px]">
                      <Button onClick={() => openCreateHabitDialog()} className="h-12 rounded-2xl font-black">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Build first habit
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => openCreateHabitDialog(quickTemplates[0])}
                        className="h-12 rounded-2xl border-slate-200 bg-white/85 font-black"
                      >
                        Use starter template
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="-mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto px-2 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0">
                  {myHabits.map((habit) => (
                    <div key={habit.id} className="min-w-[88%] snap-start md:min-w-0">
                      <HabitCard habit={habit} onToggleCheckIn={toggleCheckIn} currentDate={currentDate} onViewDetails={setSelectedHabitId} />
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-[28px] border border-white/70 bg-white/70 p-4 shadow-xl shadow-slate-100/60 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-900">Insight Center</h2>
                    <p className="text-sm font-medium text-slate-500">Review consistency after your habit list so action comes before analysis.</p>
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

              <GratitudeStudio
                entries={myGratitudeEntries}
                currentDate={currentDate}
                range={gratitudeRange}
                friends={friends}
                draft={gratitudeDraft}
                isShared={isGratitudeShared}
                sharedWithIds={gratitudeSharedWithIds}
                isReportOpen={isGratitudeReportOpen}
                isSaving={isSavingGratitude}
                onDraftChange={setGratitudeDraft}
                onToggleShared={setIsGratitudeShared}
                onToggleFriend={toggleGratitudeFriend}
                onToggleReportOpen={() => setIsGratitudeReportOpen((open) => !open)}
                onRangeChange={setGratitudeRange}
                onSave={saveGratitude}
                onShareWhatsApp={shareGratitudeWhatsApp}
              />
            </TabsContent>

            <TabsContent value="friends" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="space-y-6">
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
                <GratitudeFeed entries={friendGratitudeEntries} />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <MoodTracker />
          <AiCoach habit={myHabits[0]} />
          <Achievements habits={myHabits} />
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={closeCreateHabitDialog}>
        <DialogContent className="max-w-[96vw] overflow-hidden rounded-[34px] border-none p-0 shadow-[0_30px_120px_rgba(15,23,42,0.25)] sm:max-w-2xl">
          <div className="relative bg-[linear-gradient(180deg,rgba(244,247,255,0.98),rgba(255,255,255,0.98))]">
            <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.22),transparent_72%)]" />
            <div className="relative flex max-h-[90vh] flex-col">
              <div className="border-b border-white/70 px-5 pb-5 pt-6 sm:px-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-950/5 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Guided builder
                    </div>
                    <DialogTitle className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Create Habit</DialogTitle>
                    <p className="mt-2 max-w-lg text-sm font-medium leading-6 text-slate-500">
                      Build a habit that feels premium from day one, then decide if it stays private or becomes a shared accountability ritual.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/75 px-4 py-3 shadow-sm">
                    <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Step</div>
                    <div className="mt-1 text-lg font-black text-slate-900">{createHabitStep + 1}/3</div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {createHabitSteps.map((step, index) => {
                    const isActive = createHabitStep === index;
                    const isDone = createHabitStep > index;
                    return (
                      <button
                        key={step.title}
                        type="button"
                        onClick={() => {
                          if (index <= createHabitStep || newHabitName.trim()) {
                            setCreateHabitStep(index as 0 | 1 | 2);
                          }
                        }}
                        className={`rounded-[24px] border px-4 py-4 text-left transition-all ${
                          isActive
                            ? 'border-primary bg-white shadow-lg shadow-primary/10'
                            : isDone
                              ? 'border-emerald-200 bg-emerald-50/80'
                              : 'border-white/70 bg-white/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {isDone ? <Check className="h-4 w-4" /> : index + 1}
                          </span>
                          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">{step.caption}</span>
                        </div>
                        <div className="mt-4 text-base font-black text-slate-900">{step.title}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
                {createHabitStep === 0 ? (
                  <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="space-y-2">
                        <Label className="ml-1 text-xs font-black uppercase tracking-widest text-slate-400">Habit name</Label>
                        <Input
                          value={newHabitName}
                          onChange={(e) => setNewHabitName(e.target.value)}
                          placeholder="Morning walk, reading sprint, deep work..."
                          className="h-14 rounded-2xl border-white/70 bg-white/85 text-base font-black shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="ml-1 text-xs font-black uppercase tracking-widest text-slate-400">Small promise</Label>
                        <textarea
                          value={newHabitDesc}
                          onChange={(e) => setNewHabitDesc(e.target.value)}
                          placeholder="Describe the smallest successful version of this habit."
                          className="min-h-[150px] w-full rounded-[24px] border border-white/70 bg-white/85 px-4 py-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-white/80 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-900/20 animate-in fade-in zoom-in-95 duration-500">
                      <div className="text-[11px] font-black uppercase tracking-[0.3em] text-white/45">Preview</div>
                      <div className="mt-5 rounded-[24px] bg-white/10 p-5 backdrop-blur">
                        <div className="text-2xl font-black">{newHabitName.trim() || 'Your next great habit'}</div>
                        <p className="mt-3 text-sm leading-6 text-white/70">
                          {newHabitDesc.trim() || 'Keep the first version light, repeatable, and easy to keep alive even on busy days.'}
                        </p>
                      </div>
                      <div className="mt-5 space-y-3 text-sm text-white/70">
                        <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
                          <Target className="h-4 w-4 text-violet-300" />
                          Easy habits scale faster than intense habits.
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
                          <Flame className="h-4 w-4 text-amber-300" />
                          We&apos;re optimizing for streak stability first.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {createHabitStep === 1 ? (
                  <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-[28px] border border-white/80 bg-white/80 p-5 shadow-sm animate-in fade-in slide-in-from-left-3 duration-500">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isNewShared ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {isNewShared ? <Share2 className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="text-lg font-black text-slate-900">{isNewShared ? 'Shared accountability' : 'Private launch'}</div>
                          <p className="text-sm font-medium text-slate-500">
                            {isNewShared ? 'Let friends see progress and cheer you on.' : 'Start privately and share later anytime.'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-5 rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-4">
                        <div className="flex items-center gap-3">
                          <Checkbox id="share-habit" checked={isNewShared} onCheckedChange={(value) => setIsNewShared(Boolean(value))} />
                          <Label htmlFor="share-habit" className="text-sm font-bold text-slate-800">
                            Share this habit with selected friends
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="animate-in fade-in slide-in-from-right-3 duration-500">
                      {isNewShared ? (
                        <div className="rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-lg font-black text-slate-900">Choose your circle</div>
                              <p className="mt-1 text-sm font-medium text-slate-500">Pick the people who should see this streak.</p>
                            </div>
                            <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
                              {selectedShareFriends.length} selected
                            </div>
                          </div>

                          {friends.length === 0 ? (
                            <div className="mt-5 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center">
                              <Users className="mx-auto h-10 w-10 text-slate-300" />
                              <div className="mt-4 text-base font-black text-slate-900">No accepted friends yet</div>
                              <p className="mt-2 text-sm font-medium text-slate-500">
                                You can still save this habit now and connect your accountability circle later from the Friends tab.
                              </p>
                            </div>
                          ) : (
                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                              {friends.map((friend) => {
                                const selected = sharedWithIds.includes(friend.id);
                                return (
                                  <button
                                    key={friend.id}
                                    type="button"
                                    onClick={() => toggleSharedWithFriend(friend.id)}
                                    className={`rounded-[24px] border p-4 text-left transition-all ${
                                      selected ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <div className="text-sm font-black text-slate-900">{friend.name}</div>
                                        <div className="mt-1 text-xs font-medium text-slate-500">{friend.email}</div>
                                      </div>
                                      <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${selected ? 'border-primary bg-primary text-white' : 'border-slate-300 text-transparent'}`}>
                                        <Check className="h-3.5 w-3.5" />
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-[28px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(241,245,255,0.82))] p-6 shadow-sm">
                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                            <Lock className="h-5 w-5" />
                          </div>
                          <h3 className="mt-4 text-xl font-black text-slate-900">Quiet start, strong foundation.</h3>
                          <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
                            Private habits are perfect when you want to build confidence first. Once it becomes natural, you can share it with friends in one tap.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {createHabitStep === 2 ? (
                  <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[30px] border border-slate-200/80 bg-white/90 p-6 shadow-sm animate-in fade-in slide-in-from-bottom-3 duration-500">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                          <Rocket className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Ready to launch</div>
                          <div className="text-2xl font-black tracking-tight text-slate-950">{newHabitName.trim() || 'Untitled habit'}</div>
                        </div>
                      </div>
                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-[24px] bg-slate-50 p-4">
                          <div className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Description</div>
                          <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
                            {newHabitDesc.trim() || 'No description yet. This habit will still be saved cleanly and can be refined later.'}
                          </p>
                        </div>
                        <div className="rounded-[24px] bg-slate-50 p-4">
                          <div className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Visibility</div>
                          <div className="mt-3 text-base font-black text-slate-900">{isNewShared && selectedShareFriends.length > 0 ? 'Shared with friends' : 'Private to you'}</div>
                          <p className="mt-2 text-sm font-medium text-slate-500">
                            {isNewShared && selectedShareFriends.length > 0
                              ? `${selectedShareFriends.length} friend${selectedShareFriends.length > 1 ? 's' : ''} will be able to follow along.`
                              : 'Only you will see this habit until you decide to share it.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[30px] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-900/25 animate-in fade-in zoom-in-95 duration-500">
                      <div className="text-[11px] font-black uppercase tracking-[0.3em] text-white/45">Launch checklist</div>
                      <div className="mt-5 space-y-3">
                        {[
                          `Habit is clearly named${newHabitName.trim() ? '' : ' - add a better title if you want a cleaner dashboard.'}`,
                          newHabitDesc.trim() ? 'Description gives this habit a practical floor.' : 'Description is optional, but adding one helps on low-motivation days.',
                          isNewShared && selectedShareFriends.length > 0 ? 'Accountability circle selected.' : 'Private mode keeps the first version simple.',
                        ].map((item) => (
                          <div key={item} className="flex items-start gap-3 rounded-[22px] bg-white/10 px-4 py-3">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                            <span className="text-sm font-medium leading-6 text-white/75">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <DialogFooter className="border-t border-white/70 bg-white/80 px-5 py-4 backdrop-blur sm:px-8">
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    variant="ghost"
                    onClick={createHabitStep === 0 ? () => closeCreateHabitDialog(false) : handleCreateBack}
                    className="h-12 rounded-2xl font-black text-slate-500"
                  >
                    {createHabitStep === 0 ? 'Cancel' : 'Back'}
                  </Button>
                  <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    {createHabitStep < 2 ? (
                      <Button onClick={handleCreateNext} className="h-12 rounded-2xl px-6 font-black shadow-xl shadow-primary/20">
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button onClick={saveHabit} disabled={isSavingHabit} className="h-12 rounded-2xl px-6 font-black shadow-xl shadow-primary/20 disabled:opacity-70">
                        {isSavingHabit ? 'Saving...' : 'Launch habit'}
                        {!isSavingHabit ? <Rocket className="ml-2 h-4 w-4" /> : null}
                      </Button>
                    )}
                  </div>
                </div>
              </DialogFooter>
            </div>
          </div>
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

      <Button
        onClick={() => openCreateHabitDialog()}
        className="fixed bottom-5 right-4 z-30 h-14 rounded-full px-5 font-black shadow-[0_20px_50px_-18px_rgba(79,70,229,0.9)] sm:hidden"
      >
        <PlusCircle className="mr-2 h-5 w-5" />
        New Habit
      </Button>
    </div>
  );
}
