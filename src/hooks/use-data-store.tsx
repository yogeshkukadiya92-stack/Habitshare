
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Employee, KRA, Branch, Leave, Expense, RoutineTask, Habit, Holiday, Recruit, Attendance } from '@/lib/types';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, doc, writeBatch, deleteDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

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
  handleSaveEmployee: (employee: Employee) => void;
  handleDeleteEmployee: (employeeId: string) => void;
  handleSaveLeave: (leave: Leave) => void;
  handleSaveExpense: (expense: Expense) => void;
  handleSaveRoutineTask: (task: RoutineTask) => void;
  handleDeleteRoutineTask: (taskId: string) => void;
  handleSaveHabit: (habit: Habit) => void;
  handleSaveHoliday: (holiday: Holiday) => void;
  handleSaveRecruit: (recruit: Recruit) => void;
  handleSaveAttendance: (attendance: Attendance) => void;
  setKras: React.Dispatch<React.SetStateAction<KRA[]>>; // Kept for specific scenarios like role change
  setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
}

const DataStoreContext = createContext<DataStoreContextType | undefined>(undefined);

export const DataStoreProvider = ({ children }: { children: React.ReactNode }) => {
  const firestore = useFirestore();

  const { data: krasData, loading: krasLoading } = useCollection<KRA>(
    firestore ? collection(firestore, 'kras') : null
  );
  const { data: branchesData, loading: branchesLoading } = useCollection<Branch>(
    firestore ? collection(firestore, 'branches') : null
  );
  const { data: leavesData, loading: leavesLoading } = useCollection<Leave>(
    firestore ? collection(firestore, 'leaves') : null
  );
   const { data: expensesData, loading: expensesLoading } = useCollection<Expense>(
    firestore ? collection(firestore, 'expenses') : null
  );
   const { data: tasksData, loading: tasksLoading } = useCollection<RoutineTask>(
    firestore ? collection(firestore, 'routineTasks') : null
  );
   const { data: habitsData, loading: habitsLoading } = useCollection<Habit>(
    firestore ? collection(firestore, 'habits') : null
  );
   const { data: holidaysData, loading: holidaysLoading } = useCollection<Holiday>(
    firestore ? collection(firestore, 'holidays') : null
  );
   const { data: recruitsData, loading: recruitsLoading } = useCollection<Recruit>(
    firestore ? collection(firestore, 'recruits') : null
  );
   const { data: attendancesData, loading: attendancesLoading } = useCollection<Attendance>(
    firestore ? collection(firestore, 'attendances') : null
  );

  // Raw data states from firestore
  const [kras, setKras] = useState<KRA[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [routineTasks, setRoutineTasks] = useState<RoutineTask[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [recruits, setRecruits] = useState<Recruit[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  
  const loading = krasLoading || branchesLoading || leavesLoading || expensesLoading || tasksLoading || habitsLoading || holidaysLoading || recruitsLoading || attendancesLoading;
  
  // Use effects to update local state when Firestore data changes
  useEffect(() => setKras(krasData || []), [krasData]);
  useEffect(() => setBranches(branchesData || []), [branchesData]);
  useEffect(() => setLeaves(leavesData || []), [leavesData]);
  useEffect(() => setExpenses(expensesData || []), [expensesData]);
  useEffect(() => setRoutineTasks(tasksData || []), [tasksData]);
  useEffect(() => setHabits(habitsData || []), [habitsData]);
  useEffect(() => setHolidays(holidaysData || []), [holidaysData]);
  useEffect(() => setRecruits(recruitsData || []), [recruitsData]);
  useEffect(() => setAttendances(attendancesData || []), [attendancesData]);

  const employees: Employee[] = React.useMemo(() => {
    const employeeMap = new Map<string, Employee>();
    kras.forEach(kra => {
      // It's possible employee is a string ref, so we need to handle that. For now, assuming it's an object.
      if (kra.employee && typeof kra.employee === 'object' && !employeeMap.has(kra.employee.id)) {
        employeeMap.set(kra.employee.id, kra.employee);
      }
    });
    return Array.from(employeeMap.values());
  }, [kras]);

  const saveData = async (collectionName: string, data: any) => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    const docRef = doc(firestore, collectionName, data.id);
    batch.set(docRef, JSON.parse(JSON.stringify(data)), { merge: true });
    await batch.commit();
  };

  const deleteData = async (collectionName: string, id: string) => {
      if (!firestore) return;
      await deleteDoc(doc(firestore, collectionName, id));
  }

  const handleSaveKra = (kraToSave: KRA) => saveData('kras', kraToSave);
  const handleSaveLeave = (leaveToSave: Leave) => saveData('leaves', leaveToSave);
  const handleSaveExpense = (expenseToSave: Expense) => saveData('expenses', expenseToSave);
  const handleSaveRoutineTask = (taskToSave: RoutineTask) => saveData('routineTasks', taskToSave);
  const handleSaveHabit = (habitToSave: Habit) => saveData('habits', habitToSave);
  const handleSaveHoliday = (holidayToSave: Holiday) => saveData('holidays', holidayToSave);
  const handleSaveRecruit = (recruitToSave: Recruit) => saveData('recruits', recruitToSave);
  const handleSaveAttendance = (attendanceToSave: Attendance) => saveData('attendances', attendanceToSave);

  const handleSaveEmployee = async (employeeToSave: Employee) => {
      if (!firestore) return;

      const employeeExists = kras.some(k => k.employee.id === employeeToSave.id);
      const batch = writeBatch(firestore);

      if (employeeExists) {
        // Update employee object in all relevant KRAs
        const krasToUpdate = kras.filter(k => k.employee.id === employeeToSave.id);
        krasToUpdate.forEach(kra => {
          const kraRef = doc(firestore, 'kras', kra.id);
          batch.update(kraRef, { employee: JSON.parse(JSON.stringify(employeeToSave)) });
        });
      } else {
        // Create a new placeholder KRA for the new employee
        const newPlaceholderKra: KRA = {
          id: `KRA-placeholder-${employeeToSave.id}`,
          taskDescription: 'Placeholder KRA for new employee',
          employee: employeeToSave,
          progress: 0,
          status: 'Pending',
          weightage: null,
          marksAchieved: null,
          bonus: null,
          penalty: null,
          startDate: new Date(),
          endDate: new Date(),
          actions: [],
        };
        const kraRef = doc(firestore, 'kras', newPlaceholderKra.id);
        batch.set(kraRef, JSON.parse(JSON.stringify(newPlaceholderKra)));
      }
      await batch.commit();
  };

  const handleDeleteEmployee = async (employeeId: string) => {
     if (!firestore) return;
     const batch = writeBatch(firestore);
     const krasToDelete = kras.filter(kra => kra.employee.id === employeeId);
     krasToDelete.forEach(kra => {
        const docRef = doc(firestore, 'kras', kra.id);
        batch.delete(docRef);
     });
     await batch.commit();
  };
  
  const handleDeleteRoutineTask = (taskId: string) => deleteData('routineTasks', taskId);

  const value = {
    loading,
    kras,
    employees,
    branches,
    leaves,
    expenses,
    routineTasks,
    habits,
    holidays,
    recruits,
    attendances,
    handleSaveKra,
    handleSaveEmployee,
    handleDeleteEmployee,
    handleSaveLeave,
    handleSaveExpense,
    handleSaveRoutineTask,
    handleDeleteRoutineTask,
    handleSaveHabit,
    handleSaveHoliday,
    handleSaveRecruit,
    handleSaveAttendance,
    setKras, // This is now mainly for optimistic UI updates if needed, but Firestore is the source of truth.
    setBranches,
  };

  return <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>;
};

export const useDataStore = () => {
  const context = useContext(DataStoreContext);
  if (context === undefined) {
    throw new Error('useDataStore must be used within a DataStoreProvider');
  }
  return context;
};
