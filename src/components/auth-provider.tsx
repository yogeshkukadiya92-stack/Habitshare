'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth as useFirebaseInstance, useFirestore } from '@/firebase';
import { Skeleton } from './ui/skeleton';
import type { Employee, EmployeePermissions, PermissionLevel } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  currentUser: Employee | null;
  getPermission: (page: keyof EmployeePermissions) => PermissionLevel;
}

const defaultPermissions: EmployeePermissions = {
    employees: 'employee_only',
    kras: 'employee_only',
    routine_tasks: 'view',
    leaves: 'employee_only',
    attendance: 'view',
    expenses: 'employee_only',
    habit_tracker: 'view',
    holidays: 'view',
    recruitment: 'view',
    hr_calendar: 'view',
    settings: 'none',
};

const adminPermissions: EmployeePermissions = {
    employees: 'download',
    kras: 'download',
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
  const auth = useFirebaseInstance();
  const db = useFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data() as Employee;
          if (userData.role === 'Admin') {
            userData.permissions = adminPermissions;
          }
          setCurrentUser(userData);
        } else {
          // Create new user profile in Firestore
          const isInitialAdmin = firebaseUser.email === 'connect@luvfitnessworld.com';
          const newUser: Employee = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'New User',
            email: firebaseUser.email!,
            avatarUrl: firebaseUser.photoURL || `https://placehold.co/32x32.png?text=${firebaseUser.email![0].toUpperCase()}`,
            role: isInitialAdmin ? 'Admin' : 'Employee',
            permissions: isInitialAdmin ? adminPermissions : defaultPermissions,
          };
          await setDoc(userRef, newUser);
          setCurrentUser(newUser);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db]);

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
        {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
