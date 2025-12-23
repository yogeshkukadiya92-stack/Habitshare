
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
    // Simulate loading data
    setLoading(false);
  }, []);

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
    setKras(prevKras => {
      const exists = prevKras.some(k => k.id === kraToSave.id);
      if (exists) {
        return prevKras.map(kra => (kra.id === kraToSave.id ? kraToSave : kra));
      }
      return [...prevKras, kraToSave];
    });
  };

  const handleSaveEmployee = (employeeToSave: Employee) => {
    setKras(prevKras => {
      const employeeExists = prevKras.some(k => k.employee.id === employeeToSave.id);

      if (employeeExists) {
        return prevKras.map(kra => {
          if (kra.employee.id === employeeToSave.id) {
            return { ...kra, employee: employeeToSave };
          }
          return kra;
        });
      } else {
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
        return [...prevKras, newPlaceholderKra];
      }
    });
  };

  const handleDeleteEmployee = (employeeId: string) => {
    setKras(prevKras => prevKras.filter(kra => kra.employee.id !== employeeId));
  };
  
  const handleSaveLeave = (leaveToSave: Leave) => {
    setLeaves((prevLeaves) => {
        const exists = prevLeaves.some(l => l.id === leaveToSave.id);
        if (exists) {
            return prevLeaves.map((leave) => (leave.id === leaveToSave.id ? leaveToSave : leave));
        }
        return [leaveToSave, ...prevLeaves].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    });
  };

  const handleSaveExpense = (expenseToSave: Expense) => {
    setExpenses((prevExpenses) => {
        const exists = prevExpenses.some(l => l.id === expenseToSave.id);
        if (exists) {
            return prevExpenses.map((expense) => (expense.id === expenseToSave.id ? expenseToSave : expense));
        }
        return [expenseToSave, ...prevExpenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
  };

  const handleSaveRoutineTask = (taskToSave: RoutineTask) => {
    setRoutineTasks((prevTasks) => {
        const exists = prevTasks.some(t => t.id === taskToSave.id);
        if (exists) {
            return prevTasks.map((task) => (task.id === taskToSave.id ? taskToSave : task));
        }
        return [taskToSave, ...prevTasks];
    });
  };

  const handleDeleteRoutineTask = (taskId: string) => {
    setRoutineTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  const handleSaveHabit = (habitToSave: Habit) => {
    setHabits((prevHabits) => {
        const exists = prevHabits.some(h => h.id === habitToSave.id);
        if (exists) {
            return prevHabits.map((habit) => (habit.id === habitToSave.id ? habitToSave : habit));
        }
        return [...prevHabits, habitToSave];
    });
  };

  const handleSaveHoliday = (holidayToSave: Holiday) => {
    setHolidays((prevHolidays) => {
        const exists = prevHolidays.some(h => h.id === holidayToSave.id);
        const updatedHolidays = exists 
            ? prevHolidays.map((holiday) => (holiday.id === holidayToSave.id ? holidayToSave : holiday))
            : [...prevHolidays, holidayToSave];
        
        return updatedHolidays.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
  };

    const handleSaveRecruit = (recruitToSave: Recruit) => {
        setRecruits((prevRecruits) => {
            const exists = prevRecruits.some(r => r.id === recruitToSave.id);
            const updatedRecruits = exists 
                ? prevRecruits.map((recruit) => (recruit.id === recruitToSave.id ? recruitToSave : recruit))
                : [...prevRecruits, recruitToSave];
            
            return updatedRecruits.sort((a,b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
        });
    };

    const handleSaveAttendance = (attendanceToSave: Attendance) => {
        setAttendances((prevAttendances) => {
            const exists = prevAttendances.some(
                a => a.employee.id === attendanceToSave.employee.id &&
                a.date.toDateString() === attendanceToSave.date.toDateString()
            );
            if (exists) {
                return prevAttendances.map((att) =>
                    (att.employee.id === attendanceToSave.employee.id && att.date.toDateString() === attendanceToSave.date.toDateString())
                        ? attendanceToSave
                        : att
                );
            }
            return [...prevAttendances, attendanceToSave];
        });
    };


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
    setKras,
    setBranches
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
