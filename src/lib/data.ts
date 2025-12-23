// This file is no longer used. All data is now fetched from and saved to Firebase Firestore.
// The mock data has been removed to prevent confusion.
import { v4 as uuidv4 } from 'uuid';
import type { KRA, RoutineTask, Leave, Attendance, Expense, Habit, Holiday, Recruit, Employee, Branch } from './types';

// All data has been migrated to Firestore and is managed via the use-data-store.tsx hook.
// These empty arrays are left to prevent breaking any legacy imports, though they should ideally be removed.
export const mockKras: KRA[] = [];
export const mockRoutineTasks: RoutineTask[] = [];
export const mockLeaves: Leave[] = [];
export const mockAttendances: Attendance[] = [];
export const mockExpenses: Expense[] = [];
export const mockHabits: Habit[] = [];
export const mockHolidays: Holiday[] = [];
export const mockRecruits: Recruit[] = [];
