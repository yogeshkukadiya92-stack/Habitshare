'use client';

import * as React from 'react';
import { addDays, addMonths, eachDayOfInterval, endOfMonth, format, startOfMonth, subDays, subMonths } from 'date-fns';
import { BarChart3, Check, ChevronLeft, ChevronRight, GripVertical, LogOut, PlusCircle, Share2, Target, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HabitCard } from '@/components/habit-card';
import { HabitCalendarDialog } from '@/components/habit-calendar-dialog';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { openWhatsAppShare } from '@/lib/whatsapp-share';
import { HabitDayStatus, getHabitDayStatus, upsertHabitDayStatus } from '@/lib/habit-status';
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
  email: string | null;
  name: string | null;
};

const mapHabit = (row: HabitRow): HabitShareHabit => ({
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
});

const mapReq = (row: FriendRequestRow): HabitFriendRequest => ({
  id: row.id,
  requesterId: row.requester_id,
  requesterName: row.requester_name || row.requester_email || 'User',
  requesterEmail: row.requester_email || '',
  receiverId: row.receiver_id,
  receiverName: row.receiver_name || row.receiver_email || 'User',
  receiverEmail: row.receiver_email || '',
  status: row.status,
  createdAt: row.created_at,
});

export default function Dashboard() {
  const { user, currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [chartMonth, setChartMonth] = React.useState(startOfMonth(new Date()));
  const [chartRange, setChartRange] = React.useState<'weekly' | 'fifteen' | 'monthly' | 'custom'>('monthly');
  const [chartOwnerFilter, setChartOwnerFilter] = React.useState<'me' | 'friends_all' | string>('me');
  const [customStartDate, setCustomStartDate] = React.useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));

  const [myHabits, setMyHabits] = React.useState<HabitShareHabit[]>([]);
  const [friendHabits, setFriendHabits] = React.useState<HabitShareHabit[]>([]);
  const [friends, setFriends] = React.useState<HabitShareUser[]>([]);
  const [incoming, setIncoming] = React.useState<HabitFriendRequest[]>([]);
  const [outgoing, setOutgoing] = React.useState<HabitFriendRequest[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [friendEmail, setFriendEmail] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [reqActionId, setReqActionId] = React.useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [newHabitName, setNewHabitName] = React.useState('');
  const [newHabitDesc, setNewHabitDesc] = React.useState('');
  const [isNewShared, setIsNewShared] = React.useState(false);
  const [sharedWithIds, setSharedWithIds] = React.useState<string[]>([]);
  const [isSavingHabit, setIsSavingHabit] = React.useState(false);
  const [editingHabitId, setEditingHabitId] = React.useState<string | null>(null);
  const [selectedHabitId, setSelectedHabitId] = React.useState<string | null>(null);
  const [isChartOpen, setIsChartOpen] = React.useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = React.useState(false);
  const [isChartPreviewOpen, setIsChartPreviewOpen] = React.useState(false);
  const [chartPreviewUrl, setChartPreviewUrl] = React.useState('');
  const [chartPreviewFileName, setChartPreviewFileName] = React.useState('');
  const [chartPreviewBlob, setChartPreviewBlob] = React.useState<Blob | null>(null);
  const [chartPreviewLoading, setChartPreviewLoading] = React.useState(false);
  const [draggedHabitId, setDraggedHabitId] = React.useState<string | null>(null);

  const habitOrderStorageKey = React.useMemo(() => (user ? `habit-share-order:${user.id}` : ''), [user]);
  const applySavedHabitOrder = React.useCallback((habits: HabitShareHabit[]) => {
    if (!habitOrderStorageKey) return habits;
    try {
      const raw = localStorage.getItem(habitOrderStorageKey);
      if (!raw) return habits;
      const orderedIds = JSON.parse(raw) as string[];
      if (!Array.isArray(orderedIds) || orderedIds.length === 0) return habits;
      const byId = new Map(habits.map((habit) => [habit.id, habit] as const));
      const ordered = orderedIds.map((id) => byId.get(id)).filter((habit): habit is HabitShareHabit => Boolean(habit));
      const missing = habits.filter((habit) => !orderedIds.includes(habit.id));
      return [...ordered, ...missing];
    } catch {
      return habits;
    }
  }, [habitOrderStorageKey]);
  const persistHabitOrder = React.useCallback((habits: HabitShareHabit[]) => {
    if (!habitOrderStorageKey) return;
    localStorage.setItem(habitOrderStorageKey, JSON.stringify(habits.map((habit) => habit.id)));
  }, [habitOrderStorageKey]);

  const loadData = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [mine, shared, inc, out, accSent, accReceived] = await Promise.all([
        supabase.from('habit_share_habits').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('habit_share_habits').select('*').eq('is_shared', true).contains('shared_with_ids', [user.id]).order('created_at', { ascending: false }),
        supabase.from('habit_friend_requests').select('*').eq('receiver_id', user.id).eq('status', 'pending'),
        supabase.from('habit_friend_requests').select('*').eq('requester_id', user.id).eq('status', 'pending'),
        supabase.from('habit_friend_requests').select('*').eq('requester_id', user.id).eq('status', 'accepted'),
        supabase.from('habit_friend_requests').select('*').eq('receiver_id', user.id).eq('status', 'accepted'),
      ]);

      if (mine.error || shared.error || inc.error || out.error || accSent.error || accReceived.error) {
        throw new Error('Load failed');
      }

      setMyHabits(applySavedHabitOrder((mine.data || []).map((r) => mapHabit(r as HabitRow))));
      setFriendHabits((shared.data || []).map((r) => mapHabit(r as HabitRow)).filter((h) => h.userId !== user.id));
      setIncoming((inc.data || []).map((r) => mapReq(r as FriendRequestRow)));
      setOutgoing((out.data || []).map((r) => mapReq(r as FriendRequestRow)));

      const map = new Map<string, HabitShareUser>();
      (accSent.data || []).forEach((r) => {
        const x = r as FriendRequestRow;
        map.set(x.receiver_id, {
          id: x.receiver_id,
          name: x.receiver_name || x.receiver_email || 'Friend',
          email: x.receiver_email || '',
          avatarUrl: '',
        });
      });
      (accReceived.data || []).forEach((r) => {
        const x = r as FriendRequestRow;
        map.set(x.requester_id, {
          id: x.requester_id,
          name: x.requester_name || x.requester_email || 'Friend',
          email: x.requester_email || '',
          avatarUrl: '',
        });
      });
      setFriends(Array.from(map.values()));
    } catch {
      toast({ title: 'Load failed', description: 'Could not load habits/friends.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [applySavedHabitOrder, toast, user]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  if (authLoading) return <main className="p-6 text-sm text-slate-500">Loading...</main>;
  if (!user) return <main className="p-6 text-sm text-slate-500">Please login to continue.</main>;

  const selectedHabit = selectedHabitId ? [...myHabits, ...friendHabits].find((h) => h.id === selectedHabitId) || null : null;
  const parsedCustomStart = new Date(`${customStartDate}T00:00:00`);
  const parsedCustomEnd = new Date(`${customEndDate}T00:00:00`);
  const isCustomValid = !Number.isNaN(parsedCustomStart.getTime()) && !Number.isNaN(parsedCustomEnd.getTime());
  const customRangeStart = isCustomValid ? (parsedCustomStart <= parsedCustomEnd ? parsedCustomStart : parsedCustomEnd) : subDays(new Date(), 6);
  const customRangeEnd = isCustomValid ? (parsedCustomStart <= parsedCustomEnd ? parsedCustomEnd : parsedCustomStart) : new Date();

  const chartStart = chartRange === 'weekly'
    ? subDays(new Date(), 6)
    : chartRange === 'fifteen'
      ? subDays(new Date(), 14)
      : chartRange === 'monthly'
        ? startOfMonth(chartMonth)
        : customRangeStart;
  const chartEnd = chartRange === 'weekly'
    ? new Date()
    : chartRange === 'fifteen'
      ? new Date()
      : chartRange === 'monthly'
        ? endOfMonth(chartMonth)
        : customRangeEnd;
  const chartDays = eachDayOfInterval({ start: chartStart, end: chartEnd });

  const chartRangeLabel = chartRange === 'weekly'
    ? 'Last 7 days'
    : chartRange === 'fifteen'
      ? 'Last 15 days'
      : chartRange === 'monthly'
        ? format(chartMonth, 'MMMM yyyy')
        : `${format(customRangeStart, 'dd MMM yyyy')} - ${format(customRangeEnd, 'dd MMM yyyy')}`;
  const currentDateStr = format(currentDate, 'yyyy-MM-dd');
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const ownerName = currentUser?.name || user.email?.split('@')[0] || 'User';
  const friendChartOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    friendHabits.forEach((habit) => {
      if (!habit.userId) return;
      map.set(habit.userId, habit.userName || habit.userEmail || 'Friend');
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [friendHabits]);
  const chartHabits = React.useMemo(() => {
    if (chartOwnerFilter === 'me') return myHabits;
    if (chartOwnerFilter === 'friends_all') return friendHabits;
    return friendHabits.filter((habit) => habit.userId === chartOwnerFilter);
  }, [chartOwnerFilter, friendHabits, myHabits]);
  const chartOwnerLabel = chartOwnerFilter === 'me'
    ? ownerName
    : chartOwnerFilter === 'friends_all'
      ? 'All Friends'
      : friendChartOptions.find((option) => option.id === chartOwnerFilter)?.label || 'Friend';
  const doneTodayCount = myHabits.filter((h) => getHabitDayStatus(h.checkIns, currentDateStr) === 'done').length;

  const chartShareText = React.useMemo(() => {
    const datesRow = chartDays.map((d) => format(d, 'dd')).join(' ');
    const lines = chartHabits.map((habit) => {
      const rowName = chartOwnerFilter === 'me' ? habit.name : `${habit.name} (${habit.userName || habit.userEmail || 'Friend'})`;
      const marks = chartDays
        .map((d) => {
          const dateKey = format(d, 'yyyy-MM-dd');
          if (dateKey > todayKey) return '-';
          const status = getHabitDayStatus(habit.checkIns, dateKey);
          if (status === 'done') return 'YES';
          if (status === 'skipped') return 'SKIP';
          return 'NO';
        })
        .join(' ');
      const total = chartDays.filter((d) => {
        const dateKey = format(d, 'yyyy-MM-dd');
        return dateKey <= todayKey && getHabitDayStatus(habit.checkIns, dateKey) === 'done';
      }).length;
      return `${rowName} (${total}/${chartDays.length}): ${marks}`;
    });
    return [
      'Habit Share - Habit Chart',
      `User: ${chartOwnerLabel}`,
      `Range: ${chartRangeLabel}`,
      `Dates: ${datesRow}`,
      '',
      ...lines,
    ].join('\n');
  }, [chartDays, chartHabits, chartOwnerFilter, chartOwnerLabel, chartRangeLabel, todayKey]);

  const buildChartJpeg = async () => {
    const firstColWidth = 220;
    const dayColWidth = 34;
    const totalColWidth = 90;
    const headerHeight = 34;
    const rowHeight = 30;
    const topArea = 78;
    const padding = 16;
    const width = firstColWidth + chartDays.length * dayColWidth + totalColWidth + padding * 2;
    const height = topArea + headerHeight + chartHabits.length * rowHeight + padding * 2;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Habit Share - Habit Chart', padding, 30);
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`User: ${chartOwnerLabel}`, padding, 50);
    ctx.fillText(`Range: ${chartRangeLabel}`, padding, 68);

    const drawCell = (
      x: number,
      y: number,
      w: number,
      h: number,
      bg: string,
      text: string,
      color: string,
      center = true,
    ) => {
      ctx.fillStyle = bg;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#d1d5db';
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = color;
      ctx.font = 'bold 11px Arial';
      if (center) {
        const tw = ctx.measureText(text).width;
        ctx.fillText(text, x + (w - tw) / 2, y + h / 2 + 4);
      } else {
        ctx.fillText(text, x + 8, y + h / 2 + 4);
      }
    };

    let y = topArea;
    const startX = padding;
    drawCell(startX, y, firstColWidth, headerHeight, '#f1f5f9', 'Habit', '#334155', false);
    chartDays.forEach((d, i) => {
      drawCell(startX + firstColWidth + i * dayColWidth, y, dayColWidth, headerHeight, '#f8fafc', format(d, 'd'), '#64748b');
    });
    drawCell(startX + firstColWidth + chartDays.length * dayColWidth, y, totalColWidth, headerHeight, '#f1f5f9', 'Total', '#334155');
    y += headerHeight;

    chartHabits.forEach((habit) => {
      const total = chartDays.filter((d) => {
        const dateKey = format(d, 'yyyy-MM-dd');
        return dateKey <= todayKey && getHabitDayStatus(habit.checkIns, dateKey) === 'done';
      }).length;

      const rowName = chartOwnerFilter === 'me' ? habit.name : `${habit.name} (${habit.userName || habit.userEmail || 'Friend'})`;
      drawCell(startX, y, firstColWidth, rowHeight, '#ffffff', rowName.slice(0, 28), '#0f172a', false);
      chartDays.forEach((d, i) => {
        const dateKey = format(d, 'yyyy-MM-dd');
        const isFuture = dateKey > todayKey;
        const status = getHabitDayStatus(habit.checkIns, dateKey);
        if (isFuture) {
          drawCell(startX + firstColWidth + i * dayColWidth, y, dayColWidth, rowHeight, '#ffffff', '', '#64748b');
        } else if (status === 'skipped') {
          drawCell(
            startX + firstColWidth + i * dayColWidth,
            y,
            dayColWidth,
            rowHeight,
            '#f1f5f9',
            'S',
            '#475569',
          );
        } else {
          drawCell(
            startX + firstColWidth + i * dayColWidth,
            y,
            dayColWidth,
            rowHeight,
            status === 'done' ? '#ecfdf5' : '#fef2f2',
            status === 'done' ? 'Y' : 'N',
            status === 'done' ? '#059669' : '#dc2626',
          );
        }
      });
      drawCell(startX + firstColWidth + chartDays.length * dayColWidth, y, totalColWidth, rowHeight, '#f8fafc', `${total}/${chartDays.length}`, '#0f172a');
      y += rowHeight;
    });

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95));
    if (!blob) throw new Error('Could not export JPEG');
    const fileName = `habit-chart-${chartRange}-${chartOwnerFilter}-${format(new Date(), 'yyyyMMdd')}.jpg`;
    const previewUrl = canvas.toDataURL('image/jpeg', 0.95);
    return { blob, fileName, previewUrl };
  };

  const openChartPreview = async () => {
    if (chartHabits.length === 0) return;
    setChartPreviewLoading(true);
    try {
      const { blob, fileName, previewUrl } = await buildChartJpeg();
      setChartPreviewBlob(blob);
      setChartPreviewFileName(fileName);
      setChartPreviewUrl(previewUrl);
      setIsChartPreviewOpen(true);
    } catch (error) {
      console.error('Failed to build chart preview:', error);
      toast({ title: 'Preview failed', description: 'Could not generate chart preview.', variant: 'destructive' });
    } finally {
      setChartPreviewLoading(false);
    }
  };

  const shareChartPreview = async () => {
    if (!chartPreviewBlob) return;
    const file = new File([chartPreviewBlob], chartPreviewFileName || 'habit-chart.jpg', { type: 'image/jpeg' });
    const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      await nav.share({
        title: 'Habit Chart',
        text: `Habit chart - ${chartRangeLabel}`,
        files: [file],
      });
      return;
    }
    const url = URL.createObjectURL(chartPreviewBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = chartPreviewFileName || `habit-chart-${format(new Date(), 'yyyyMMdd')}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({ title: 'JPEG downloaded', description: 'Now share this image on WhatsApp.' });
  };

  const setHabitDayStatus = async (habitId: string, dateStr: string, status: HabitDayStatus) => {
    const oldHabit = myHabits.find((h) => h.id === habitId);
    if (!oldHabit) return;

    const next = upsertHabitDayStatus(oldHabit.checkIns, dateStr, status);
    setMyHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, checkIns: next } : h)));
    const { error } = await supabase
      .from('habit_share_habits')
      .update({ check_ins: next, updated_at: new Date().toISOString() })
      .eq('id', habitId);
    if (error) {
      setMyHabits((prev) => prev.map((h) => (h.id === habitId ? oldHabit : h)));
      toast({ title: 'Update failed', description: 'Try again.', variant: 'destructive' });
    }
  };

  const sendFriendRequest = async () => {
    if (!friendEmail.trim()) return;
    setSending(true);
    try {
      const email = friendEmail.trim().toLowerCase();
      if (email === (user.email || '').toLowerCase()) {
        toast({ title: 'Invalid', description: 'Cannot add yourself.', variant: 'destructive' });
        return;
      }
      const { data: target } = await supabase.from('profiles').select('id,email,name').eq('email', email).maybeSingle();
      if (!target) {
        toast({ title: 'User not found', description: 'No account with this email.', variant: 'destructive' });
        return;
      }
      const p = target as ProfileRow;
      const { data: existing } = await supabase
        .from('habit_friend_requests')
        .select('id')
        .or(`and(requester_id.eq.${user.id},receiver_id.eq.${p.id}),and(requester_id.eq.${p.id},receiver_id.eq.${user.id})`)
        .limit(1);
      if (existing && existing.length > 0) {
        toast({ title: 'Exists', description: 'Already requested/connected.' });
        return;
      }
      const payload = {
        id: `friend_${Date.now()}`,
        requester_id: user.id,
        requester_name: ownerName,
        requester_email: user.email || '',
        receiver_id: p.id,
        receiver_name: p.name || p.email || 'User',
        receiver_email: p.email || '',
        status: 'pending',
      };
      const { error } = await supabase.from('habit_friend_requests').insert(payload);
      if (error) throw error;
      setFriendEmail('');
      toast({ title: 'Request sent' });
      await loadData();
    } catch {
      toast({ title: 'Send failed', description: 'Could not send request.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const updateRequest = async (id: string, status: 'accepted' | 'rejected') => {
    setReqActionId(id);
    try {
      const { error } = await supabase.from('habit_friend_requests').update({ status }).eq('id', id);
      if (error) throw error;
      await loadData();
    } catch {
      toast({ title: 'Failed', description: 'Could not update request.', variant: 'destructive' });
    } finally {
      setReqActionId(null);
    }
  };

  const saveHabit = async () => {
    if (!newHabitName.trim()) {
      toast({ title: 'Habit name required', variant: 'destructive' });
      return;
    }
    const selected = isNewShared ? sharedWithIds.filter(Boolean) : [];
    setIsSavingHabit(true);
    try {
      const payload = {
        name: newHabitName.trim(),
        description: newHabitDesc.trim(),
        is_shared: selected.length > 0,
        shared_with_ids: selected,
        updated_at: new Date().toISOString(),
      };

      const { error } = editingHabitId
        ? await supabase
            .from('habit_share_habits')
            .update(payload)
            .eq('id', editingHabitId)
            .eq('user_id', user.id)
        : await supabase.from('habit_share_habits').insert({
            id: `habit_${Date.now()}`,
            user_id: user.id,
            user_name: ownerName,
            user_email: user.email || '',
            name: payload.name,
            description: payload.description,
            check_ins: [] as string[],
            cheers: 0,
            is_shared: payload.is_shared,
            shared_with_ids: payload.shared_with_ids,
          });
      if (error) throw error;
      setIsCreateOpen(false);
      setNewHabitName('');
      setNewHabitDesc('');
      setIsNewShared(false);
      setSharedWithIds([]);
      setEditingHabitId(null);
      await loadData();
    } catch {
      toast({ title: 'Save failed', description: 'Could not save habit.', variant: 'destructive' });
    } finally {
      setIsSavingHabit(false);
    }
  };

  const openEditHabit = (habit: HabitShareHabit) => {
    setEditingHabitId(habit.id);
    setNewHabitName(habit.name);
    setNewHabitDesc(habit.description || '');
    const currentSharedIds = habit.sharedWithIds || [];
    setIsNewShared(currentSharedIds.length > 0);
    setSharedWithIds(currentSharedIds);
    setIsCreateOpen(true);
  };

  const deleteHabit = async (habit: HabitShareHabit) => {
    const ok = window.confirm(`Delete "${habit.name}"?`);
    if (!ok) return;
    try {
      const { error } = await supabase
        .from('habit_share_habits')
        .delete()
        .eq('id', habit.id)
        .eq('user_id', user.id);
      if (error) throw error;
      toast({ title: 'Habit deleted' });
      await loadData();
    } catch {
      toast({ title: 'Delete failed', description: 'Could not delete habit.', variant: 'destructive' });
    }
  };

  const reorderHabit = (targetId: string) => {
    if (!draggedHabitId || draggedHabitId === targetId) return;
    setMyHabits((previous) => {
      const fromIndex = previous.findIndex((habit) => habit.id === draggedHabitId);
      const toIndex = previous.findIndex((habit) => habit.id === targetId);
      if (fromIndex < 0 || toIndex < 0) return previous;
      const next = [...previous];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      persistHabitOrder(next);
      return next;
    });
    setDraggedHabitId(null);
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f3f6ff_0%,#ffffff_100%)] p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-indigo-500">
                <Target className="h-3.5 w-3.5" />
                Habit tracker
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Habit Share</h1>
            </div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
              <Button variant="outline" onClick={() => setIsChartOpen(true)} className="h-10 rounded-2xl px-3 text-sm font-bold sm:h-10">
                <BarChart3 className="mr-2 h-4 w-4" />
                Habit Chart
              </Button>
              <Button variant="outline" onClick={() => setIsFriendsOpen(true)} className="h-10 rounded-2xl px-3 text-sm font-bold sm:h-10">
                <UserPlus className="mr-2 h-4 w-4" />
                Friends
              </Button>
              <Button
                onClick={() => {
                  setEditingHabitId(null);
                  setNewHabitName('');
                  setNewHabitDesc('');
                  setIsNewShared(false);
                  setSharedWithIds([]);
                  setIsCreateOpen(true);
                }}
                className="h-10 rounded-2xl px-3 text-sm font-bold sm:h-10"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                New Habit
              </Button>
              <Button variant="outline" onClick={async () => supabase.auth.signOut()} className="h-10 rounded-2xl px-3 text-sm font-bold sm:h-10">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
          <div className="mt-4 text-sm font-medium text-slate-600">Done today: {doneTodayCount}</div>
        </section>

        <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-slate-900">Habits</h2>
            <div className="flex items-center gap-2 rounded-2xl border px-2 py-1">
              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl" onClick={() => setCurrentDate((d) => subDays(d, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" className="rounded-xl px-3 font-black" onClick={() => setCurrentDate(new Date())}>
                {format(currentDate, 'MMM d, yyyy')}
              </Button>
              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl" onClick={() => setCurrentDate((d) => addDays(d, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Tabs defaultValue="mine" className="mt-4">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl">
              <TabsTrigger value="mine">My Habits</TabsTrigger>
              <TabsTrigger value="shared">Shared With Me</TabsTrigger>
            </TabsList>
            <TabsContent value="mine" className="mt-4">
              {loading ? (
                <div className="text-sm text-slate-500">Loading...</div>
              ) : myHabits.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-slate-500">No habits yet.</div>
              ) : (
                <div className="space-y-3">
                  {myHabits.map((h) => (
                    <div
                      key={h.id}
                      className={`rounded-2xl transition ${draggedHabitId === h.id ? 'opacity-70' : ''}`}
                      draggable
                      onDragStart={() => setDraggedHabitId(h.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => reorderHabit(h.id)}
                      onDragEnd={() => setDraggedHabitId(null)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-3 hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 sm:flex">
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <HabitCard
                          habit={h}
                          onViewDetails={(id) => setSelectedHabitId(id)}
                          onSetDayStatus={setHabitDayStatus}
                          onEdit={() => openEditHabit(h)}
                          onDelete={() => deleteHabit(h)}
                          currentDate={currentDate}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="shared" className="mt-4">
              {friendHabits.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-slate-500">No shared habits yet.</div>
              ) : (
                <div className="space-y-3">
                  {friendHabits.map((h) => (
                    <HabitCard key={h.id} habit={h} isFriendView showMemberName memberName={h.userName || h.userEmail || 'Friend'} onViewDetails={(id) => setSelectedHabitId(id)} currentDate={currentDate} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>

      <Dialog open={isChartOpen} onOpenChange={setIsChartOpen}>
        <DialogContent className="max-h-[92vh] w-[98vw] max-w-[98vw] overflow-y-auto rounded-2xl sm:max-w-[95vw]">
          <DialogTitle className="text-2xl font-black text-slate-900">Habit Chart</DialogTitle>
          <div className="mt-2 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant={chartRange === 'weekly' ? 'default' : 'outline'} size="sm" className="rounded-xl" onClick={() => setChartRange('weekly')}>
                Weekly
              </Button>
              <Button variant={chartRange === 'fifteen' ? 'default' : 'outline'} size="sm" className="rounded-xl" onClick={() => setChartRange('fifteen')}>
                15 Days
              </Button>
              <Button variant={chartRange === 'monthly' ? 'default' : 'outline'} size="sm" className="rounded-xl" onClick={() => setChartRange('monthly')}>
                Monthly
              </Button>
              <Button variant={chartRange === 'custom' ? 'default' : 'outline'} size="sm" className="rounded-xl" onClick={() => setChartRange('custom')}>
                Custom
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              {chartRange === 'monthly' ? (
                <div className="flex items-center gap-2 rounded-2xl border px-2 py-1">
                  <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl" onClick={() => setChartMonth((d) => startOfMonth(subMonths(d, 1)))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="min-w-[130px] text-center text-sm font-black">{format(chartMonth, 'MMMM yyyy')}</div>
                  <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl" onClick={() => setChartMonth((d) => startOfMonth(addMonths(d, 1)))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : chartRange === 'custom' ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="h-10 w-[160px] rounded-xl" />
                  <span className="text-sm text-slate-500">to</span>
                  <Input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="h-10 w-[160px] rounded-xl" />
                </div>
              ) : (
                <div className="text-sm font-bold text-slate-600">{chartRangeLabel}</div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="rounded-2xl border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  onClick={openChartPreview}
                  disabled={chartHabits.length === 0 || chartPreviewLoading}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  {chartPreviewLoading ? 'Preparing...' : 'Share JPEG'}
                </Button>
                <Button variant="outline" className="rounded-2xl border-green-200 text-green-700 hover:bg-green-50" onClick={() => openWhatsAppShare(chartShareText)} disabled={chartHabits.length === 0}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Text
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-500">View</Label>
              <select
                value={chartOwnerFilter}
                onChange={(e) => setChartOwnerFilter(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
              >
                <option value="me">My Habits</option>
                <option value="friends_all">All Friends</option>
                {friendChartOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {chartHabits.length === 0 ? (
              <div className="text-sm text-slate-500">Chart appears after habits are created.</div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border">
                <table className="min-w-[1000px] border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 min-w-[220px] border bg-slate-100 px-3 py-2 text-left text-xs font-black uppercase tracking-[0.2em] text-slate-600">Habit</th>
                      {chartDays.map((d) => (
                        <th key={format(d, 'yyyy-MM-dd')} className="min-w-[34px] border bg-slate-50 px-1 py-2 text-center text-[11px] font-black text-slate-500">{format(d, 'd')}</th>
                      ))}
                      <th className="min-w-[88px] border bg-slate-100 px-2 py-2 text-center text-xs font-black text-slate-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartHabits.map((h) => {
                      const c = chartDays.filter((d) => {
                        const key = format(d, 'yyyy-MM-dd');
                        return key <= todayKey && getHabitDayStatus(h.checkIns, key) === 'done';
                      }).length;
                      return (
                        <tr key={h.id}>
                          <td className="sticky left-0 z-10 border bg-white px-3 py-2">
                            <div className="font-semibold">{h.name}</div>
                            {chartOwnerFilter !== 'me' ? <div className="text-[11px] text-slate-500">{h.userName || h.userEmail || 'Friend'}</div> : null}
                            <div className="text-[11px] text-slate-500">{h.description || 'No description'}</div>
                          </td>
                          {chartDays.map((d) => {
                            const k = format(d, 'yyyy-MM-dd');
                            const future = k > todayKey;
                            const status = getHabitDayStatus(h.checkIns, k);
                            return (
                              <td key={`${h.id}_${k}`} className={`border px-1 py-1 text-center ${future ? 'bg-white' : status === 'done' ? 'bg-emerald-50' : status === 'skipped' ? 'bg-slate-100' : 'bg-rose-50'}`}>
                                {future ? null : status === 'done' ? <Check className="mx-auto h-3.5 w-3.5 text-emerald-600" /> : status === 'skipped' ? <span className="text-xs font-black text-slate-500">-</span> : <X className="mx-auto h-3.5 w-3.5 text-rose-500" />}
                              </td>
                            );
                          })}
                          <td className="border bg-slate-50 px-2 py-1 text-center font-black text-slate-800">{c}/{chartDays.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isFriendsOpen} onOpenChange={setIsFriendsOpen}>
        <DialogContent className="max-h-[92vh] w-[95vw] max-w-2xl overflow-y-auto rounded-2xl">
          <DialogTitle className="text-2xl font-black text-slate-900">Friends</DialogTitle>
          <div className="mt-2 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input value={friendEmail} onChange={(e) => setFriendEmail(e.target.value)} placeholder="Friend email" className="h-11 rounded-2xl" />
              <Button onClick={sendFriendRequest} disabled={sending || !friendEmail.trim()} className="h-11 rounded-2xl">
                <UserPlus className="mr-2 h-4 w-4" />
                {sending ? 'Sending...' : 'Add Friend'}
              </Button>
            </div>
            {incoming.length > 0 ? (
              <div className="space-y-2">
                {incoming.map((r) => (
                  <div key={r.id} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">
                        {r.requesterName} ({r.requesterEmail})
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateRequest(r.id, 'accepted')} disabled={reqActionId === r.id}>Accept</Button>
                        <Button size="sm" variant="outline" onClick={() => updateRequest(r.id, 'rejected')} disabled={reqActionId === r.id}>Reject</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {outgoing.length > 0 ? (
              <div className="space-y-2">
                {outgoing.map((r) => (
                  <div key={r.id} className="rounded-xl border p-3 text-sm text-slate-600">
                    Pending: {r.receiverName} ({r.receiverEmail})
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setNewHabitName('');
            setNewHabitDesc('');
            setIsNewShared(false);
            setSharedWithIds([]);
            setEditingHabitId(null);
          }
        }}
      >
        <DialogContent className="max-w-[95vw] rounded-[26px] border-none p-0 sm:max-w-lg">
          <div className="border-b border-slate-100 px-5 py-5">
            <DialogTitle className="text-3xl font-black tracking-tight text-slate-950">{editingHabitId ? 'Edit Habit' : 'Create Habit'}</DialogTitle>
          </div>
          <div className="space-y-4 px-5 py-5">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Habit name</Label>
              <Input value={newHabitName} onChange={(e) => setNewHabitName(e.target.value)} placeholder="Morning walk" className="h-12 rounded-2xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Description</Label>
              <textarea value={newHabitDesc} onChange={(e) => setNewHabitDesc(e.target.value)} placeholder="Keep it simple..." className="min-h-[110px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
              <div className="flex items-center gap-3">
                <Checkbox id="share-habit-with-friends" checked={isNewShared} onCheckedChange={(v) => setIsNewShared(Boolean(v))} />
                <Label htmlFor="share-habit-with-friends" className="text-sm font-semibold">Share with selected friends</Label>
              </div>
              {isNewShared ? (
                friends.length === 0 ? (
                  <div className="mt-2 text-sm text-slate-500">No accepted friends yet.</div>
                ) : (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {friends.map((f) => {
                      const sel = sharedWithIds.includes(f.id);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setSharedWithIds((p) => (p.includes(f.id) ? p.filter((x) => x !== f.id) : [...p, f.id]))}
                          className={`rounded-xl border p-3 text-left ${sel ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white'}`}
                        >
                          <div className="text-sm font-black text-slate-900">{f.name}</div>
                          <div className="text-xs text-slate-500">{f.email}</div>
                        </button>
                      );
                    })}
                  </div>
                )
              ) : null}
            </div>
          </div>
          <DialogFooter className="border-t border-slate-100 px-5 py-4">
            <div className="flex w-full gap-3">
              <Button variant="ghost" className="h-11 flex-1 rounded-2xl" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button className="h-11 flex-1 rounded-2xl font-bold" onClick={saveHabit} disabled={isSavingHabit}>
                {isSavingHabit ? 'Saving...' : editingHabitId ? 'Update Habit' : 'Save Habit'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isChartPreviewOpen}
        onOpenChange={(open) => {
          setIsChartPreviewOpen(open);
          if (!open) {
            setChartPreviewUrl('');
            setChartPreviewBlob(null);
            setChartPreviewFileName('');
          }
        }}
      >
        <DialogContent className="max-w-[95vw] rounded-2xl sm:max-w-3xl">
          <DialogTitle className="text-xl font-black text-slate-900">Chart Preview</DialogTitle>
          {chartPreviewUrl ? (
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
              <img src={chartPreviewUrl} alt="Habit chart preview" className="mx-auto h-auto max-w-full rounded-lg" />
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-slate-500">Preview is not ready.</div>
          )}
          <DialogFooter>
            <div className="flex w-full gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setIsChartPreviewOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1 rounded-xl" onClick={shareChartPreview} disabled={!chartPreviewBlob}>
                Share JPEG
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HabitCalendarDialog
        habit={selectedHabit}
        isOpen={Boolean(selectedHabit)}
        onClose={() => setSelectedHabitId(null)}
        canEdit={Boolean(selectedHabit && selectedHabit.userId === user.id)}
        onSetDayStatus={setHabitDayStatus}
      />
    </main>
  );
}
