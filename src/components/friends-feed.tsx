'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { HabitFriendRequest, HabitShareHabit, HabitShareUser } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Users, Search, QrCode, ScanLine, ChevronDown, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { HabitCard } from './habit-card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import dynamic from 'next/dynamic';
import QRCode from 'react-qr-code';

const Scanner = dynamic(
  () => import('@yudiel/react-qr-scanner').then((mod) => mod.Scanner),
  { ssr: false },
);

interface FriendsFeedProps {
  friends: HabitShareUser[];
  friendHabits: HabitShareHabit[];
  incomingRequests: HabitFriendRequest[];
  outgoingRequests: HabitFriendRequest[];
  currentUserEmail: string;
  onAddFriend: (email: string) => Promise<void> | void;
  onAcceptRequest: (requestId: string) => Promise<void> | void;
  onRejectRequest: (requestId: string) => Promise<void> | void;
  onCheer?: (habitId: string) => void;
  onViewDetails?: (habitId: string) => void;
  currentDate?: Date;
}

export function FriendsFeed({
  friends,
  friendHabits,
  incomingRequests,
  outgoingRequests,
  currentUserEmail,
  onAddFriend,
  onAcceptRequest,
  onRejectRequest,
  onCheer,
  onViewDetails,
  currentDate = new Date(),
}: FriendsFeedProps) {
  const [emailStr, setEmailStr] = React.useState('');
  const [isMyQROpen, setIsMyQROpen] = React.useState(false);
  const [isScanQROpen, setIsScanQROpen] = React.useState(false);
  const [expandedFriendId, setExpandedFriendId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailStr.trim()) return;
    setSubmitting(true);
    try {
      await onAddFriend(emailStr.trim());
      setEmailStr('');
    } finally {
      setSubmitting(false);
    }
  };

  const qrValue = `habitshare:addfriend:${currentUserEmail}`;
  const uniqueFriends = React.useMemo(() => {
    const seen = new Set<string>();
    return friends.filter((friend) => {
      if (seen.has(friend.id)) return false;
      seen.add(friend.id);
      return true;
    });
  }, [friends]);

  return (
    <div className="flex flex-col gap-6 w-full">
      <Card className="creative-card border-none bg-[linear-gradient(140deg,rgba(241,245,255,0.95),rgba(255,255,255,0.84))]">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-black flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" />
            Connect & Inspire
          </CardTitle>
          <CardDescription>Add friends by email or QR. Build a trusted circle that keeps each habit visible.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddFriend} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input value={emailStr} onChange={(e) => setEmailStr(e.target.value)} placeholder="Enter friend's email address..." className="pl-9 bg-white/80 border-white/40 h-10 shadow-sm focus-visible:ring-indigo-500" type="email" required />
            </div>
            <Button type="submit" className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all gap-2" disabled={submitting}>
              <UserPlus className="h-4 w-4" />
              {submitting ? 'Sending...' : 'Send Request'}
            </Button>
            <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <Button type="button" variant="outline" onClick={() => setIsMyQROpen(true)} className="flex-1 sm:flex-none h-10 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 shadow-sm">
                <QrCode className="h-4 w-4 mr-2" /> QR
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsScanQROpen(true)} className="flex-1 sm:flex-none h-10 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 shadow-sm">
                <ScanLine className="h-4 w-4 mr-2" /> Scan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {incomingRequests.length > 0 ? (
          <Card className="creative-card border-none bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(240,253,244,0.84))]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Incoming Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {incomingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between rounded-xl border p-3 bg-white">
                <div>
                  <p className="font-semibold text-slate-800">{request.requesterName}</p>
                  <p className="text-xs text-slate-500">{request.requesterEmail}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => onAcceptRequest(request.id)}>Accept</Button>
                  <Button size="sm" variant="outline" onClick={() => onRejectRequest(request.id)}>Reject</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {outgoingRequests.length > 0 ? (
          <Card className="creative-card border-none bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(255,251,235,0.86))]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-amber-600" />
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {outgoingRequests.map((request) => (
              <div key={request.id} className="rounded-xl border p-3 bg-white">
                <p className="font-semibold text-slate-800">{request.receiverName}</p>
                <p className="text-xs text-slate-500">{request.receiverEmail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-6">
        <h3 className="text-lg font-black text-slate-800 px-1 border-b pb-2">Friends' Shared Habits</h3>

        {uniqueFriends.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 bg-white/40 rounded-2xl border border-dashed border-slate-300">
            <Users className="h-12 w-12 opacity-20 mb-3" />
            <p className="text-sm font-medium">No accepted friends yet.</p>
            <p className="text-xs">Send request and ask friend to accept.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {uniqueFriends.map((friend) => {
              const habits = friendHabits.filter((h) => h.userId === friend.id && h.isShared);
              const isExpanded = expandedFriendId === friend.id;
              const safeName = friend.name || friend.email || 'Friend';
              const safeInitial = safeName.charAt(0).toUpperCase();

              return (
                <div key={friend.id} className="flex flex-col bg-white/75 p-2 rounded-[26px] border border-white/80 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors" onClick={() => setExpandedFriendId(isExpanded ? null : friend.id)}>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 ring-2 ring-indigo-100 shadow-sm">
                        <AvatarImage src={friend.avatarUrl} alt={safeName} />
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">{safeInitial}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <div className="text-base font-extrabold text-slate-800">{safeName}</div>
                        <div className="text-xs font-medium text-slate-400">{habits.length} habits shared</div>
                      </div>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>

                  {isExpanded ? (
                    <div className="mt-3 px-3 pb-3 pt-2 border-t border-slate-100 animate-in slide-in-from-top-4 fade-in duration-300 flex flex-col gap-3">
                      {habits.length === 0 ? (
                        <div className="text-sm font-medium text-slate-400 italic bg-slate-50 p-6 text-center rounded-2xl border border-slate-100">No shared habits yet.</div>
                      ) : (
                        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2">
                          {habits.map((habit) => (
                            <HabitCard key={habit.id} habit={habit} onToggleCheckIn={() => {}} onCheer={onCheer} onViewDetails={onViewDetails} isFriendView={true} currentDate={currentDate} />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={isMyQROpen} onOpenChange={setIsMyQROpen}>
        <DialogContent className="sm:max-w-sm rounded-3xl text-center flex flex-col items-center border-none shadow-2xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">My Friend QR</DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-100 inline-block">
            <QRCode value={qrValue} size={200} fgColor="#4f46e5" />
          </div>
          <p className="text-sm font-medium text-slate-500 mt-4 leading-relaxed px-4">Friend scans this QR and request goes to you for approval.</p>
          <Button variant="ghost" onClick={() => setIsMyQROpen(false)} className="mt-2 rounded-xl">Close</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isScanQROpen} onOpenChange={setIsScanQROpen}>
        <DialogContent className="sm:max-w-sm rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
          <DialogHeader className="p-5 pb-2 bg-indigo-50 w-full text-center">
            <DialogTitle className="text-xl font-bold text-indigo-900 flex items-center justify-center gap-2">
              <ScanLine className="h-5 w-5" /> Scan Friend QR
            </DialogTitle>
          </DialogHeader>
          <div className="h-72 w-full bg-black relative flex items-center justify-center">
            {isScanQROpen ? (
              <Scanner
                onScan={async (result) => {
                  if (!result || result.length === 0) return;
                  const text = result[0].rawValue || '';
                  let email = text;

                  if (text.startsWith('habitshare:addfriend:')) {
                    email = text.replace('habitshare:addfriend:', '');
                  } else {
                    try {
                      const parsed = JSON.parse(text);
                      if (parsed?.email) {
                        email = String(parsed.email);
                      }
                    } catch {
                      // keep raw text as fallback
                    }
                  }

                  await onAddFriend(email);
                  setIsScanQROpen(false);
                }}
              />
            ) : null}
          </div>
          <div className="p-4 bg-white text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Align QR code within the frame</p>
            <Button variant="outline" onClick={() => setIsScanQROpen(false)} className="rounded-xl w-full border-slate-200">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
