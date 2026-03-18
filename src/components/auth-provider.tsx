
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
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
        const isInitialAdmin = firebaseUser.email === 'connect@luvfitnessworld.com';
        
        // 1. Check if user document already exists for this UID
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userRef);

        let finalUserData: Employee | null = null;

        if (userDoc.exists()) {
          finalUserData = userDoc.data() as Employee;
          
          // Check for potential duplicate profiles created manually by admin with the same email
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', firebaseUser.email));
          const querySnapshot = await getDocs(q);
          
          const otherProfiles = querySnapshot.docs.filter(d => d.id !== firebaseUser.uid);
          
          // If we found duplicates and the current one is just a "New User" placeholder,
          // migrate the data from the real (manual) profile to the UID profile.
          if (otherProfiles.length > 0 && finalUserData.name === 'New User') {
            const sourceProfile = otherProfiles[0].data() as Employee;
            if (sourceProfile.name !== 'New User') {
                const migratedData: Employee = {
                    ...sourceProfile,
                    id: firebaseUser.uid,
                    updatedAt: serverTimestamp() as any,
                };
                await setDoc(userRef, migratedData);
                finalUserData = migratedData;
                
                // Cleanup and update references
                for (const dupeDoc of otherProfiles) {
                    const oldId = dupeDoc.id;
                    await deleteDoc(dupeDoc.ref);
                    
                    const collections = ['kras', 'leaves', 'expenses', 'routineTasks', 'habits', 'attendances', 'activities'];
                    for (const colName of collections) {
                        const colRef = collection(db, colName);
                        const relatedQ = query(colRef, where('employee.id', '==', oldId));
                        const relatedSnap = await getDocs(relatedQ);
                        if (!relatedSnap.empty) {
                            const batch = writeBatch(db);
                            relatedSnap.docs.forEach(d => batch.update(d.ref, { 'employee.id': firebaseUser.uid }));
                            await batch.commit();
                        }
                    }
                }
            }
          }
        } else {
          // 2. UID doc doesn't exist. Search for an existing profile by email (invited by admin)
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', firebaseUser.email));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const existingDoc = querySnapshot.docs[0];
            const oldId = existingDoc.id;
            const existingData = existingDoc.data() as Employee;

            const migratedUser: Employee = {
              ...existingData,
              id: firebaseUser.uid,
              name: existingData.name === 'New User' ? (firebaseUser.displayName || 'New User') : existingData.name,
              avatarUrl: (existingData.avatarUrl && !existingData.avatarUrl.includes('placehold.co')) 
                ? existingData.avatarUrl 
                : (firebaseUser.photoURL || `https://placehold.co/32x32.png?text=${firebaseUser.email![0].toUpperCase()}`),
              updatedAt: serverTimestamp() as any,
            };

            await setDoc(userRef, migratedUser);
            await deleteDoc(existingDoc.ref);

            // Update all related records to point to the new permanent UID
            const collections = ['kras', 'leaves', 'expenses', 'routineTasks', 'habits', 'attendances', 'activities'];
            for (const colName of collections) {
              const colRef = collection(db, colName);
              const relatedQ = query(colRef, where('employee.id', '==', oldId));
              const relatedSnap = await getDocs(relatedQ);
              if (!relatedSnap.empty) {
                const batch = writeBatch(db);
                relatedSnap.docs.forEach(d => batch.update(d.ref, { 'employee.id': firebaseUser.uid }));
                await batch.commit();
              }
            }
            finalUserData = migratedUser;
          } else {
            // 3. No existing profile found, create a brand new one
            const newUser: Employee = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'New User',
              email: firebaseUser.email!,
              avatarUrl: firebaseUser.photoURL || `https://placehold.co/32x32.png?text=${firebaseUser.email![0].toUpperCase()}`,
              role: isInitialAdmin ? 'Admin' : 'Employee',
              permissions: isInitialAdmin ? adminPermissions : defaultPermissions,
              createdAt: serverTimestamp() as any,
              updatedAt: serverTimestamp() as any,
            };
            await setDoc(userRef, newUser);
            finalUserData = newUser;
          }
        }

        if (finalUserData) {
          if (finalUserData.role === 'Admin' || isInitialAdmin) {
            finalUserData.permissions = adminPermissions;
            finalUserData.role = 'Admin';
          }
          setCurrentUser(finalUserData);
        }

        // Ensure roles_admin entry for the master admin
        if (isInitialAdmin) {
          const adminRoleRef = doc(db, 'roles_admin', firebaseUser.uid);
          const adminRoleDoc = await getDoc(adminRoleRef);
          if (!adminRoleDoc.exists()) {
            await setDoc(adminRoleRef, { active: true });
          }
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
