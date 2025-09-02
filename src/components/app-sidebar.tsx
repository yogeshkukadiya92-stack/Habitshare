
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Settings, Package2, TrendingUp, Users, ListTodo, Plane, UserCheck, ReceiptText, Target, CalendarDays, Briefcase, Calendar } from 'lucide-react';
import { useAuth } from './auth-provider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

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
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 py-4 mt-14">
          {navItems.map((item) => item.show && (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                    (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))) && 'bg-accent text-accent-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                    pathname === '/settings' && 'bg-accent text-accent-foreground'
                )}
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
        </nav>
      </TooltipProvider>
    </aside>
  );
}
