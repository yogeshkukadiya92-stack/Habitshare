'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Package2, Users, ListTodo, Plane, UserCheck, ReceiptText, Target, CalendarDays, Briefcase, Calendar, ListChecks, Sparkles } from 'lucide-react';
import { useAuth } from './auth-provider';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent, SidebarFooter } from './ui/sidebar';
import type { EmployeePermissions } from '@/lib/types';

export function AppSidebar() {
  const pathname = usePathname();
  const { user, currentUser, getPermission } = useAuth();

  const navItems = useMemo(() => [
    { href: '/', label: 'Dashboard', icon: Users, color: 'text-blue-500', permissionKey: 'employees' as keyof EmployeePermissions },
    { href: '/kras', label: 'KRA Management', icon: ListChecks, color: 'text-purple-500', permissionKey: 'employees' as keyof EmployeePermissions },
    { href: '/routine-tasks', label: 'Routine Tasks', icon: ListTodo, color: 'text-orange-500', permissionKey: 'routine_tasks' as keyof EmployeePermissions },
    { href: '/leaves', label: 'Leave Account', icon: Plane, color: 'text-sky-500', permissionKey: 'leaves' as keyof EmployeePermissions },
    { href: '/attendance', label: 'Attendance', icon: UserCheck, color: 'text-green-500', permissionKey: 'attendance' as keyof EmployeePermissions },
    { href: '/expenses', label: 'Expense Claims', icon: ReceiptText, color: 'text-emerald-500', permissionKey: 'expenses' as keyof EmployeePermissions },
    { href: '/habit-tracker', label: 'Habit Tracker', icon: Target, color: 'text-rose-500', permissionKey: 'habit_tracker' as keyof EmployeePermissions },
    { href: '/recruitment', label: 'Recruitment', icon: Briefcase, color: 'text-indigo-500', permissionKey: 'recruitment' as keyof EmployeePermissions },
    { href: '/hr-calendar', label: 'HR Calendar', icon: Calendar, color: 'text-pink-500', permissionKey: 'hr_calendar' as keyof EmployeePermissions },
  ], []);
  
  const hasAccess = (permissionKey: keyof EmployeePermissions) => {
    const permission = getPermission(permissionKey);
    return permission !== 'none' && permission !== 'employee_only';
  }
  
  const hasEmployeeAccess = (permissionKey: keyof EmployeePermissions) => {
    return getPermission(permissionKey) !== 'none';
  }

  if (!user) {
    return null;
  }
  
  const employeeNavItems = [
    { href: '/', label: 'My Dashboard', icon: Users, color: 'text-blue-500', permissionKey: 'employees' as keyof EmployeePermissions },
    { href: '/leaves', label: 'Leave Account', icon: Plane, color: 'text-sky-500', permissionKey: 'leaves' as keyof EmployeePermissions },
    { href: '/expenses', label: 'Expense Claims', icon: ReceiptText, color: 'text-emerald-500', permissionKey: 'expenses' as keyof EmployeePermissions },
  ]

  const itemsToRender = getPermission('employees') === 'employee_only' ? employeeNavItems : navItems;


  return (
    <div className="flex h-full flex-col sidebar-glass">
      <SidebarHeader className="border-b bg-primary/5 py-6">
        <Link href="/" className="flex items-center gap-3 px-4">
           <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-xl shadow-primary/20">
              <Sparkles className="h-6 w-6" />
           </div>
           <div className="flex flex-col">
              <span className="text-base font-black leading-none tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">HR STUDIO</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Enterprise</span>
           </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="py-6 px-3">
        <SidebarMenu>
          {itemsToRender.map((item) => {
             const canAccess = hasEmployeeAccess(item.permissionKey);
             const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

             return canAccess && (
                 <SidebarMenuItem key={item.href} className="mb-1">
                    <Link href={item.href}>
                      <SidebarMenuButton 
                        isActive={isActive}
                        tooltip={item.label}
                        className={cn(
                          "transition-all duration-300 rounded-xl h-11 px-4 gap-3",
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]" 
                            : "hover:bg-primary/10 hover:translate-x-1"
                        )}
                       >
                        <item.icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-white" : item.color)} />
                        <span className="font-semibold">{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                 </SidebarMenuItem>
             )
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t bg-muted/20 p-4">
        <SidebarMenu>
            {hasAccess('settings') && (
                <SidebarMenuItem>
                    <Link href="/settings">
                        <SidebarMenuButton 
                          isActive={pathname.startsWith('/settings')} 
                          tooltip="Settings"
                          className={cn(
                            "transition-all duration-300 rounded-xl h-11 px-4 gap-3",
                            pathname.startsWith('/settings')
                              ? "bg-slate-800 text-white shadow-lg" 
                              : "hover:bg-slate-100"
                          )}
                        >
                            <Settings className={cn("h-5 w-5 shrink-0", pathname.startsWith('/settings') ? "text-white" : "text-slate-500")} />
                            <span className="font-semibold">Settings</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            )}
        </SidebarMenu>
      </SidebarFooter>
    </div>
  );
}