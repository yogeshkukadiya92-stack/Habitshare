import type { KRA } from './types';

export const mockKras: KRA[] = [
  {
    id: 'KRA-001',
    taskDescription: 'Develop and launch the new customer portal by Q3 end.',
    employee: {
      id: 'EMP-001',
      name: 'Alice Johnson',
      avatarUrl: 'https://placehold.co/32x32.png',
    },
    progress: 75,
    status: 'On Track',
    weightage: 15,
    marksAchieved: 11,
    startDate: new Date('2024-07-01'),
    endDate: new Date('2024-09-30'),
    weeklyScores: [
      { date: new Date('2024-07-07'), achieved: 80, target: 100 },
      { date: new Date('2024-07-14'), achieved: 85, target: 100 },
    ]
  },
  {
    id: 'KRA-002',
    taskDescription: 'Increase organic search traffic by 20% over the next quarter.',
    employee: {
      id: 'EMP-002',
      name: 'Bob Williams',
      avatarUrl: 'https://placehold.co/32x32.png',
    },
    progress: 40,
    status: 'At Risk',
    weightage: 20,
    marksAchieved: 8,
    startDate: new Date('2024-08-15'),
    endDate: new Date('2024-11-15'),
    weeklyScores: [
      { date: new Date('2024-08-21'), achieved: 50, target: 100 },
      { date: new Date('2024-08-28'), achieved: 55, target: 100 },
    ]
  },
  {
    id: 'KRA-003',
    taskDescription: 'Reduce customer support ticket resolution time by 15%.',
    employee: {
      id: 'EMP-003',
      name: 'Charlie Brown',
      avatarUrl: 'https://placehold.co/32x32.png',
    },
    progress: 90,
    status: 'On Track',
    weightage: 10,
    marksAchieved: 9,
    startDate: new Date('2024-07-10'),
    endDate: new Date('2024-10-10'),
    weeklyScores: []
  },
  {
    id: 'KRA-004',
    taskDescription: 'Achieve a 95% customer satisfaction score for Q3.',
    employee: {
      id: 'EMP-004',
      name: 'Diana Prince',
      avatarUrl: 'https://placehold.co/32x32.png',
    },
    progress: 100,
    status: 'Completed',
    weightage: 15,
    marksAchieved: 15,
    startDate: new Date('2024-07-01'),
    endDate: new Date('2024-09-30'),
    weeklyScores: []
  },
  {
    id: 'KRA-005',
    taskDescription: 'Onboard 5 new enterprise clients in the next six months.',
    employee: {
      id: 'EMP-005',
      name: 'Ethan Hunt',
      avatarUrl: 'https://placehold.co/32x32.png',
    },
    progress: 10,
    status: 'On Track',
    weightage: 25,
    marksAchieved: 2.5,
    startDate: new Date('2024-09-01'),
    endDate: new Date('2025-03-01'),
    weeklyScores: []
  },
  {
    id: 'KRA-006',
    taskDescription: 'Finalize the 2025 product roadmap.',
    employee: {
      id: 'EMP-006',
      name: 'Fiona Glenanne',
      avatarUrl: 'https://placehold.co/32x32.png',
    },
    progress: 0,
    status: 'Pending',
    weightage: 5,
    marksAchieved: 0,
    startDate: new Date('2024-10-01'),
    endDate: new Date('2024-10-31'),
    weeklyScores: []
  },
  {
    id: 'KRA-007',
    taskDescription: 'Sell 1500 units of Product X.',
    employee: {
      id: 'EMP-007',
      name: 'Amara Ray',
      avatarUrl: 'https://placehold.co/32x32.png',
    },
    progress: 93,
    status: 'On Track',
    weightage: 15,
    marksAchieved: 14,
    startDate: new Date('2024-09-01'),
    endDate: new Date('2024-12-31'),
    weeklyScores: [
      { date: new Date('2024-09-07'), achieved: 300, target: 375 },
      { date: new Date('2024-09-14'), achieved: 400, target: 375 },
      { date: new Date('2024-09-21'), achieved: 350, target: 375 },
      { date: new Date('2024-09-28'), achieved: 350, target: 375 },
    ]
  },
   {
    id: 'KRA-008',
    taskDescription: 'Increase customer retention by 5%.',
    employee: {
      id: 'EMP-001',
      name: 'Alice Johnson',
      avatarUrl: 'https://placehold.co/32x32.png',
    },
    progress: 50,
    status: 'On Track',
    weightage: 10,
    marksAchieved: 5,
    startDate: new Date('2024-10-01'),
    endDate: new Date('2024-12-31'),
    weeklyScores: []
  },
];
