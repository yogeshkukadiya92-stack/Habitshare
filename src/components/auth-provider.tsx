
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
      if (firebaseUser && firebaseUser.email) {
        const normalizedEmail = firebaseUser.email.toLowerCase().trim();
        const isInitialAdmin = normalizedEmail === 'connect@luvfitnessworld.com';
        
        // 1. Get UID-based reference
        const userRef = doc(db, 'users', firebaseUser.uid);
        let userDoc = await getDoc(userRef);

        // 2. Check for existing manual/duplicate profiles by normalized email
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', normalizedEmail));
        const querySnapshot = await getDocs(q);
        
        const otherProfiles = querySnapshot.docs.filter(d => d.id !== firebaseUser.uid);

        // 3. Migration Logic: If we find profiles with same email but different ID
        if (otherProfiles.length > 0) {
          // Sort to find the most complete profile (usually the one created by Admin)
          const sourceDoc = otherProfiles.sort((a, b) => {
              const dataA = a.data() as Employee;
              const dataB = b.data() as Employee;
              return (dataB.name !== 'New User' ? 1 : 0) - (dataA.name !== 'New User' ? 1 : 0);
          })[0];
          
          const sourceData = sourceDoc.data() as Employee;
          
          // Merge data into the permanent UID document
          const mergedData: Employee = {
            ...sourceData,
            id: firebaseUser.uid, // Adopt the UID as the permanent ID
            email: normalizedEmail,
            updatedAt: serverTimestamp() as any,
          };
          
          await setDoc(userRef, mergedData, { merge: true });
          
          // Move all related records from ALL other profile IDs to the permanent UID
          for (const duplicateDoc of otherProfiles) {
              const oldId = duplicateDoc.id;
              if (oldId === firebaseUser.uid) continue;

              const collections = ['kras', 'leaves', 'expenses', 'routineTasks', 'habits', 'attendances', 'activities'];
              for (const colName of collections) {
                const colRef = collection(db, colName);
                const relatedQ = query(colRef, where('employee.id', '==', oldId));
                const relatedSnap = await getDocs(relatedQ);
                
                if (!relatedSnap.empty) {
                  const batch = writeBatch(db);
                  relatedSnap.docs.forEach(d => {
                    batch.update(d.ref, { 
                      'employee.id': firebaseUser.uid,
                      'employee.email': normalizedEmail 
                    });
                  });
                  await batch.commit();
                }
              }
              // Delete the duplicate profile
              await deleteDoc(duplicateDoc.ref);
          }
          
          // Refresh local userDoc reference
          userDoc = await getDoc(userRef);
        } else if (!userDoc.exists()) {
          // 4. Truly brand new user
          const newUser: Employee = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'New User',
            email: normalizedEmail,
            avatarUrl: firebaseUser.photoURL || `https://placehold.co/32x32.png?text=${normalizedEmail[0].toUpperCase()}`,
            role: isInitialAdmin ? 'Admin' : 'Employee',
            permissions: isInitialAdmin ? adminPermissions : defaultPermissions,
            createdAt: serverTimestamp() as any,
            updatedAt: serverTimestamp() as any,
          };
          await setDoc(userRef, newUser);
          userDoc = await getDoc(userRef);
        }

        // Finalize the current user state
        if (userDoc.exists()) {
          const finalData = userDoc.data() as Employee;
          if (finalData.role === 'Admin' || isInitialAdmin) {
            finalData.permissions = adminPermissions;
            finalData.role = 'Admin';
          }
          setCurrentUser(finalData);
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
