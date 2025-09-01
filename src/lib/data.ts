
import { v4 as uuidv4 } from 'uuid';
import type { KRA, RoutineTask, Leave, Attendance, Expense, Habit, Holiday, Recruit } from './types';

export const mockKras: KRA[] = [
  {
    id: 'KRA-001',
    taskDescription: 'Develop and launch the new customer portal by Q3 end.',
    employee: {
      id: 'EMP-001',
      name: 'Alice Johnson',
      avatarUrl: 'https://placehold.co/32x32.png',
      branch: 'Engineering',
      email: 'connect@luvfitnessworld.com',
      role: 'Admin',
      address: '123 Tech Park, Bangalore',
      joiningDate: new Date('2022-01-10'),
    },
    progress: 67,
    status: 'On Track',
    weightage: 15,
    marksAchieved: 10,
    bonus: 0,
    penalty: 0,
    startDate: new Date('2024-07-01'),
    endDate: new Date('2024-09-30'),
    actions: [
      { id: uuidv4(), description: 'Finalize UI mockups', dueDate: new Date('2024-07-15'), isCompleted: true },
      { id: uuidv4(), description: 'Develop backend APIs', dueDate: new Date('2024-08-10'), isCompleted: true },
      { id: uuidv4(), description: 'Frontend implementation', dueDate: new Date('2024-09-01'), isCompleted: false },
    ]
  },
  {
    id: 'KRA-002',
    taskDescription: 'Increase organic search traffic by 20% over the next quarter.',
    employee: {
      id: 'EMP-002',
      name: 'Bob Williams',
      avatarUrl: 'https://placehold.co/32x32.png',
      branch: 'Marketing',
      role: 'Manager',
      address: '456 Market St, Mumbai',
      joiningDate: new Date('2021-11-20'),
    },
    progress: 25,
    status: 'At Risk',
    weightage: 20,
    marksAchieved: 5,
    bonus: 0,
    penalty: 2,
    startDate: new Date('2024-08-15'),
    endDate: new Date('2024-11-15'),
     actions: [
      { id: uuidv4(), description: 'Keyword research', dueDate: new Date('2024-08-25'), isCompleted: true },
      { id: uuidv4(), description: 'Create 10 blog posts', dueDate: new Date('2024-09-25'), isCompleted: false },
      { id: uuidv4(), description: 'Build 20 backlinks', dueDate: new Date('2024-10-25'), isCompleted: false },
      { id: uuidv4(), description: 'Optimize on-page SEO', dueDate: new Date('2024-11-05'), isCompleted: false },
    ]
  },
  {
    id: 'KRA-003',
    taskDescription: 'Reduce customer support ticket resolution time by 15%.',
    employee: {
      id: 'EMP-003',
      name: 'Charlie Brown',
      avatarUrl: 'https://placehold.co/32x32.png',
      branch: 'Support',
      role: 'Employee',
      address: '789 Service Lane, Pune',
      joiningDate: new Date('2023-02-15'),
    },
    progress: 90,
    status: 'On Track',
    weightage: 10,
    marksAchieved: 9,
    bonus: 0,
    penalty: 0,
    startDate: new Date('2024-07-10'),
    endDate: new Date('2024-10-10'),
    actions: []
  },
  {
    id: 'KRA-004',
    taskDescription: 'Achieve a 95% customer satisfaction score for Q3.',
    employee: {
      id: 'EMP-004',
      name: 'Diana Prince',
      avatarUrl: 'https://placehold.co/32x32.png',
      branch: 'Support',
      role: 'Employee'
    },
    progress: 100,
    status: 'Completed',
    weightage: 15,
    marksAchieved: 15,
    bonus: 2,
    penalty: 0,
    startDate: new Date('2024-07-01'),
    endDate: new Date('2024-09-30'),
    actions: []
  },
  {
    id: 'KRA-005',
    taskDescription: 'Onboard 5 new enterprise clients in the next six months.',
    employee: {
      id: 'EMP-005',
      name: 'Ethan Hunt',
      avatarUrl: 'https://placehold.co/32x32.png',
      branch: 'Sales',
      role: 'Manager'
    },
    progress: 20,
    status: 'On Track',
    weightage: 25,
    marksAchieved: 5,
    bonus: 0,
    penalty: 0,
    startDate: new Date('2024-09-01'),
    endDate: new Date('2025-03-01'),
    actions: [
        { id: uuidv4(), description: 'Identify 50 potential leads', dueDate: new Date('2024-09-30'), isCompleted: true },
        { id: uuidv4(), description: 'Conduct 20 product demos', dueDate: new Date('2024-11-30'), isCompleted: false },
    ]
  },
  {
    id: 'KRA-006',
    taskDescription: 'Finalize the 2025 product roadmap.',
    employee: {
      id: 'EMP-006',
      name: 'Fiona Glenanne',
      avatarUrl: 'https://placehold.co/32x32.png',
      branch: 'Engineering',
      role: 'Manager'
    },
    progress: 0,
    status: 'Pending',
    weightage: 5,
    marksAchieved: 0,
    bonus: 0,
    penalty: 0,
    startDate: new Date('2024-10-01'),
    endDate: new Date('2024-10-31'),
    actions: []
  },
  {
    id: 'KRA-007',
    taskDescription: 'Sell 1500 units of Product X.',
    employee: {
      id: 'EMP-007',
      name: 'Amara Ray',
      avatarUrl: 'https://placehold.co/32x32.png',
      branch: 'Sales',
      role: 'Employee'
    },
    progress: 93,
    status: 'On Track',
    weightage: 15,
    marksAchieved: 14,
    bonus: 0,
    penalty: 0,
    startDate: new Date('2024-09-01'),
    endDate: new Date('2024-12-31'),
    actions: []
  },
   {
    id: 'KRA-008',
    taskDescription: 'Increase customer retention by 5%.',
    employee: {
      id: 'EMP-001',
      name: 'Alice Johnson',
      avatarUrl: 'https://placehold.co/32x32.png',
      branch: 'Engineering',
      email: 'connect@luvfitnessworld.com',
      role: 'Admin'
    },
    progress: 50,
    status: 'On Track',
    weightage: 10,
    marksAchieved: 5,
    bonus: 0,
    penalty: 0,
    startDate: new Date('2024-10-01'),
    endDate: new Date('2024-12-31'),
    actions: []
  },
];


