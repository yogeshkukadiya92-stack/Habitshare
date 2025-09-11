

export type KRAStatus = 'On Track' | 'At Risk' | 'Completed' | 'Pending';
export type UserRole = 'Admin' | 'Manager' | 'Employee';
export type PermissionLevel = 'none' | 'view' | 'edit' | 'download' | 'employee_only';

export interface EmployeePermissions {
    employees: PermissionLevel;
    routine_tasks: PermissionLevel;
    leaves: PermissionLevel;
    attendance: PermissionLevel;
    expenses: PermissionLevel;
    habit_tracker: PermissionLevel;
    holidays: PermissionLevel;
    recruitment: PermissionLevel;
    hr_calendar: PermissionLevel;
    settings: PermissionLevel;
}

export interface Employee {
  id: string;
  name: string;
  avatarUrl: string;
  branch?: string;
  isManager?: boolean;
  email?: string;
  role?: UserRole;
  address?: string;
  joiningDate?: Date;
  birthDate?: Date;
  permissions?: EmployeePermissions;
  familyMobileNumber?: string;
  extraLeaves?: number;
}

export interface ActionItem {
  id: string;
  name: string;
  dueDate: Date;
  isCompleted: boolean;
  weightage: number;
}

export interface KRA {
  id:string;
  taskDescription?: string;
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
  handover?: string;
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
    description?: string;
    employee: Employee;
    assignedDate: Date;
    dueDate: Date;
    status: RoutineTaskStatus;
    priority: 'Low' | 'Medium' | 'High';
    remarks?: string;
}

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Leave {
    id: string;
    employee: Employee;
    startDate: Date;
    endDate: Date;
    reason: string;
    status: LeaveStatus;
    duration?: number;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Half-day';

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
  deadline?: string; // e.g. "14:30"
}

export type HolidayType = 'Full Day' | 'Half Day';

export interface Holiday {
    id: string;
    name: string;
    date: Date;
    type: HolidayType;
}

export type RecruitmentStatus = 'Applied' | 'Screening' | 'Interview' | 'Second Round' | 'Offered' | 'Hired' | 'Rejected' | 'Comment';

export interface Recruit {
    id: string;
    name: string;
    email: string;
    phone: string;
    position: string;
    branch?: string;
    appliedDate: Date;
    status: RecruitmentStatus;
    notes?: string;
    avatarUrl: string;
    comment?: string;
    expectedSalary?: number;
    workExperience?: string;
    qualification?: string;
    location?: string;
    resumeUrl?: string;
}
