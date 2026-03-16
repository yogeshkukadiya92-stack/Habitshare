
'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { collection, doc, deleteDoc, setDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { useFirestore, useUser, useCollection, useMemoFirebase, FirestorePermissionError, errorEmitter } from '@/firebase';
import type { Employee, KRA, Branch, Leave, Expense, RoutineTask, Habit, Holiday, Recruit, Attendance, ActivityLog } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface DataStoreContextType {
  loading: boolean;
  kras: KRA[];
  employees: Employee[];
  branches: Branch[];
  leaves: Leave[];
  expenses: Expense[];
  routineTasks: RoutineTask[];
  habits: Habit[];
  holidays: Holiday[];
  recruits: Recruit[];
  attendances: Attendance[];
  activities: ActivityLog[];
  handleSaveKra: (kra: KRA) => void;
  handleDeleteKra: (kraId: string) => void;
  handleDeleteMultipleKras: (ids: string[]) => void;
  handleSaveEmployee: (employee: Employee) => void;
  handleDeleteEmployee: (employeeId: string) => void;
  handleDeleteMultipleEmployees: (ids: string[]) => void;
  handleSaveLeave: (leave: Leave) => void;
  handleDeleteLeave: (leaveId: string) => void;
  handleDeleteMultipleLeaves: (ids: string[]) => void;
  handleSaveExpense: (expense: Expense) => void;
  handleDeleteExpense: (expenseId: string) => void;
  handleDeleteMultipleExpenses: (ids: string[]) => void;
  handleSaveRoutineTask: (task: RoutineTask) => void;
  handleDeleteRoutineTask: (taskId: string) => void;
  handleDeleteMultipleRoutineTasks: (ids: string[]) => void;
  handleSaveHabit: (habit: Habit) => void;
  handleSaveHoliday: (holiday: Holiday) => void;
  handleDeleteHoliday: (id: string) => void;
  handleDeleteMultipleHolidays: (ids: string[]) => void;
  handleSaveRecruit: (recruit: Recruit) => void;
  handleDeleteRecruit: (id: string) => void;
  handleDeleteMultipleRecruits: (ids: string[]) => void;
  handleSaveAttendance: (attendance: Attendance) => void;
  handleSaveBranch: (branch: Branch) => void;
  handleDeleteBranch: (id: string) => void;
}

const DataStoreContext = createContext<DataStoreContextType | undefined>(undefined);

