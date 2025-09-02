
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Package2, Users, ListTodo, Plane, UserCheck, ReceiptText, Target, CalendarDays, Briefcase, Calendar } from 'lucide-react';
import { useAuth } from './auth-provider';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent, SidebarFooter } from './ui/sidebar';

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = useMemo(() => [
    { href: '/', label: 'Employees', icon: Users, show: true },
    { href: '/routine-tasks', label: 'Routine Tasks', icon: ListTodo, show: true },
    { href: '/leaves', label: 'Leave Management', icon: Plane, show: true },
    { href: '/attendance', label: 'Attendance', icon: UserCheck, show: true },
    { href: '/expenses', label: 'Expense Claims', icon: ReceiptText, show: true },
    { href: '/habit-tracker', label: 'Habit Tracker', icon: Target, show: true },
    { href: '/holidays', label: 'Holidays', icon: CalendarDays, show: true },
    { href: '/recruitment', label: 'Recruitment', icon: Briefcase, show: true },
    { href: '/hr-calendar', label: 'HR Calendar', icon: Calendar, show: true },
  ], []);


  if (!user) {
    return null;
  }

  return (
    <>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 font-semibold">
           <Package2 />
           <span>KRA Dashboard</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
             <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton 
                    isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                    tooltip={item.label}
                   >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
             </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
            <SidebarMenuItem>
                <Link href="/settings">
                    <SidebarMenuButton isActive={pathname.startsWith('/settings')} tooltip="Settings">
                        <Settings />
                        <span>Settings</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
