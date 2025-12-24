
// This file is no longer used. All data is now fetched from and saved to Firebase Firestore.
// The mock data has been removed to prevent confusion.
import { v4 as uuidv4 } from 'uuid';
import type { KRA, RoutineTask, Leave, Attendance, Expense, Habit, Holiday, Recruit, Employee, Branch } from './types';

// All data has been migrated to Firestore and is managed via the use-data-store.tsx hook.
// These empty arrays are left to prevent breaking any legacy imports, though they should ideally be removed.
export const mockKras: KRA[] = [
    {
    id: '1',
    taskDescription: 'Increase monthly recurring revenue by 15% in Q3.',
    employee: { id: '1', name: 'Rakesh Sharma', avatarUrl: 'https://placehold.co/32x32.png?text=RS', branch: 'Sales', email: 'rakesh.sharma@example.com' },
    progress: 75,
    status: 'On Track',
    weightage: 20,
    marksAchieved: 15,
    bonus: 2,
    penalty: 0,
    startDate: new Date('2024-07-01'),
    endDate: new Date('2024-09-30'),
    actions: [
      { id: 'a1', name: 'Generate 50 new qualified leads', dueDate: new Date('2024-07-31'), isCompleted: true, weightage: 5, updates: [{ id: uuidv4(), date: new Date(), status: 'Completed', comment: 'Achieved 55 leads.', value: 55 }] },
      { id: 'a2', name: 'Conduct 20 product demos', dueDate: new Date('2024-08-31'), isCompleted: false, weightage: 5, updates: [{ id: uuidv4(), date: new Date(), status: 'On Track', comment: '15 demos done.', value: 15 }] },
      { id: 'a3', name: 'Close 10 new deals', dueDate: new Date('2024-09-30'), isCompleted: false, weightage: 10, updates: [{ id: uuidv4(), date: new Date(), status: 'On Track', comment: '7 deals closed.', value: 7 }] }
    ],
    target: 100000,
    achieved: 75000,
  },
  {
    id: '2',
    taskDescription: 'Reduce customer churn rate from 5% to 3% by the end of the year.',
    employee: { id: '2', name: 'Priya Singh', avatarUrl: 'https://placehold.co/32x32.png?text=PS', branch: 'Customer Support', email: 'priya.singh@example.com' },
    progress: 40,
    status: 'At Risk',
    weightage: 15,
    marksAchieved: 6,
    bonus: 0,
    penalty: 1,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    actions: [
      { id: 'b1', name: 'Implement new customer feedback system', dueDate: new Date('2024-03-31'), isCompleted: true, weightage: 5 },
      { id: 'b2', name: 'Achieve a customer satisfaction score of 90%', dueDate: new Date('2024-12-31'), isCompleted: false, weightage: 10, updates: [{ id: uuidv4(), date: new Date(), status: 'At Risk', comment: 'Current CSAT is 85%' }] }
    ],
    target: 3,
    achieved: 4.2,
  },
  {
    id: '3',
    taskDescription: 'Launch the new mobile app for Android and iOS.',
    employee: { id: '3', name: 'Amit Patel', avatarUrl: 'https://placehold.co/32x32.png?text=AP', branch: 'Engineering', email: 'amit.patel@example.com' },
    progress: 100,
    status: 'Completed',
    weightage: 25,
    marksAchieved: 25,
    bonus: 5,
    penalty: 0,
    startDate: new Date('2024-04-01'),
    endDate: new Date('2024-08-31'),
    actions: [],
    target: 1,
    achieved: 1
  },
  {
    id: '4',
    taskDescription: 'Develop and execute a new digital marketing strategy for Q4.',
    employee: { id: '4', name: 'Sneha Gupta', avatarUrl: 'https://placehold.co/32x32.png?text=SG', branch: 'Marketing', email: 'sneha.gupta@example.com' },
    progress: 20,
    status: 'Pending',
    weightage: 15,
    marksAchieved: 3,
    bonus: 0,
    penalty: 0,
    startDate: new Date('2024-10-01'),
    endDate: new Date('2024-12-31'),
    actions: [],
    target: 1,
    achieved: 0.2
  },
   {
    id: '5',
    taskDescription: 'Recruit and onboard 5 new software engineers.',
    employee: { id: '5', name: 'Luv Singh', avatarUrl: 'https://placehold.co/32x32.png?text=LS', branch: 'HR', isManager: true, email: 'connect@luvfitnessworld.com', role: 'Admin' },
    progress: 60,
    status: 'On Track',
    weightage: 10,
    marksAchieved: 6,
    bonus: 0,
    penalty: 0,
    startDate: new Date('2024-09-01'),
    endDate: new Date('2024-11-30'),
    actions: [
       { id: 'c1', name: 'Hire 3 Backend Engineers', dueDate: new Date('2024-10-31'), isCompleted: false, weightage: 6, updates: [{ id: uuidv4(), date: new Date(), status: 'On Track', comment: '2 Hired, 1 in offer stage', value: 2 }] },
       { id: 'c2', name: 'Hire 2 Frontend Engineers', dueDate: new Date('2024-11-30'), isCompleted: false, weightage: 4, updates: [{ id: uuidv4(), date: new Date(), status: 'On Track', comment: '1 hired, 2 interviews scheduled', value: 1 }] }
    ],
    target: 5,
    achieved: 3,
  },
   {
    id: '6',
    taskDescription: 'Improve website loading speed by 30%.',
    employee: { id: '3', name: 'Amit Patel', avatarUrl: 'https://placehold.co/32x32.png?text=AP', branch: 'Engineering', email: 'amit.patel@example.com' },
    progress: 50,
    status: 'On Track',
    weightage: 10,
    marksAchieved: 5,
    bonus: 0,
    penalty: 0,
    startDate: new Date('2024-09-01'),
    endDate: new Date('2024-12-31'),
    actions: [],
    target: 30,
    achieved: 15,
  },
  {
    id: '7',
    taskDescription: 'Employee KRA',
    employee: { id: '6', name: 'Prakash Joshi', avatarUrl: 'https://placehold.co/32x32.png?text=PJ', branch: 'Sales', email: 'prakash.joshi@example.com', role: 'Employee' },
    progress: 50,
    status: 'On Track',
    weightage: 10,
    marksAchieved: 5,
    bonus: 0,
    penalty: 0,
    startDate: new Date('2024-09-01'),
    endDate: new Date('2024-12-31'),
    actions: [],
    target: 30,
    achieved: 15,
  },
  {
    id: '8',
    taskDescription: 'Refactor legacy code for performance improvement.',
    employee: { id: '8', name: 'Riya Shah', avatarUrl: 'https://placehold.co/32x32.png?text=RS', branch: 'Engineering', email: 'riya.shah@example.com', role: 'Employee' },
    progress: 25,
    status: 'Pending',
    weightage: 15,
    marksAchieved: 0,
    bonus: 0,
    penalty: 0,
    startDate: new Date('2024-10-01'),
    endDate: new Date('2025-01-31'),
    actions: [],
    target: 100,
    achieved: 25,
  },
  {
    id: '9',
    taskDescription: 'Expand sales territory to new region.',
    employee: { id: '9', name: 'Yogesh Patel', avatarUrl: 'https://placehold.co/32x32.png?text=YP', branch: 'Sales', email: 'yogesh.patel@example.com', role: 'Employee' },
    progress: 10,
    status: 'On Track',
    weightage: 20,
    marksAchieved: 2,
    bonus: 0,
    penalty: 0,
    startDate: new Date('2024-09-15'),
    endDate: new Date('2024-12-31'),
    actions: [],
    target: 500000,
    achieved: 50000,
  }
];
export const mockRoutineTasks: RoutineTask[] = [
    {
        id: 'rt1',
        title: 'Daily Team Standup',
        description: 'Host the daily standup meeting with the engineering team to track progress.',
        employee: mockKras.find(k => k.employee.id === '3')!.employee,
        assignedDate: new Date(),
        dueDate: new Date(),
        status: 'To Do',
        priority: 'High',
        remarks: 'Check on the status of the new feature.',
    },
    {
        id: 'rt2',
        title: 'Weekly Sales Report',
        description: 'Compile and send the weekly sales report to management.',
        employee: mockKras.find(k => k.employee.id === '1')!.employee,
        assignedDate: new Date(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 4)),
        status: 'In Progress',
        priority: 'Medium',
    }
];
export const mockLeaves: Leave[] = [
    {
        id: 'l1',
        employee: mockKras.find(k => k.employee.id === '2')!.employee,
        startDate: new Date(new Date().setDate(new Date().getDate() - 5)),
        endDate: new Date(new Date().setDate(new Date().getDate() - 3)),
        reason: 'Family function',
        status: 'Approved',
        duration: 3,
    },
    {
        id: 'l2',
        employee: mockKras.find(k => k.employee.id === '4')!.employee,
        startDate: new Date(),
        endDate: new Date(),
        reason: 'Sick leave',
        status: 'Pending',
        duration: 1,
    }
];
export const mockAttendances: Attendance[] = [
    {
        id: 'att1',
        employee: mockKras.find(k => k.employee.id === '1')!.employee,
        date: new Date(),
        status: 'Present'
    },
    {
        id: 'att2',
        employee: mockKras.find(k => k.employee.id === '2')!.employee,
        date: new Date(),
        status: 'Absent'
    },
     {
        id: 'att3',
        employee: mockKras.find(k => k.employee.id === '3')!.employee,
        date: new Date(),
        status: 'Half-day'
    }
];
export const mockExpenses: Expense[] = [
    {
        id: 'exp1',
        employee: mockKras.find(k => k.employee.id === '1')!.employee,
        date: new Date(new Date().setDate(new Date().getDate() - 10)),
        expenseType: 'Travel',
        description: 'Client meeting in Pune',
        distanceInKm: 150,
        ratePerKm: 12,
        totalAmount: 1800,
        status: 'Paid'
    },
     {
        id: 'exp2',
        employee: mockKras.find(k => k.employee.id === '4')!.employee,
        date: new Date(new Date().setDate(new Date().getDate() - 2)),
        expenseType: 'Food',
        description: 'Team lunch for marketing event',
        amount: 2500,
        totalAmount: 2500,
        status: 'Pending'
    },
];
export const mockHabits: Habit[] = [
    {
        id: 'h1',
        name: 'Read for 30 minutes',
        description: 'Read a book related to professional development for 30 minutes every day.',
        employee: mockKras.find(k => k.employee.id === '3')!.employee,
        checkIns: [new Date(new Date().setDate(new Date().getDate() - 1)), new Date(new Date().setDate(new Date().getDate() - 2))],
        goalDays: 30,
        startDate: new Date(new Date().setDate(new Date().getDate() - 5)),
        deadline: '14:30',
    }
];
export const mockHolidays: Holiday[] = [
    {
        id: 'hol1',
        name: 'Diwali',
        date: new Date(new Date().getFullYear(), 10, 1),
        type: 'Full Day'
    },
    {
        id: 'hol2',
        name: 'Christmas',
        date: new Date(new Date().getFullYear(), 11, 25),
        type: 'Full Day'
    }
];
export const mockRecruits: Recruit[] = [
    {
        id: 'rec1',
        name: 'Sunil Kumar',
        email: 'sunil.k@example.com',
        phone: '9876543210',
        position: 'Marketing Head',
        branch: 'Marketing',
        appliedDate: new Date(new Date().setDate(new Date().getDate() - 15)),
        status: 'Interview',
        notes: 'Strong candidate with 10+ years of experience.',
        avatarUrl: `https://placehold.co/32x32.png?text=SK`,
        comment: 'Final round scheduled for next week.',
        expectedSalary: 25,
        workExperience: '10 Years',
        qualification: 'MBA in Marketing',
        location: 'Pune',
        resumeUrl: 'https://example.com'
    }
];

    