'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Users, ListTodo, Plane, UserCheck, ReceiptText, Target, Calendar, ListChecks, LayoutDashboard } from 'lucide-react';
import { useAuth } from './auth-provider';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent, SidebarFooter } from './ui/sidebar';
import type { EmployeePermissions } from '@/lib/types';

export function AppSidebar() {
  const pathname = usePathname();
  const { user, getPermission } = useAuth();

  const navItems = useMemo(() => [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, permissionKey: 'employees' as keyof EmployeePermissions },
    { href: '/kras', label: 'KRA Management', icon: ListChecks, permissionKey: 'employees' as keyof EmployeePermissions },
    { href: '/routine-tasks', label: 'Routine Tasks', icon: ListTodo, permissionKey: 'routine_tasks' as keyof EmployeePermissions },
    { href: '/leaves', label: 'Leave Account', icon: Plane, permissionKey: 'leaves' as keyof EmployeePermissions },
    { href: '/attendance', label: 'Attendance', icon: UserCheck, permissionKey: 'attendance' as keyof EmployeePermissions },
    { href: '/expenses', label: 'Expense Claims', icon: ReceiptText, permissionKey: 'expenses' as keyof EmployeePermissions },
    { href: '/habit-tracker', label: 'Habit Tracker', icon: Target, permissionKey: 'habit_tracker' as keyof EmployeePermissions },
    { href: '/recruitment', label: 'Recruitment', icon: Users, permissionKey: 'recruitment' as keyof EmployeePermissions },
    { href: '/hr-calendar', label: 'HR Calendar', icon: Calendar, permissionKey: 'hr_calendar' as keyof EmployeePermissions },
  ], []);
  
  const hasEmployeeAccess = (permissionKey: keyof EmployeePermissions) => {
    return getPermission(permissionKey) !== 'none';
  }

  if (!user) {
    return null;
  }
  
  const employeeNavItems = [
    { href: '/', label: 'My Dashboard', icon: LayoutDashboard, permissionKey: 'employees' as keyof EmployeePermissions },
    { href: '/leaves', label: 'Leave Account', icon: Plane, permissionKey: 'leaves' as keyof EmployeePermissions },
    { href: '/expenses', label: 'Expense Claims', icon: ReceiptText, permissionKey: 'expenses' as keyof EmployeePermissions },
  ]

  const itemsToRender = getPermission('employees') === 'employee_only' ? employeeNavItems : navItems;

  return (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      <SidebarHeader className="border-b bg-slate-50/50 py-6">
        <Link href="/" className="flex items-center gap-3 px-4">
           <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <LayoutDashboard className="h-6 w-6" />
           </div>
           <div className="flex flex-col">
              <span className="text-lg font-bold leading-none tracking-tight text-slate-900">HR STUDIO</span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-1">Enterprise</span>
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
                          "transition-all duration-200 rounded-md h-10 px-4 gap-3",
                          isActive 
                            ? "bg-primary/10 text-primary font-bold" 
                            : "hover:bg-slate-100 text-slate-600"
                        )}
                       >
                        <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "text-slate-400")} />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                 </SidebarMenuItem>
             )
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t bg-slate-50/50 p-4">
        <SidebarMenu>
            {getPermission('settings') !== 'none' && (
                <SidebarMenuItem>
                    <Link href="/settings">
                        <SidebarMenuButton 
                          isActive={pathname.startsWith('/settings')} 
                          tooltip="Settings"
                          className={cn(
                            "transition-all duration-200 rounded-md h-10 px-4 gap-3",
                            pathname.startsWith('/settings')
                              ? "bg-slate-200 text-slate-900 font-bold" 
                              : "hover:bg-slate-100 text-slate-600"
                          )}
                        >
                            <Settings className="h-5 w-5 shrink-0" />
                            <span>Settings</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            )}
        </SidebarMenu>
      </SidebarFooter>
    </div>
  );
}