export const mockRoutineTasks: RoutineTask[] = [
    {
        id: 'RT-001',
        title: 'Daily Standup Meeting',
        description: 'Attend the daily standup meeting to report progress and impediments.',
        employee: { id: 'EMP-001', name: 'Alice Johnson', avatarUrl: 'https://placehold.co/32x32.png', branch: 'Engineering' },
        dueDate: new Date(),
        status: 'To Do',
        priority: 'High'
    },
    {
        id: 'RT-002',
        title: 'Update CRM with new leads',
        description: 'Ensure all new leads from the past week are entered and categorized in the CRM.',
        employee: { id: 'EMP-005', name: 'Ethan Hunt', avatarUrl: 'https://placehold.co/32x32.png', branch: 'Sales' },
        dueDate: new Date(new Date().setDate(new Date().getDate() + 2)),
        status: 'In Progress',
        priority: 'Medium'
    },
    {
        id: 'RT-003',
        title: 'Weekly Social Media Posting',
        description: 'Schedule all social media posts for the upcoming week across all platforms.',
        employee: { id: 'EMP-002', name: 'Bob Williams', avatarUrl: 'https://placehold.co/32x32.png', branch: 'Marketing' },
        dueDate: new Date(new Date().setDate(new Date().getDate() + 3)),
        status: 'To Do',
        priority: 'Medium'
    },
    {
        id: 'RT-004',
        title: 'Review and reply to support tickets',
        description: 'Go through the high-priority support ticket queue and ensure all are responded to.',
        employee: { id: 'EMP-003', name: 'Charlie Brown', avatarUrl: 'https://placehold.co/32x32.png', branch: 'Support' },
        dueDate: new Date(),
        status: 'Completed',
        priority: 'High'
    }
];

export const mockLeaves: Leave[] = [
    {
        id: 'L-001',
        employee: { id: 'EMP-002', name: 'Bob Williams', avatarUrl: 'https://placehold.co/32x32.png', branch: 'Marketing' },
        leaveType: 'Annual',
        startDate: new Date(new Date().setDate(new Date().getDate() + 10)),
        endDate: new Date(new Date().setDate(new Date().getDate() + 15)),
        reason: 'Family vacation to the mountains.',
        status: 'Approved'
    },
    {
        id: 'L-002',
        employee: { id: 'EMP-004', name: 'Diana Prince', avatarUrl: 'https://placehold.co/32x32.png', branch: 'Support' },
        leaveType: 'Sick',
        startDate: new Date(new Date().setDate(new Date().getDate() - 1)),
        endDate: new Date(new Date().setDate(new Date().getDate())),
        reason: 'Fever and cold.',
        status: 'Approved'
    },
     {
        id: 'L-003',
        employee: { id: 'EMP-005', name: 'Ethan Hunt', avatarUrl: 'https://placehold.co/32x32.png', branch: 'Sales' },
        leaveType: 'Casual',
        startDate: new Date(new Date().setDate(new Date().getDate() + 5)),
        endDate: new Date(new Date().setDate(new Date().getDate() + 5)),
        reason: 'Personal appointment.',
        status: 'Pending'
    },
     {
        id: 'L-004',
        employee: { id: 'EMP-001', name: 'Alice Johnson', avatarUrl: 'https://placehold.co/32x32.png', branch: 'Engineering' },
        leaveType: 'Annual',
        startDate: new Date(new Date().setDate(new Date().getDate() + 20)),
        endDate: new Date(new Date().setDate(new Date().getDate() + 22)),
        reason: 'Attending a tech conference.',
        status: 'Rejected'
    }
];

