

export type KRAStatus = 'On Track' | 'At Risk' | 'Completed' | 'Pending';

export interface Employee {
  id: string;
  name: string;
  avatarUrl: string;
  branch?: string;
  isManager?: boolean;
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
    managerId?: string;
}

export type RoutineTaskStatus = 'To Do' | 'In Progress' | 'Completed';

export interface RoutineTask {
    id: string;
    title: string;
    description: string;
    employee: Employee;
    dueDate: Date;
    status: RoutineTaskStatus;
    priority: 'Low' | 'Medium' | 'High';
}

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';
export type LeaveType = 'Annual' | 'Sick' | 'Casual' | 'Unpaid';

export interface Leave {
    id: string;
    employee: Employee;
    leaveType: LeaveType;
    startDate: Date;
    endDate: Date;
    reason: string;
    status: LeaveStatus;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Half-day' | 'On Leave';

export interface Attendance {
    id: string;
    employee: Employee;
    date: Date;
    status: AttendanceStatus;
}

export type ExpenseStatus = 'Pending' | 'Approved' | 'Rejected' | 'Paid';
export type ExpenseType = 'Travel' | 'Food' | 'Accommodation';

export interface Expense {
    id: string;
    employee: Employee;
    date: Date;
    expenseType: ExpenseType;
    description: string;
    distanceInKm?: number | null;
    ratePerKm?: number | null;
    amount?: number | null;
    totalAmount: number;
    status: ExpenseStatus;
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  employee: Employee;
  checkIns: Date[];
  goalDays: number; // e.g., 30 for a 30-day challenge
  startDate: Date;
}
