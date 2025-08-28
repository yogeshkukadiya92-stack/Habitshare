export type KRAStatus = 'On Track' | 'At Risk' | 'Completed' | 'Pending';

export interface Employee {
  id: string;
  name: string;
  avatarUrl: string;
  branch?: string;
}

export interface ActionItem {
  id: string;
  description: string;
  dueDate: Date;
  isCompleted: boolean;
}

export interface KRA {
  id:string;
  taskDescription: string;
  employee: Employee;
  progress: number;
  status: KRAStatus;
  weightage: number | null;
  marksAchieved: number | null;
  bonus: number | null;
  penalty: number | null;
  startDate: Date;
  endDate: Date;
  actions?: ActionItem[];
}

export interface Branch {
    id: string;
    name: string;
}
