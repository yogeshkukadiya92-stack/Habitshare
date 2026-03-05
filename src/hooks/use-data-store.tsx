'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { collection, query, where, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import type { Employee, KRA, Branch, Leave, Expense, RoutineTask, Habit, Holiday, Recruit, Attendance } from '@/lib/types';
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
  setKras?: React.Dispatch<React.SetStateAction<KRA[]>>;
  setBranches?: React.Dispatch<React.SetStateAction<Branch[]>>;
}

const DataStoreContext = createContext<DataStoreContextType | undefined>(undefined);

export const DataStoreProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  const db = useFirestore();

  // Queries
  const usersQuery = useMemoFirebase(() => collection(db, 'users'), [db]);
  const krasQuery = useMemoFirebase(() => collection(db, 'kras'), [db]);
  const branchesQuery = useMemoFirebase(() => collection(db, 'branches'), [db]);
  const leavesQuery = useMemoFirebase(() => collection(db, 'leaves'), [db]);
  const expensesQuery = useMemoFirebase(() => collection(db, 'expenses'), [db]);
  const routineTasksQuery = useMemoFirebase(() => collection(db, 'routineTasks'), [db]);
  const habitsQuery = useMemoFirebase(() => collection(db, 'habits'), [db]);
  const holidaysQuery = useMemoFirebase(() => collection(db, 'holidays'), [db]);
  const recruitsQuery = useMemoFirebase(() => collection(db, 'recruits'), [db]);
  const attendancesQuery = useMemoFirebase(() => collection(db, 'attendances'), [db]);

  // Data fetching
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

  const employees = useMemo(() => users || [], [users]);
  const kras = useMemo(() => krasData || [], [krasData]);

  const loading = usersLoading || krasLoading || branchesLoading || leavesLoading || expensesLoading || routineTasksLoading || habitsLoading || holidaysLoading || recruitsLoading || attendancesLoading;

  // Mutation Handlers
  const handleSaveKra = (kra: KRA) => {
    const docRef = doc(db, 'kras', kra.id);
    setDoc(docRef, JSON.parse(JSON.stringify(kra)), { merge: true });
  };

  const handleDeleteKra = (id: string) => {
    deleteDoc(doc(db, 'kras', id));
  };

  const handleDeleteMultipleKras = (ids: string[]) => {
    ids.forEach(id => handleDeleteKra(id));
  };

  const handleSaveEmployee = (employee: Employee) => {
    const docRef = doc(db, 'users', employee.id);
    setDoc(docRef, JSON.parse(JSON.stringify(employee)), { merge: true });
  };

  const handleDeleteEmployee = (id: string) => {
    deleteDoc(doc(db, 'users', id));
  };

  const handleDeleteMultipleEmployees = (ids: string[]) => {
    ids.forEach(id => handleDeleteEmployee(id));
  };

  const handleSaveLeave = (leave: Leave) => {
    const docRef = doc(db, 'leaves', leave.id);
    setDoc(docRef, JSON.parse(JSON.stringify(leave)), { merge: true });
  };

  const handleDeleteLeave = (id: string) => {
    deleteDoc(doc(db, 'leaves', id));
  };

  const handleDeleteMultipleLeaves = (ids: string[]) => {
    ids.forEach(id => handleDeleteLeave(id));
  };

  const handleSaveExpense = (expense: Expense) => {
    const docRef = doc(db, 'expenses', expense.id);
    setDoc(docRef, JSON.parse(JSON.stringify(expense)), { merge: true });
  };

  const handleDeleteExpense = (id: string) => {
    deleteDoc(doc(db, 'expenses', id));
  };

  const handleDeleteMultipleExpenses = (ids: string[]) => {
    ids.forEach(id => handleDeleteExpense(id));
  };

  const handleSaveRoutineTask = (task: RoutineTask) => {
    const docRef = doc(db, 'routineTasks', task.id);
    setDoc(docRef, JSON.parse(JSON.stringify(task)), { merge: true });
  };

  const handleDeleteRoutineTask = (id: string) => {
    deleteDoc(doc(db, 'routineTasks', id));
  };

  const handleDeleteMultipleRoutineTasks = (ids: string[]) => {
    ids.forEach(id => handleDeleteRoutineTask(id));
  };

  const handleSaveHabit = (habit: Habit) => {
    const docRef = doc(db, 'habits', habit.id);
    setDoc(docRef, JSON.parse(JSON.stringify(habit)), { merge: true });
  };

  const handleSaveHoliday = (holiday: Holiday) => {
    const docRef = doc(db, 'holidays', holiday.id);
    setDoc(docRef, JSON.parse(JSON.stringify(holiday)), { merge: true });
  };

  const handleDeleteHoliday = (id: string) => {
    deleteDoc(doc(db, 'holidays', id));
  };

  const handleDeleteMultipleHolidays = (ids: string[]) => {
    ids.forEach(id => handleDeleteHoliday(id));
  };

  const handleSaveRecruit = (recruit: Recruit) => {
    const docRef = doc(db, 'recruits', recruit.id);
    setDoc(docRef, JSON.parse(JSON.stringify(recruit)), { merge: true });
  };

  const handleDeleteRecruit = (id: string) => {
    deleteDoc(doc(db, 'recruits', id));
  };

  const handleDeleteMultipleRecruits = (ids: string[]) => {
    ids.forEach(id => handleDeleteRecruit(id));
  };

  const handleSaveAttendance = (attendance: Attendance) => {
    const docRef = doc(db, 'attendances', attendance.id);
    setDoc(docRef, JSON.parse(JSON.stringify(attendance)), { merge: true });
  };

  const value = {
    loading, kras, employees, branches: branches || [], leaves: leaves || [], expenses: expenses || [], routineTasks: routineTasks || [], habits: habits || [], holidays: holidays || [], recruits: recruits || [], attendances: attendances || [],
    handleSaveKra, handleDeleteKra, handleDeleteMultipleKras, handleSaveEmployee, handleDeleteEmployee, handleDeleteMultipleEmployees, handleSaveLeave, handleDeleteLeave, handleDeleteMultipleLeaves, handleSaveExpense, handleDeleteExpense, handleDeleteMultipleExpenses,
    handleSaveRoutineTask, handleDeleteRoutineTask, handleDeleteMultipleRoutineTasks, handleSaveHabit, handleSaveHoliday, handleDeleteHoliday, handleDeleteMultipleHolidays, handleSaveRecruit, handleDeleteRecruit, handleDeleteMultipleRecruits, handleSaveAttendance
  };

  return <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>;
};

export const useDataStore = () => {
  const context = useContext(DataStoreContext);
  if (context === undefined) throw new Error('useDataStore must be used within a DataStoreProvider');
  return context;
};
