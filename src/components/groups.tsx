'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Plus, Crown, UserPlus, Trash2, LogOut, Activity } from 'lucide-react';
import { Employee, GratitudeEntry, GroupMember, HabitShareGroup, HabitShareHabit, HabitShareUser } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { GroupFeed } from './group-feed';

type HabitGroupRow = {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_by_name: string | null;
  created_by_email: string | null;
  member_ids: string[] | null;
  member_count: number | null;
  is_public: boolean | null;
  created_at: string;
  updated_at: string | null;
};

type HabitGroupMemberRow = {
  id: string;
  group_id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  role: 'admin' | 'member' | null;
  joined_at: string | null;
};

interface GroupsProps {
  currentUser?: Employee | null;
  friends: HabitShareUser[];
  habits: HabitShareHabit[];
  gratitudeEntries: GratitudeEntry[];
  currentDate: Date;
  onGroupChanged?: () => Promise<void> | void;
  onCheer?: (habitId: string) => void;
  onViewDetails?: (habitId: string) => void;
}

const mapGroupRow = (row: HabitGroupRow): HabitShareGroup => ({
  id: row.id,
  name: row.name,
  description: row.description || '',
  createdBy: row.created_by,
  createdByName: row.created_by_name || 'Creator',
  createdByEmail: row.created_by_email || '',
  memberIds: row.member_ids || [],
  memberCount: row.member_count || 0,
  isPublic: Boolean(row.is_public),
  createdAt: row.created_at,
  updatedAt: row.updated_at || row.created_at,
});

const mapMemberRow = (row: HabitGroupMemberRow): GroupMember => ({
  id: row.id,
  groupId: row.group_id,
  userId: row.user_id,
  userName: row.user_name || 'Member',
  userEmail: row.user_email || '',
  role: row.role === 'admin' ? 'admin' : 'member',
  joinedAt: row.joined_at || new Date().toISOString(),
});

