export type KRAStatus = 'On Track' | 'At Risk' | 'Completed' | 'Pending';

export interface Employee {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface WeeklyScore {
  date: Date;
  achieved: number | null;
  target: number | null;
}

export interface KRA {
  id:string;
  taskDescription: string;
  employee: Employee;
  progress: number;
  status: KRAStatus;
  weightage: number | null;
  marksAchieved: number | null;
  startDate: Date;
  endDate: Date;
  weeklyScores?: WeeklyScore[];
}
