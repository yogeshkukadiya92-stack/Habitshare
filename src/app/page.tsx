'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, LayoutDashboard, PlusCircle, Users, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { HabitShareHabit, HabitShareUser, HabitFriendRequest } from '@/lib/types';
import { HabitCard } from '@/components/habit-card';
import { FriendsFeed } from '@/components/friends-feed';
import { HabitCalendarDialog } from '@/components/habit-calendar-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, subDays, addDays, isSameDay } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/components/auth-provider';
import { AiCoach } from '@/components/ai-coach';
import { Achievements } from '@/components/achievements';
import { HabitAnalytics } from '@/components/habit-analytics';
import { MoodTracker } from '@/components/mood-tracker';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, getDocs, increment, limit, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { buildShareReportText, ReportRange, getReportRangeLabel } from '@/lib/habit-reports';

export default function Dashboard() {
  const { user, currentUser } = useAuth();
  const { toast } = useToast();
  const db = useFirestore();

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

  const myHabitsQuery = useMemoFirebase(
    () => (user ? query(collection(db, 'habitShareHabits'), where('userId', '==', user.uid)) : null),
    [db, user]
  );
  const habitsSharedWithMeQuery = useMemoFirebase(
    () => (user ? query(collection(db, 'habitShareHabits'), where('isShared', '==', true), where('sharedWithIds', 'array-contains', user.uid)) : null),
    [db, user]
  );
  const incomingRequestsQuery = useMemoFirebase(
    () => (user ? query(collection(db, 'habitFriendRequests'), where('receiverId', '==', user.uid), where('status', '==', 'pending')) : null),
    [db, user]
  );
  const outgoingRequestsQuery = useMemoFirebase(
    () => (user ? query(collection(db, 'habitFriendRequests'), where('requesterId', '==', user.uid), where('status', '==', 'pending')) : null),
    [db, user]
  );
  const acceptedAsRequesterQuery = useMemoFirebase(
    () => (user ? query(collection(db, 'habitFriendRequests'), where('requesterId', '==', user.uid), where('status', '==', 'accepted')) : null),
    [db, user]
  );
  const acceptedAsReceiverQuery = useMemoFirebase(
    () => (user ? query(collection(db, 'habitFriendRequests'), where('receiverId', '==', user.uid), where('status', '==', 'accepted')) : null),
    [db, user]
  );

  const { data: myHabitsRaw } = useCollection<HabitShareHabit>(myHabitsQuery);
  const { data: sharedHabitsRaw } = useCollection<HabitShareHabit>(habitsSharedWithMeQuery);
  const { data: incomingRequestsRaw } = useCollection<HabitFriendRequest>(incomingRequestsQuery);
  const { data: outgoingRequestsRaw } = useCollection<HabitFriendRequest>(outgoingRequestsQuery);
  const { data: acceptedSentRaw } = useCollection<HabitFriendRequest>(acceptedAsRequesterQuery);
  const { data: acceptedReceivedRaw } = useCollection<HabitFriendRequest>(acceptedAsReceiverQuery);

  const myHabits = React.useMemo(() => (myHabitsRaw || []).map((h) => ({ ...h, checkIns: h.checkIns || [] })), [myHabitsRaw]);
  const friendHabits = React.useMemo(
    () => (sharedHabitsRaw || []).filter((h) => h.userId !== user?.uid).map((h) => ({ ...h, checkIns: h.checkIns || [] })),
    [sharedHabitsRaw, user]
  );
  const incomingRequests = React.useMemo(() => incomingRequestsRaw || [], [incomingRequestsRaw]);
  const outgoingRequests = React.useMemo(() => outgoingRequestsRaw || [], [outgoingRequestsRaw]);
  const acceptedSent = React.useMemo(() => acceptedSentRaw || [], [acceptedSentRaw]);
  const acceptedReceived = React.useMemo(() => acceptedReceivedRaw || [], [acceptedReceivedRaw]);

  const friends = React.useMemo(() => {
    const allAccepted = [...(acceptedSentRaw || []), ...(acceptedReceivedRaw || [])];
    return allAccepted.map((request) => {
      const isRequester = request.requesterId === user?.uid;
      return {
        id: isRequester ? request.receiverId : request.requesterId,
        name: isRequester ? request.receiverName : request.requesterName,
        email: isRequester ? request.receiverEmail : request.requesterEmail,
        avatarUrl: `https://placehold.co/100x100/e0e7ff/4f46e5?text=${(isRequester ? request.receiverName : request.requesterName).charAt(0).toUpperCase()}`,
      } as HabitShareUser;
    });
  }, [acceptedSentRaw, acceptedReceivedRaw, user]);

  const toggleCheckIn = async (habitId: string, dateStr: string) => {
    const habit = myHabits.find((h) => h.id === habitId);
    if (!habit) return;
    const checked = habit.checkIns.includes(dateStr);
    const nextCheckIns = checked ? habit.checkIns.filter((d) => d !== dateStr) : [...habit.checkIns, dateStr];
    await updateDoc(doc(db, 'habitShareHabits', habitId), { checkIns: nextCheckIns, updatedAt: new Date().toISOString() });
  };

  const handleCheer = async (habitId: string) => {
    await updateDoc(doc(db, 'habitShareHabits', habitId), { cheers: increment(1) });
  };

  const handleAddFriend = async (rawEmail: string) => {
    if (!user || !currentUser) return;

    const email = rawEmail.toLowerCase().trim();
    if (email === (user.email || '').toLowerCase()) {
      toast({ title: 'Invalid Action', description: 'You cannot send request to yourself.', variant: 'destructive' });
      return;
    }

    const userLookup = query(collection(db, 'users'), where('email', '==', email), limit(1));
    const userSnapshot = await getDocs(userLookup);
    if (userSnapshot.empty) {
      toast({ title: 'User Not Found', description: 'No user exists with this email.', variant: 'destructive' });
      return;
    }

    const target = userSnapshot.docs[0];
    const targetData = target.data() as { name?: string; email?: string };
    const targetId = target.id;

    const alreadyConnectedOrRequested = [...incomingRequests, ...outgoingRequests, ...acceptedSent, ...acceptedReceived].some(
      (request) =>
        (request.requesterId === user.uid && request.receiverId === targetId) ||
        (request.requesterId === targetId && request.receiverId === user.uid)
    );

    if (alreadyConnectedOrRequested) {
      toast({ title: 'Already Connected', description: 'Request already exists or user is already your friend.' });
      return;
    }

    const requestId = `${user.uid}_${targetId}_${Date.now()}`;
    const requestDoc = {
      id: requestId,
      requesterId: user.uid,
      requesterName: currentUser.name || user.email || 'User',
      requesterEmail: user.email || '',
      receiverId: targetId,
      receiverName: targetData.name || email.split('@')[0],
      receiverEmail: targetData.email || email,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'habitFriendRequests', requestId), requestDoc);
    toast({ title: 'Request Sent', description: `Friend request sent to ${requestDoc.receiverName}.` });
  };

  const handleAcceptRequest = async (requestId: string) => {
    await updateDoc(doc(db, 'habitFriendRequests', requestId), { status: 'accepted' });
    toast({ title: 'Request Accepted', description: 'You are now friends.' });
  };

  const handleRejectRequest = async (requestId: string) => {
    await updateDoc(doc(db, 'habitFriendRequests', requestId), { status: 'rejected' });
    toast({ title: 'Request Declined' });
  };

  const toggleSharedWithFriend = (friendId: string) => {
    setSharedWithIds((prev) => (prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]));
  };

  const saveHabit = async () => {
    if (!user || !currentUser || !newHabitName.trim()) return;

    const habitId = `habit_${Date.now()}`;
    const habit: HabitShareHabit = {
      id: habitId,
      userId: user.uid,
      userName: currentUser.name,
      userEmail: user.email || '',
      name: newHabitName.trim(),
      description: newHabitDesc.trim(),
      checkIns: [],
      isShared: isNewShared,
      sharedWithIds: isNewShared ? sharedWithIds : [],
      cheers: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'habitShareHabits', habitId), habit);

    setNewHabitName('');
    setNewHabitDesc('');
    setIsNewShared(false);
    setSharedWithIds([]);
    setIsAddOpen(false);
    toast({ title: 'Habit Added', description: 'Your habit has been saved.' });
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
  const selectedHabit = selectedHabitId ? getCombinedHabits().find((h) => h.id === selectedHabitId) || null : null;

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myHabits.map((habit) => (
                  <HabitCard key={habit.id} habit={habit} onToggleCheckIn={toggleCheckIn} currentDate={currentDate} onViewDetails={setSelectedHabitId} />
                ))}
              </div>
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
            <Button onClick={saveHabit} className="rounded-2xl h-12 bg-primary font-black px-10 shadow-xl shadow-primary/20">SAVE HABIT</Button>
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
