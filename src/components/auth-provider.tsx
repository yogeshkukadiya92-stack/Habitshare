
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';
import type { Employee, KRA, EmployeePermissions, PermissionLevel } from '@/lib/types';
import { mockKras } from '@/lib/data';
import { DataStoreProvider } from '@/hooks/use-data-store';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  currentUser: Employee | null;
  getPermission: (page: keyof EmployeePermissions) => PermissionLevel;
}

const defaultPermissions: EmployeePermissions = {
    employees: 'employee_only',
    routine_tasks: 'view',
    leaves: 'employee_only',
    attendance: 'view',
    expenses: 'edit',
    habit_tracker: 'edit',
    holidays: 'view',
    recruitment: 'view',
    hr_calendar: 'view',
    settings: 'none',
};

const adminPermissions: EmployeePermissions = {
    employees: 'download',
    routine_tasks: 'download',
    leaves: 'download',
    attendance: 'download',
    expenses: 'download',
    habit_tracker: 'download',
    holidays: 'download',
    recruitment: 'download',
    hr_calendar: 'download',
    settings: 'download',
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  currentUser: null,
  getPermission: () => 'none',
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        let employeeData = mockKras.find((k:any) => k.employee.email === user.email)?.employee;
        
        if (employeeData) {
             if (employeeData.role === 'Admin') {
                employeeData.permissions = adminPermissions;
            } else if (!employeeData.permissions) {
                employeeData.permissions = defaultPermissions;
            }
            setCurrentUser(employeeData);
        } else {
             const isMockAdmin = user.email === 'connect@luvfitnessworld.com';
             const mockAdminData = mockKras.find(k => k.employee.email === 'connect@luvfitnessworld.com')?.employee;

             if(isMockAdmin && mockAdminData) {
                 setCurrentUser({
                     ...mockAdminData,
                     permissions: adminPermissions,
                 });
             } else {
                 setCurrentUser({
                    id: user.uid,
                    name: user.displayName || 'New User',
                    email: user.email!,
                    avatarUrl: user.photoURL || `https://placehold.co/32x32.png?text=${user.email![0].toUpperCase()}`,
                    role: 'Employee',
                    permissions: defaultPermissions,
                });
             }
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getPermission = (page: keyof EmployeePermissions): PermissionLevel => {
    if (loading || !currentUser) return 'none';
    if (currentUser.role === 'Admin') return 'download';
    return currentUser.permissions?.[page] || 'none';
  };


  if (loading) {
    return (
        <div className="flex flex-col h-screen">
            <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6">
                 <Skeleton className="h-6 w-40" />
                 <div className="ml-auto">
                    <Skeleton className="h-8 w-20" />
                 </div>
            </header>
            <div className="flex-1 p-6">
                <Skeleton className="h-full w-full" />
            </div>
        </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, loading, currentUser, getPermission }}>
      <DataStoreProvider>
        {children}
      </DataStoreProvider>
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