export function Groups({
  currentUser,
  friends,
  habits,
  gratitudeEntries,
  currentDate,
  onGroupChanged,
  onCheer,
  onViewDetails,
}: GroupsProps) {
  const { toast } = useToast();
  const [groups, setGroups] = React.useState<HabitShareGroup[]>([]);
  const [groupMembers, setGroupMembers] = React.useState<Record<string, GroupMember[]>>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = React.useState(false);
  const [isActivityOpen, setIsActivityOpen] = React.useState(false);
  const [activeGroupId, setActiveGroupId] = React.useState<string | null>(null);
  const [groupName, setGroupName] = React.useState('');
  const [groupDescription, setGroupDescription] = React.useState('');
  const [isPublic, setIsPublic] = React.useState(false);
  const [selectedFriends, setSelectedFriends] = React.useState<string[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [joinGroupId, setJoinGroupId] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [actionLoadingGroupId, setActionLoadingGroupId] = React.useState<string | null>(null);
  const [publicGroups, setPublicGroups] = React.useState<HabitShareGroup[]>([]);

  const currentUserId = currentUser?.id || '';

  const loadGroups = React.useCallback(async () => {
    if (!currentUserId) return;

    try {
      const { data: userGroups, error: groupsError } = await supabase
        .from('habit_groups')
        .select('*')
        .or(`created_by.eq.${currentUserId},member_ids.cs.{${currentUserId}}`);

      if (groupsError) throw groupsError;

      const mappedGroups = (userGroups || []).map((row) => mapGroupRow(row as HabitGroupRow));
      setGroups(mappedGroups);

      const { data: allPublicGroups, error: publicGroupsError } = await supabase
        .from('habit_groups')
        .select('*')
        .eq('is_public', true);
      if (!publicGroupsError) {
        const mine = new Set(mappedGroups.map((group) => group.id));
        setPublicGroups(
          (allPublicGroups || [])
            .map((row) => mapGroupRow(row as HabitGroupRow))
            .filter((group) => !mine.has(group.id)),
        );
      }

      const membersMap: Record<string, GroupMember[]> = {};
      for (const group of mappedGroups) {
        const { data: members, error: membersError } = await supabase
          .from('habit_group_members')
          .select('*')
          .eq('group_id', group.id);

        if (!membersError) {
          membersMap[group.id] = (members || []).map((row) => mapMemberRow(row as HabitGroupMemberRow));
        } else {
          membersMap[group.id] = (group.memberIds || []).map((id) => ({
            id: `fallback_${group.id}_${id}`,
            groupId: group.id,
            userId: id,
            userName: id === currentUserId ? currentUser?.name || 'You' : 'Member',
            userEmail: id === currentUserId ? currentUser?.email || '' : '',
            role: id === group.createdBy ? 'admin' : 'member',
            joinedAt: group.createdAt,
          }));
        }
      }
      setGroupMembers(membersMap);
    } catch (error) {
      console.error('Failed to load groups:', error);
      toast({ title: 'Groups load failed', description: 'Could not load group data right now.', variant: 'destructive' });
    }
  }, [currentUser?.email, currentUser?.name, currentUserId, toast]);

  React.useEffect(() => {
    if (!currentUserId) return;
    loadGroups();
  }, [currentUserId, loadGroups]);

  const createGroup = async () => {
    if (!currentUserId || !groupName.trim()) return;

    setLoading(true);
    try {
      const groupId = `group_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const memberIds = [currentUserId, ...selectedFriends];
      const groupPayload = {
        id: groupId,
        name: groupName.trim(),
        description: groupDescription.trim(),
        created_by: currentUserId,
        created_by_name: currentUser?.name || 'Creator',
        created_by_email: currentUser?.email || '',
        member_ids: memberIds,
        member_count: memberIds.length,
        is_public: isPublic,
      };

      const { error: groupError } = await supabase.from('habit_groups').insert(groupPayload);
      if (groupError) throw groupError;

      const memberRows = memberIds.map((id) => {
        const friend = friends.find((f) => f.id === id);
        return {
          id: `member_${Date.now()}_${id}`,
          group_id: groupId,
          user_id: id,
          user_name: id === currentUserId ? currentUser?.name || 'You' : friend?.name || 'Member',
          user_email: id === currentUserId ? currentUser?.email || '' : friend?.email || '',
          role: id === currentUserId ? 'admin' : 'member',
        };
      });
      const { error: membersError } = await supabase.from('habit_group_members').insert(memberRows);
      if (membersError) {
        console.warn('Could not insert member rows:', membersError);
      }

      setGroupName('');
      setGroupDescription('');
      setIsPublic(false);
      setSelectedFriends([]);
      setIsCreateDialogOpen(false);
      await loadGroups();
      await onGroupChanged?.();
      toast({ title: 'Group created', description: 'Your group is ready for shared habits and gratitude.' });
    } catch (error) {
      console.error('Failed to create group:', error);
      toast({ title: 'Create failed', description: 'Could not create the group right now.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async (targetGroupId?: string) => {
    if (!currentUserId) return;
    const groupId = (targetGroupId || joinGroupId).trim();
    if (!groupId) {
      toast({ title: 'Group ID required', description: 'Enter a group ID or choose a public group.', variant: 'destructive' });
      return;
    }

    setActionLoadingGroupId(groupId);
    try {
      const { data: groupData, error: groupError } = await supabase
        .from('habit_groups')
        .select('*')
        .eq('id', groupId)
        .maybeSingle();
      if (groupError) throw groupError;
      if (!groupData) {
        toast({ title: 'Group not found', description: 'No group exists with this ID.', variant: 'destructive' });
        return;
      }

      const group = mapGroupRow(groupData as HabitGroupRow);
      if (!group.isPublic && group.createdBy !== currentUserId) {
        toast({ title: 'Private group', description: 'You can only join private groups if creator adds you.', variant: 'destructive' });
        return;
      }

      if ((group.memberIds || []).includes(currentUserId)) {
        toast({ title: 'Already joined', description: `You are already part of "${group.name}".` });
        return;
      }

      const nextMemberIds = [...(group.memberIds || []), currentUserId];

      const { error: addMemberError } = await supabase.from('habit_group_members').insert({
        id: `member_${Date.now()}_${currentUserId}`,
        group_id: group.id,
        user_id: currentUserId,
        user_name: currentUser?.name || 'Member',
        user_email: currentUser?.email || '',
        role: 'member',
      });
      if (addMemberError) {
        console.warn('Could not insert group member row:', addMemberError);
      }

      const { error: updateGroupError } = await supabase
        .from('habit_groups')
        .update({
          member_ids: nextMemberIds,
          member_count: nextMemberIds.length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', group.id);
      if (updateGroupError) {
        console.warn('Could not update group member_ids/member_count:', updateGroupError);
      }

      setJoinGroupId('');
      setIsJoinDialogOpen(false);
      await loadGroups();
      await onGroupChanged?.();
      toast({ title: 'Group joined', description: `You joined "${group.name}".` });
    } catch (error) {
      console.error('Failed to join group:', error);
      toast({ title: 'Join failed', description: 'Could not join this group right now.', variant: 'destructive' });
    } finally {
      setActionLoadingGroupId(null);
    }
  };

  const leaveGroup = async (group: HabitShareGroup) => {
    if (!currentUserId) return;
    setActionLoadingGroupId(group.id);
    try {
      const nextMemberIds = (group.memberIds || []).filter((id) => id !== currentUserId);
      const { error: updateError } = await supabase
        .from('habit_groups')
        .update({
          member_ids: nextMemberIds,
          member_count: nextMemberIds.length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', group.id);
      if (updateError) throw updateError;

      await supabase.from('habit_group_members').delete().eq('group_id', group.id).eq('user_id', currentUserId);
      await loadGroups();
      await onGroupChanged?.();
      toast({ title: 'Group left', description: `You left "${group.name}".` });
    } catch (error) {
      console.error('Failed to leave group:', error);
      toast({ title: 'Leave failed', description: 'Could not leave group right now.', variant: 'destructive' });
    } finally {
      setActionLoadingGroupId(null);
    }
  };

  const deleteGroup = async (group: HabitShareGroup) => {
    setActionLoadingGroupId(group.id);
    try {
      await supabase.from('habit_group_members').delete().eq('group_id', group.id);
      const { error } = await supabase.from('habit_groups').delete().eq('id', group.id);
      if (error) throw error;
      await loadGroups();
      await onGroupChanged?.();
      toast({ title: 'Group deleted', description: `"${group.name}" has been deleted.` });
    } catch (error) {
      console.error('Failed to delete group:', error);
      toast({ title: 'Delete failed', description: 'Could not delete group right now.', variant: 'destructive' });
    } finally {
      setActionLoadingGroupId(null);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends((prev) => (prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]));
  };

  const filteredFriends = friends.filter(
    (friend) =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeGroup = activeGroupId ? groups.find((g) => g.id === activeGroupId) || null : null;
  const activeGroupMembers = activeGroup
    ? (groupMembers[activeGroup.id] || []).map((member) => ({
        id: member.userId,
        name: member.userName,
        email: member.userEmail,
        avatarUrl: '',
      }))
    : [];

  return (
    <div className="space-y-6">
      <Card className="creative-card border-none bg-[linear-gradient(140deg,rgba(241,245,255,0.95),rgba(255,255,255,0.84))]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                Groups
              </CardTitle>
              <CardDescription>Create groups to share habits and gratitude with multiple friends.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                    <Users className="h-4 w-4 mr-2" />
                    Join Group
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Join Group</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Group ID</label>
                      <div className="mt-2 flex gap-2">
                        <Input
                          value={joinGroupId}
                          onChange={(e) => setJoinGroupId(e.target.value)}
                          placeholder="Paste group ID..."
                        />
                        <Button
                          onClick={() => joinGroup()}
                          disabled={!joinGroupId.trim() || actionLoadingGroupId === joinGroupId.trim()}
                        >
                          Join
                        </Button>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-2">Public Groups</div>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {publicGroups.length === 0 ? (
                          <div className="rounded-lg border border-dashed p-4 text-sm text-slate-500">
                            No public groups available right now.
                          </div>
                        ) : (
                          publicGroups.map((group) => (
                            <div key={group.id} className="rounded-xl border bg-white p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="font-semibold text-slate-900">{group.name}</div>
                                  {group.description ? <div className="text-xs text-slate-500 mt-1">{group.description}</div> : null}
                                  <div className="text-[11px] text-slate-400 mt-1">{group.memberCount} members</div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => joinGroup(group.id)}
                                  disabled={actionLoadingGroupId === group.id}
                                >
                                  {actionLoadingGroupId === group.id ? 'Joining...' : 'Join'}
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Group
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Group</DialogTitle>
                  </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Group Name</label>
                    <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Enter group name..." className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description (Optional)</label>
                    <Textarea value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} placeholder="Describe your group's purpose..." className="mt-1" rows={3} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="isPublic" className="text-sm">
                      Make group public (anyone can join)
                    </label>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Add Friends</label>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search friends..." className="mb-2" />
                      {filteredFriends.map((friend) => (
                        <div
                          key={friend.id}
                          onClick={() => toggleFriendSelection(friend.id)}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedFriends.includes(friend.id) ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50'
                          }`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={friend.avatarUrl} />
                            <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{friend.name}</div>
                            <div className="text-xs text-gray-500">{friend.email}</div>
                          </div>
                          {selectedFriends.includes(friend.id) ? (
                            <div className="text-indigo-600">
                              <UserPlus className="h-4 w-4" />
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={createGroup} disabled={loading || !groupName.trim()} className="flex-1">
                      {loading ? 'Creating...' : 'Create Group'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => {
          const members = groupMembers[group.id] || [];
          const isCreator = group.createdBy === currentUserId;
          const actionLoading = actionLoadingGroupId === group.id;
          return (
            <Card key={group.id} className="creative-card border-none bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(248,250,255,0.84))]">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-slate-900">{group.name}</CardTitle>
                    {group.description ? <CardDescription className="mt-1 text-sm">{group.description}</CardDescription> : null}
                  </div>
                  {isCreator ? (
                    <Badge variant="secondary" className="text-xs">
                      <Crown className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users className="h-4 w-4 text-slate-400" />
                    {group.memberCount} members
                  </div>

                  <div className="flex -space-x-2">
                    {members.slice(0, 5).map((member) => (
                      <Avatar key={member.id} className="h-8 w-8 border-2 border-white">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-xs">{member.userName.charAt(0)}</AvatarFallback>
                      </Avatar>
                    ))}
                    {group.memberCount > 5 ? (
                      <div className="h-8 w-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center">
                        <span className="text-xs font-medium text-slate-600">+{group.memberCount - 5}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setActiveGroupId(group.id);
                        setIsActivityOpen(true);
                      }}
                    >
                      <Activity className="h-3.5 w-3.5 mr-2" />
                      View Group Activity
                    </Button>

                    {isCreator ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs"
                        disabled={actionLoading}
                        onClick={() => {
                          if (window.confirm(`Delete "${group.name}"? This cannot be undone.`)) {
                            void deleteGroup(group);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        {actionLoading ? 'Deleting...' : 'Delete Group'}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-rose-200 text-rose-600 hover:bg-rose-50"
                        disabled={actionLoading}
                        onClick={() => {
                          if (window.confirm(`Leave "${group.name}"?`)) {
                            void leaveGroup(group);
                          }
                        }}
                      >
                        <LogOut className="h-3.5 w-3.5 mr-2" />
                        {actionLoading ? 'Leaving...' : 'Leave Group'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">No groups yet</h3>
          <p className="text-slate-500 mb-4">Create your first group to start sharing habits and gratitude with multiple friends.</p>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Group
          </Button>
        </div>
      ) : null}

      <Dialog open={isActivityOpen} onOpenChange={setIsActivityOpen}>
        <DialogContent className="max-w-5xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{activeGroup ? `${activeGroup.name} Activity` : 'Group Activity'}</DialogTitle>
          </DialogHeader>
          {activeGroup ? (
            <GroupFeed
              group={activeGroup}
              habits={habits}
              gratitudeEntries={gratitudeEntries}
              members={activeGroupMembers}
              currentUser={{
                id: currentUserId,
                name: currentUser?.name || 'You',
                email: currentUser?.email || '',
                avatarUrl: '',
              }}
              currentDate={currentDate}
              onCheer={onCheer}
              onViewDetails={onViewDetails}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
