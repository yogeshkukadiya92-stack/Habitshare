export type KRAStatus = 'On Track' | 'At Risk' | 'Completed' | 'Pending';

export interface Employee {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface WeeklyScore {
  date: Date;
  score: number;
}

export interface KRA {
  id:string;
  taskDescription: string;
  employee: Employee;
  progress: number;
  status: KRAStatus;
  score: number | null;
  startDate: Date;
  endDate: Date;
  target?: number;
  achieved?: number;
  weeklyScores?: WeeklyScore[];
}