export const mockAttendances: Attendance[] = [
    {
        id: 'A-001',
        employee: { id: 'EMP-001', name: 'Alice Johnson', avatarUrl: 'https://placehold.co/32x32.png', branch: 'Engineering' },
        date: new Date(),
        status: 'Present'
    },
    {
        id: 'A-002',
        employee: { id: 'EMP-002', name: 'Bob Williams', avatarUrl: 'https://placehold.co/32x32.png', branch: 'Marketing' },
        date: new Date(),
        status: 'Absent'
    },
    {
        id: 'A-003',
        employee: { id: 'EMP-003', name: 'Charlie Brown', avatarUrl: 'https://placehold.co/32x32.png', branch: 'Support' },
        date: new Date(),
        status: 'Half-day'
    },
    {
        id: 'A-004',
        employee: { id: 'EMP-005', name: 'Ethan Hunt', avatarUrl: 'https://placehold.co/32x32.png', branch: 'Sales' },
        date: new Date(),
        status: 'On Leave'
    }
];

export const mockExpenses: Expense[] = [
    {
        id: 'EXP-001',
        employee: { id: 'EMP-005', name: 'Ethan Hunt', avatarUrl: 'https://placehold.co/32x32.png', branch: 'Sales' },
        date: new Date(new Date().setDate(new Date().getDate() - 5)),
        expenseType: 'Travel',
        description: 'Client meeting in Pune',
        distanceInKm: 320,
        ratePerKm: 15,
        totalAmount: 320 * 15,
        status: 'Approved'
    },
    {
        id: 'EXP-002',
        employee: { id: 'EMP-001', name: 'Alice Johnson', avatarUrl: 'https://placehold.co/32x32.png', branch: 'Engineering' },
        date: new Date(new Date().setDate(new Date().getDate() - 10)),
        expenseType: 'Accommodation',
        description: 'Hotel stay for Mumbai conference',
        amount: 8000,
        totalAmount: 8000,
        status: 'Paid'
    },
    {
        id: 'EXP-003',
        employee: { id: 'EMP-002', name: 'Bob Williams', avatarUrl: 'https://placehold.co/32x32.png', branch: 'Marketing' },
        date: new Date(new Date().setDate(new Date().getDate() - 2)),
        expenseType: 'Food',
        description: 'Team lunch with marketing agency',
        amount: 2500,
        totalAmount: 2500,
        status: 'Pending'
    },
    {
        id: 'EXP-004',
        employee: { id: 'EMP-005', name: 'Ethan Hunt', avatarUrl: 'https://placehold.co/32x32.png', branch: 'Sales' },
        date: new Date(new Date().setDate(new Date().getDate() - 1)),
        expenseType: 'Food',
        description: 'Dinner with prospective client',
        amount: 1800,
        totalAmount: 1800,
        status: 'Rejected'
    },
];


export const mockHabits: Habit[] = [
    {
        id: 'H-001',
        name: 'Daily Coding Challenge',
        description: 'Solve one coding problem every day on LeetCode.',
        employee: { id: 'EMP-001', name: 'Alice Johnson', avatarUrl: 'https://placehold.co/32x32.png', branch: 'Engineering' },
        checkIns: [new Date(2024, 7, 1), new Date(2024, 7, 2), new Date(2024, 7, 4)],
        goalDays: 30,
        startDate: new Date(2024, 7, 1)
    },
    {
        id: 'H-002',
        name: 'Read 10 Pages Daily',
        description: 'Read at least 10 pages of a non-fiction book.',
        employee: { id: 'EMP-002', name: 'Bob Williams', avatarUrl: 'https://placehold.co/32x32.png', branch: 'Marketing' },
        checkIns: [new Date(2024, 7, 1), new Date(2024, 7, 3), new Date(2024, 7, 5)],
        goalDays: 30,
        startDate: new Date(2024, 7, 1)
    }
];

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

export const mockRecruits: Recruit[] = [
    {
        id: uuidv4(),
        name: 'Gita Patel',
        email: 'gita.p@example.com',
        phone: '9876543210',
        position: 'Frontend Developer',
        appliedDate: new Date('2024-07-20'),
        status: 'Interview',
        notes: 'Strong portfolio, good communication skills.',
        avatarUrl: 'https://placehold.co/32x32.png',
    },
    {
        id: uuidv4(),
        name: 'Rohan Sharma',
        email: 'rohan.sharma@example.com',
        phone: '9876543211',
        position: 'Backend Developer',
        appliedDate: new Date('2024-07-18'),
        status: 'Offered',
        notes: 'Excellent problem solver, team player.',
        avatarUrl: 'https://placehold.co/32x32.png',
    },
    {
        id: uuidv4(),
        name: 'Priya Singh',
        email: 'priya.s@example.com',
        phone: '9876543212',
        position: 'UI/UX Designer',
        appliedDate: new Date('2024-07-22'),
        status: 'Applied',
        notes: '',
        avatarUrl: 'https://placehold.co/32x32.png',
    }
];
