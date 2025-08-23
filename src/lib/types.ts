export type KRAStatus = 'On Track' | 'At Risk' | 'Completed' | 'Pending';

export interface KRA {
  id: string;
  taskDescription: string;
  employee: {
    name: string;
    avatarUrl: string;
  };
  progress: number;
  status: KRAStatus;
  score: number | null;
  startDate: Date;
  endDate: Date;
}
