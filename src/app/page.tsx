'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  LayoutDashboard, 
  PlusCircle, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  MessageCircle, 
  CalendarDays, 
  BarChart3
} from 'lucide-react';
import { HabitShareHabit, HabitShareUser } from '@/lib/types';
import { HabitCard } from '@/components/habit-card';
import { FriendsFeed } from '@/components/friends-feed';
import { HabitCalendarDialog } from '@/components/habit-calendar-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, subDays, addDays, isSameDay } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/components/auth-provider';

// Premium Features
import { AiCoach } from '@/components/ai-coach';
import { QrSocial } from '@/components/qr-social';
import { Achievements } from '@/components/achievements';
import { HabitAnalytics } from '@/components/habit-analytics';
import { MoodTracker } from '@/components/mood-tracker';

const MOCK_FRIENDS: HabitShareUser[] = [
  { id: 'u2', name: 'Alice Smith', email: 'alice@example.com', avatarUrl: 'https://placehold.co/100x100/e0e7ff/4f46e5?text=A' },
  { id: 'u3', name: 'Bob Jones', email: 'bob@example.com', avatarUrl: 'https://placehold.co/100x100/e0e7ff/4f46e5?text=B' },
];

const MOCK_FRIEND_HABITS: HabitShareHabit[] = [
  { id: 'h3', userId: 'u2', name: 'Morning Yoga', description: 'Sun salutations daily', checkIns: [format(new Date(), 'yyyy-MM-dd')], isShared: true, createdAt: new Date().toISOString(), cheers: 3 },
  { id: 'h4', userId: 'u3', name: 'Drink 2L Water', description: '', checkIns: [], isShared: true, createdAt: new Date().toISOString(), cheers: 0 },
];

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = React.useState('habits');
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
  
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isShareReportOpen, setIsShareReportOpen] = React.useState(false);
  const [selectedHabitId, setSelectedHabitId] = React.useState<string | null>(null);
  
  const streakDates = [0, 1, 2, 3, 4].map(daysAgo => format(new Date(Date.now() - daysAgo * 86400000), 'yyyy-MM-dd'));
  
  const [myHabits, setMyHabits] = React.useState<HabitShareHabit[]>([
    { id: 'h1', userId: 'me', name: 'Morning Run (5k)', description: 'Stay fit, go fast.', checkIns: streakDates, isShared: true, createdAt: new Date().toISOString() },
    { id: 'h2', userId: 'me', name: 'Read 20 pages', description: 'Before bed', checkIns: [format(new Date(), 'yyyy-MM-dd')], isShared: false, createdAt: new Date().toISOString() },
  ]);
  const [friends, setFriends] = React.useState<HabitShareUser[]>(MOCK_FRIENDS);
  const [friendHabits, setFriendHabits] = React.useState<HabitShareHabit[]>(MOCK_FRIEND_HABITS);

  const [newHabitName, setNewHabitName] = React.useState('');
  const [newHabitDesc, setNewHabitDesc] = React.useState('');
  const [isNewShared, setIsNewShared] = React.useState(false);
  const [sharedWithIds, setSharedWithIds] = React.useState<string[]>([]);

  const toggleCheckIn = (habitId: string, dateStr: string) => {
    setMyHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      const checked = h.checkIns.includes(dateStr);
      return {
        ...h,
        checkIns: checked ? h.checkIns.filter(d => d !== dateStr) : [...h.checkIns, dateStr]
      };
    }));
  };

  const handleCheer = (habitId: string) => {
    setFriendHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      return { ...h, cheers: (h.cheers || 0) + 1 };
    }))
  }

  const handleAddFriend = (email: string) => {
    const newFriend: HabitShareUser = {
      id: `u${Date.now()}`,
      name: email.split('@')[0],
      email: email,
      avatarUrl: `https://placehold.co/100x100/e0e7ff/4f46e5?text=${email.charAt(0).toUpperCase()}`
    };
    setFriends([...friends, newFriend]);
  };

  const saveHabit = () => {
    if (!newHabitName.trim()) return;
    const h: HabitShareHabit = {
      id: `h${Date.now()}`,
      userId: currentUser?.id || 'me',
      name: newHabitName,
      description: newHabitDesc,
      checkIns: [],
      isShared: isNewShared,
      sharedWith: isNewShared ? sharedWithIds : [],
      createdAt: new Date().toISOString()
    };
    setMyHabits([...myHabits, h]);
    setNewHabitName('');
    setNewHabitDesc('');
    setIsNewShared(false);
    setSharedWithIds([]);
    setIsAddOpen(false);
  };

  const generateReport = (days: number, label: string) => {
    const targetDates = Array.from({ length: days }).map((_, i) => format(subDays(currentDate, i), 'yyyy-MM-dd'));
    let summaryText = `*Habit Report - ${label}* 🚀\n\n`;
    myHabits.forEach(h => {
      const count = targetDates.filter(d => h.checkIns.includes(d)).length;
      summaryText += `${count >= 1 ? '✅' : '❌'} ${h.name}: ${count}/${days}\n`;
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(summaryText)}`, '_blank');
  };

  const getCombinedHabits = () => [...myHabits, ...friendHabits];
  const selectedHabit = selectedHabitId ? getCombinedHabits().find(h => h.id === selectedHabitId) || null : null;

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
            Welcome back, <span className="text-primary font-black uppercase tracking-tight">{currentUser?.name || 'Explorer'}</span>! ✨
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           <QrSocial />
           <Button onClick={() => setIsAddOpen(true)} className="rounded-2xl h-14 shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1 transition-all bg-primary px-8 font-black text-lg">
             <PlusCircle className="h-6 w-6 mr-2" /> New Habit
           </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <HabitAnalytics habits={myHabits} />
          
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
                     <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setCurrentDate(subDays(currentDate, 1))}><ChevronLeft className="h-4 w-4" /></Button>
                     <span className="text-xs font-black min-w-[80px] text-center tracking-widest">{isSameDay(currentDate, new Date()) ? "TODAY" : format(currentDate, 'MMM d').toUpperCase()}</span>
                     <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setCurrentDate(addDays(currentDate, 1))} disabled={isSameDay(currentDate, new Date())}><ChevronRight className="h-4 w-4" /></Button>
                   </div>
                 </div>
                 <Button onClick={() => setIsShareReportOpen(true)} variant="outline" className="rounded-2xl bg-green-50/50 text-green-700 border-green-200/50 font-black h-11"><MessageCircle className="h-4 w-4 mr-2" /> SHARE</Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myHabits.map((habit, i) => (
                  <HabitCard key={habit.id} habit={habit} onToggleCheckIn={toggleCheckIn} currentDate={currentDate} onViewDetails={setSelectedHabitId} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="friends">
               <FriendsFeed friends={friends} friendHabits={friendHabits} onAddFriend={handleAddFriend} onCheer={handleCheer} currentDate={currentDate} onViewDetails={setSelectedHabitId} />
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
          <DialogTitle className="text-3xl font-black tracking-tight mb-4">Create Habit 🌈</DialogTitle>
          <div className="space-y-6 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400 ml-1 tracking-widest">HABIT NAME</Label>
              <Input value={newHabitName} onChange={e => setNewHabitName(e.target.value)} placeholder="e.g. Morning Run" className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400 ml-1 tracking-widest">DESCRIPTION</Label>
              <Input value={newHabitDesc} onChange={e => setNewHabitDesc(e.target.value)} placeholder="Keep it short..." className="h-14 rounded-2xl bg-slate-50 border-none font-medium" />
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
          <DialogTitle className="text-3xl font-black flex items-center gap-3"><MessageCircle className="h-8 w-8 text-green-500" /> Share</DialogTitle>
          <div className="grid gap-4 py-8">
             <Button onClick={() => generateReport(1, 'Daily')} variant="outline" className="h-20 rounded-[24px] border-slate-100 p-4 justify-start font-black text-lg">Daily Win</Button>
             <Button onClick={() => generateReport(7, 'Weekly')} variant="outline" className="h-20 rounded-[24px] border-slate-100 p-4 justify-start font-black text-lg">Weekly Review</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <HabitCalendarDialog isOpen={!!selectedHabitId} onClose={() => setSelectedHabitId(null)} habit={selectedHabit} />
    </div>
  );
}
