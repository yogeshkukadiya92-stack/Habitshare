export interface HabitShareUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
}

export interface HabitShareHabit {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  name: string;
  description?: string;
  checkIns: string[];
  cheers?: number;
  isShared: boolean;
  sharedWithIds?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface HabitFriendRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  receiverId: string;
  receiverName: string;
  receiverEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export type UserRole = 'Admin' | 'Employee';
export type PermissionLevel = 'none' | 'view' | 'edit' | 'download' | 'employee_only';

export interface EmployeePermissions {
  habit_tracker: PermissionLevel;
  settings: PermissionLevel;
}

export interface Employee {
  id: string;
  name: string;
  avatarUrl: string;
  branch?: string;
  email?: string;
  role?: UserRole;
  permissions?: EmployeePermissions;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Habit {
  id: string;
  name: string;
  description: string;
}
