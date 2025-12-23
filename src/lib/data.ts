

import { v4 as uuidv4 } from 'uuid';
import type { KRA, RoutineTask, Leave, Attendance, Expense, Habit, Holiday, Recruit } from './types';

export const mockKras: KRA[] = [];


export const mockRoutineTasks: RoutineTask[] = [];

export const mockLeaves: Leave[] = [];

export const mockAttendances: Attendance[] = [];

export const mockExpenses: Expense[] = [];


export const mockHabits: Habit[] = [];

export const mockHolidays: Holiday[] = [
    {
        id: 'HOL-001',
        name: 'Republic Day',
        date: new Date(new Date().getFullYear(), 0, 26),
        type: 'Full Day'
    },
    {
        id: 'HOL-002',
        name: 'Holi',
        date: new Date(new Date().getFullYear(), 2, 25),
        type: 'Full Day'
    },
    {
        id: 'HOL-003',
        name: 'Diwali',
        date: new Date(new Date().getFullYear(), 10, 1),
        type: 'Full Day'
    },
    {
        id: 'HOL-004',
        name: 'Dhanteras (Half Day)',
        date: new Date(new Date().getFullYear(), 9, 29),
        type: 'Half Day'
    },
     {
        id: 'HOL-005',
        name: 'Independence Day',
        date: new Date(new Date().getFullYear(), 7, 15),
        type: 'Full Day'
    }
];

export const mockRecruits: Recruit[] = [];
