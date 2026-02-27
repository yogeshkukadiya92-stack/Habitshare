'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockKras, mockLeaves, mockExpenses, mockRoutineTasks, mockHabits, mockHolidays, mockRecruits, mockAttendances } from '@/lib/data';
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
  handleSaveRecruit: (recruit: Recruit) => void;
  handleDeleteRecruit: (id: string) => void;
  handleDeleteMultipleRecruits: (ids: string[]) => void;
  handleSaveAttendance: (attendance: Attendance) => void;
  setKras: React.Dispatch<React.SetStateAction<KRA[]>>;
  setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
}

const DataStoreContext = createContext<DataStoreContextType | undefined>(undefined);

export const DataStoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [kras, setKras] = useState<KRA[]>(mockKras);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>(mockLeaves);
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [routineTasks, setRoutineTasks] = useState<RoutineTask[]>(mockRoutineTasks);
  const [habits, setHabits] = useState<Habit[]>(mockHabits);
  const [holidays, setHolidays] = useState<Holiday[]>(mockHolidays);
  const [recruits, setRecruits] = useState<Recruit[]>(mockRecruits);
  const [attendances, setAttendances] = useState<Attendance[]>(mockAttendances);

  useEffect(() => {
    const loadData = (key: string, initialValue: any, setter: Function) => {
      try {
        if (typeof window === 'undefined') return;
        const item = window.localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item, (key, value) => {
            if (key.includes('Date') || key.includes('date') || key === 'checkIns') {
              if (Array.isArray(value)) return value.map(v => new Date(v));
              if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)) return new Date(value);
            }
            return value;
          });
          setter(parsed);
        }
      } catch (error) {
        console.error(`Error loading ${key} from localStorage:`, error);
      }
    };

    loadData('kras', mockKras, setKras);
    loadData('branches', [], setBranches);
    loadData('leaves', mockLeaves, setLeaves);
    loadData('expenses', mockExpenses, setExpenses);
    loadData('routineTasks', mockRoutineTasks, setRoutineTasks);
    loadData('habits', mockHabits, setHabits);
    loadData('holidays', mockHolidays, setHolidays);
    loadData('recruits', mockRecruits, setRecruits);
    loadData('attendances', mockAttendances, setAttendances);
    
    setLoading(false);
  }, []);

  useEffect(() => { if (!loading && typeof window !== 'undefined') window.localStorage.setItem('kras', JSON.stringify(kras)); }, [kras, loading]);
  useEffect(() => { if (!loading && typeof window !== 'undefined') window.localStorage.setItem('branches', JSON.stringify(branches)); }, [branches, loading]);
  useEffect(() => { if (!loading && typeof window !== 'undefined') window.localStorage.setItem('leaves', JSON.stringify(leaves)); }, [leaves, loading]);
  useEffect(() => { if (!loading && typeof window !== 'undefined') window.localStorage.setItem('expenses', JSON.stringify(expenses)); }, [expenses, loading]);
  useEffect(() => { if (!loading && typeof window !== 'undefined') window.localStorage.setItem('routineTasks', JSON.stringify(routineTasks)); }, [routineTasks, loading]);
  useEffect(() => { if (!loading && typeof window !== 'undefined') window.localStorage.setItem('habits', JSON.stringify(habits)); }, [habits, loading]);
  useEffect(() => { if (!loading && typeof window !== 'undefined') window.localStorage.setItem('holidays', JSON.stringify(holidays)); }, [holidays, loading]);
  useEffect(() => { if (!loading && typeof window !== 'undefined') window.localStorage.setItem('recruits', JSON.stringify(recruits)); }, [recruits, loading]);
  useEffect(() => { if (!loading && typeof window !== 'undefined') window.localStorage.setItem('attendances', JSON.stringify(attendances)); }, [attendances, loading]);

  const employees: Employee[] = React.useMemo(() => {
    const employeeMap = new Map<string, Employee>();
    kras.forEach(kra => {
      if (!employeeMap.has(kra.employee.id)) {
        employeeMap.set(kra.employee.id, kra.employee);
      }
    });
    return Array.from(employeeMap.values());
  }, [kras]);

  const handleSaveKra = (kraToSave: KRA) => {
    setKras(prev => {
      const exists = prev.some(k => k.id === kraToSave.id);
      return exists ? prev.map(k => (k.id === kraToSave.id ? kraToSave : k)) : [...prev, kraToSave];
    });
  };

  const handleDeleteKra = (kraId: string) => {
    setKras(prev => prev.filter(k => k.id !== kraId));
  };

  const handleDeleteMultipleKras = (ids: string[]) => {
    setKras(prev => prev.filter(k => !ids.includes(k.id)));
  };

  const handleSaveEmployee = (employeeToSave: Employee) => {
    setKras(prev => {
      const employeeExists = prev.some(k => k.employee.id === employeeToSave.id);
      if (employeeExists) {
        return prev.map(kra => kra.employee.id === employeeToSave.id ? { ...kra, employee: employeeToSave } : kra);
      } else {
        const newPlaceholderKra: KRA = {
          id: `KRA-placeholder-${employeeToSave.id}`,
          taskDescription: 'Placeholder KRA',
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
        return [...prev, newPlaceholderKra];
      }
    });
  };

  const handleDeleteEmployee = (employeeId: string) => {
    setKras(prev => prev.filter(kra => kra.employee.id !== employeeId));
  };

  const handleDeleteMultipleEmployees = (ids: string[]) => {
    setKras(prev => prev.filter(kra => !ids.includes(kra.employee.id)));
  };
  
  const handleSaveLeave = (leaveToSave: Leave) => {
    setLeaves(prev => {
      const exists = prev.some(l => l.id === leaveToSave.id);
      const updated = exists ? prev.map(l => (l.id === leaveToSave.id ? leaveToSave : l)) : [leaveToSave, ...prev];
      return updated.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    });
  };

  const handleDeleteLeave = (leaveId: string) => {
    setLeaves(prev => prev.filter(l => l.id !== leaveId));
  };

  const handleDeleteMultipleLeaves = (ids: string[]) => {
    setLeaves(prev => prev.filter(l => !ids.includes(l.id)));
  };

  const handleSaveExpense = (expenseToSave: Expense) => {
    setExpenses(prev => {
      const exists = prev.some(e => e.id === expenseToSave.id);
      const updated = exists ? prev.map(e => (e.id === expenseToSave.id ? expenseToSave : e)) : [expenseToSave, ...prev];
      return updated.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
  };

  const handleDeleteMultipleExpenses = (ids: string[]) => {
    setExpenses(prev => prev.filter(e => !ids.includes(e.id)));
  };

  const handleSaveRoutineTask = (taskToSave: RoutineTask) => {
    setRoutineTasks(prev => {
      const exists = prev.some(t => t.id === taskToSave.id);
      return exists ? prev.map(t => (t.id === taskToSave.id ? taskToSave : t)) : [taskToSave, ...prev];
    });
  };

  const handleDeleteRoutineTask = (taskId: string) => {
    setRoutineTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleDeleteMultipleRoutineTasks = (ids: string[]) => {
    setRoutineTasks(prev => prev.filter(t => !ids.includes(t.id)));
  };

  const handleSaveHabit = (habitToSave: Habit) => {
    setHabits(prev => {
      const exists = prev.some(h => h.id === habitToSave.id);
      return exists ? prev.map(h => (h.id === habitToSave.id ? habitToSave : h)) : [...prev, habitToSave];
    });
  };

  const handleSaveHoliday = (holidayToSave: Holiday) => {
    setHolidays(prev => {
      const exists = prev.some(h => h.id === holidayToSave.id);
      const updated = exists ? prev.map(h => (h.id === holidayToSave.id ? holidayToSave : h)) : [...prev, holidayToSave];
      return updated.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
  };

  const handleDeleteHoliday = (id: string) => {
    setHolidays(prev => prev.filter(h => h.id !== id));
  };

  const handleSaveRecruit = (recruitToSave: Recruit) => {
    setRecruits(prev => {
      const exists = prev.some(r => r.id === recruitToSave.id);
      const updated = exists ? prev.map(r => (r.id === recruitToSave.id ? recruitToSave : r)) : [...prev, recruitToSave];
      return updated.sort((a,b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
    });
  };

  const handleDeleteRecruit = (id: string) => {
    setRecruits(prev => prev.filter(r => r.id !== id));
  };

  const handleDeleteMultipleRecruits = (ids: string[]) => {
    setRecruits(prev => prev.filter(r => !ids.includes(r.id)));
  };

  const handleSaveAttendance = (attendanceToSave: Attendance) => {
    setAttendances(prev => {
      const exists = prev.some(a => a.employee.id === attendanceToSave.employee.id && new Date(a.date).toDateString() === new Date(attendanceToSave.date).toDateString());
      return exists ? prev.map(a => (a.employee.id === attendanceToSave.employee.id && new Date(a.date).toDateString() === new Date(attendanceToSave.date).toDateString()) ? attendanceToSave : a) : [...prev, attendanceToSave];
    });
  };

  const value = {
    loading, kras, employees, branches, leaves, expenses, routineTasks, habits, holidays, recruits, attendances,
    handleSaveKra, handleDeleteKra, handleDeleteMultipleKras, handleSaveEmployee, handleDeleteEmployee, handleDeleteMultipleEmployees, handleSaveLeave, handleDeleteLeave, handleDeleteMultipleLeaves, handleSaveExpense, handleDeleteExpense, handleDeleteMultipleExpenses,
    handleSaveRoutineTask, handleDeleteRoutineTask, handleDeleteMultipleRoutineTasks, handleSaveHabit, handleSaveHoliday, handleDeleteHoliday, handleSaveRecruit, handleDeleteRecruit, handleDeleteMultipleRecruits, handleSaveAttendance,
    setKras, setBranches
  };

  return <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>;
};

export const useDataStore = () => {
  const context = useContext(DataStoreContext);
  if (context === undefined) throw new Error('useDataStore must be used within a DataStoreProvider');
  return context;
};