export const DataStoreProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  const db = useFirestore();

  const usersQuery = useMemoFirebase(() => user ? collection(db, 'users') : null, [db, user]);
  const krasQuery = useMemoFirebase(() => user ? collection(db, 'kras') : null, [db, user]);
  const branchesQuery = useMemoFirebase(() => user ? collection(db, 'branches') : null, [db, user]);
  const leavesQuery = useMemoFirebase(() => user ? collection(db, 'leaves') : null, [db, user]);
  const expensesQuery = useMemoFirebase(() => user ? collection(db, 'expenses') : null, [db, user]);
  const routineTasksQuery = useMemoFirebase(() => user ? collection(db, 'routineTasks') : null, [db, user]);
  const habitsQuery = useMemoFirebase(() => user ? collection(db, 'habits') : null, [db, user]);
  const holidaysQuery = useMemoFirebase(() => user ? collection(db, 'holidays') : null, [db, user]);
  const recruitsQuery = useMemoFirebase(() => user ? collection(db, 'recruits') : null, [db, user]);
  const attendancesQuery = useMemoFirebase(() => user ? collection(db, 'attendances') : null, [db, user]);
  const activitiesQuery = useMemoFirebase(() => user ? query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(50)) : null, [db, user]);

  const { data: users, isLoading: usersLoading } = useCollection<Employee>(usersQuery);
  const { data: krasData, isLoading: krasLoading } = useCollection<KRA>(krasQuery);
  const { data: branches, isLoading: branchesLoading } = useCollection<Branch>(branchesQuery);
  const { data: leaves, isLoading: leavesLoading } = useCollection<Leave>(leavesQuery);
  const { data: expenses, isLoading: expensesLoading } = useCollection<Expense>(expensesQuery);
  const { data: routineTasks, isLoading: routineTasksLoading } = useCollection<RoutineTask>(routineTasksQuery);
  const { data: habits, isLoading: habitsLoading } = useCollection<Habit>(habitsQuery);
  const { data: holidays, isLoading: holidaysLoading } = useCollection<Holiday>(holidaysQuery);
  const { data: recruits, isLoading: recruitsLoading } = useCollection<Recruit>(recruitsQuery);
  const { data: attendances, isLoading: attendancesLoading } = useCollection<Attendance>(attendancesQuery);
  const { data: activitiesData } = useCollection<ActivityLog>(activitiesQuery);

  const employees = useMemo(() => users || [], [users]);
  const kras = useMemo(() => krasData || [], [krasData]);
  const activities = useMemo(() => activitiesData || [], [activitiesData]);

  const loading = !user || usersLoading || krasLoading;

  const currentActorName = useMemo(() => {
    return employees.find(e => e.id === user?.uid)?.name || user?.email || 'System';
  }, [employees, user]);

  const logGlobalActivity = (action: string, employeeName: string, type: ActivityLog['type'], details?: string) => {
    const id = uuidv4();
    const docRef = doc(db, 'activities', id);
    setDoc(docRef, {
        id,
        timestamp: serverTimestamp(),
        actorName: currentActorName,
        employeeName,
        action,
        type,
        details
    }).catch(err => console.error("Failed to log activity:", err));
  };

  const handleSaveKra = (kra: KRA) => {
    const docRef = doc(db, 'kras', kra.id);
    setDoc(docRef, { ...kra, updatedAt: serverTimestamp() }, { merge: true }).then(() => {
        logGlobalActivity(`KRA Update: ${kra.taskDescription?.slice(0, 30)}...`, kra.employee.name, 'kra', `Progress: ${kra.progress}%`);
    }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'write', requestResourceData: kra }));
    });
  };

  const handleDeleteKra = (id: string) => {
    const kra = kras.find(k => k.id === id);
    const docRef = doc(db, 'kras', id);
    deleteDoc(docRef).then(() => {
        if(kra) logGlobalActivity(`KRA Removed`, kra.employee.name, 'kra');
    }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
    });
  };

  const handleDeleteMultipleKras = (ids: string[]) => ids.forEach(id => handleDeleteKra(id));

  const handleSaveEmployee = (employee: Employee) => {
    const docRef = doc(db, 'users', employee.id);
    setDoc(docRef, { ...employee, updatedAt: serverTimestamp() }, { merge: true }).then(() => {
        logGlobalActivity(`Profile Updated`, employee.name, 'employee');
    }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'write', requestResourceData: employee }));
    });
  };

  const handleDeleteEmployee = (id: string) => {
    const emp = employees.find(e => e.id === id);
    const docRef = doc(db, 'users', id);
    deleteDoc(docRef).then(() => {
        if(emp) logGlobalActivity(`Employee Removed from system`, emp.name, 'employee');
    }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
    });
  };

  const handleDeleteMultipleEmployees = (ids: string[]) => ids.forEach(id => handleDeleteEmployee(id));

  const handleSaveLeave = (leave: Leave) => {
    const docRef = doc(db, 'leaves', leave.id);
    setDoc(docRef, leave, { merge: true }).then(() => {
        logGlobalActivity(`Leave Request: ${leave.status}`, leave.employee.name, 'leave', leave.reason);
    }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'write', requestResourceData: leave }));
    });
  };

  const handleDeleteLeave = (id: string) => {
    const docRef = doc(db, 'leaves', id);
    deleteDoc(docRef).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
    });
  };

  const handleDeleteMultipleLeaves = (ids: string[]) => ids.forEach(id => handleDeleteLeave(id));

  const handleSaveExpense = (expense: Expense) => {
    const docRef = doc(db, 'expenses', expense.id);
    setDoc(docRef, expense, { merge: true }).then(() => {
        logGlobalActivity(`Expense Claim: ${expense.status}`, expense.employee.name, 'expense', `Amount: ₹${expense.totalAmount}`);
    }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'write', requestResourceData: expense }));
    });
  };

  const handleDeleteExpense = (id: string) => {
    const docRef = doc(db, 'expenses', id);
    deleteDoc(docRef).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
    });
  };

  const handleDeleteMultipleExpenses = (ids: string[]) => ids.forEach(id => handleDeleteExpense(id));

  const handleSaveRoutineTask = (task: RoutineTask) => {
    const docRef = doc(db, 'routineTasks', task.id);
    setDoc(docRef, task, { merge: true }).then(() => {
        logGlobalActivity(`Task Updated: ${task.status}`, task.employee.name, 'task', task.title);
    }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'write', requestResourceData: task }));
    });
  };

  const handleDeleteRoutineTask = (id: string) => {
    const docRef = doc(db, 'routineTasks', id);
    deleteDoc(docRef).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
    });
  };

  const handleDeleteMultipleRoutineTasks = (ids: string[]) => ids.forEach(id => handleDeleteRoutineTask(id));

  const handleSaveHabit = (habit: Habit) => {
    const docRef = doc(db, 'habits', habit.id);
    setDoc(docRef, habit, { merge: true }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'write', requestResourceData: habit }));
    });
  };

  const handleSaveHoliday = (holiday: Holiday) => {
    const docRef = doc(db, 'holidays', holiday.id);
    setDoc(docRef, holiday, { merge: true }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'write', requestResourceData: holiday }));
    });
  };

  const handleDeleteHoliday = (id: string) => {
    const docRef = doc(db, 'holidays', id);
    deleteDoc(docRef).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
    });
  };

  const handleDeleteMultipleHolidays = (ids: string[]) => ids.forEach(id => handleDeleteHoliday(id));

  const handleSaveRecruit = (recruit: Recruit) => {
    const docRef = doc(db, 'recruits', recruit.id);
    setDoc(docRef, recruit, { merge: true }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'write', requestResourceData: recruit }));
    });
  };

  const handleDeleteRecruit = (id: string) => {
    const docRef = doc(db, 'recruits', id);
    deleteDoc(docRef).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
    });
  };

  const handleDeleteMultipleRecruits = (ids: string[]) => ids.forEach(id => handleDeleteRecruit(id));

  const handleSaveAttendance = (attendance: Attendance) => {
    if (!attendance.employee?.id) return;
    const dateStr = new Date(attendance.date).toISOString().split('T')[0];
    const docRef = doc(db, 'attendances', `${attendance.employee.id}-${dateStr}`);
    setDoc(docRef, attendance, { merge: true }).then(() => {
        logGlobalActivity(`Attendance Marked: ${attendance.status}`, attendance.employee.name, 'attendance');
    }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'write', requestResourceData: attendance }));
    });
  };

  const handleSaveBranch = (branch: Branch) => {
    const docRef = doc(db, 'branches', branch.id);
    setDoc(docRef, branch, { merge: true }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'write', requestResourceData: branch }));
    });
  };

  const handleDeleteBranch = (id: string) => {
    const docRef = doc(db, 'branches', id);
    deleteDoc(docRef).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
    });
  };

  const value = {
    loading, kras, employees, branches: branches || [], leaves: leaves || [], expenses: expenses || [], routineTasks: routineTasks || [], habits: habits || [], holidays: holidays || [], recruits: recruits || [], attendances: attendances || [],
    activities,
    handleSaveKra, handleDeleteKra, handleDeleteMultipleKras, handleSaveEmployee, handleDeleteEmployee, handleDeleteMultipleEmployees, handleSaveLeave, handleDeleteLeave, handleDeleteMultipleLeaves, handleSaveExpense, handleDeleteExpense, handleDeleteMultipleExpenses,
    handleSaveRoutineTask, handleDeleteRoutineTask, handleDeleteMultipleRoutineTasks, handleSaveHabit, handleSaveHoliday, handleDeleteHoliday, handleDeleteMultipleHolidays, handleSaveRecruit, handleDeleteRecruit, handleDeleteMultipleRecruits, handleSaveAttendance,
    handleSaveBranch, handleDeleteBranch
  };

  return <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>;
};

export const useDataStore = () => {
  const context = useContext(DataStoreContext);
  if (context === undefined) throw new Error('useDataStore must be used within a DataStoreProvider');
  return context;
};
