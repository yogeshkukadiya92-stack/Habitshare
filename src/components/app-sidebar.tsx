'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Target, LayoutDashboard, UserRound } from 'lucide-react';
import { useAuth } from './auth-provider';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent, SidebarFooter } from './ui/sidebar';

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = useMemo(() => [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/habit-tracker', label: 'My Habits', icon: Target },
  ], []);

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      <SidebarHeader className="border-b bg-slate-50/50 py-6">
        <Link href="/" className="flex items-center gap-3 px-4">
           <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <UserRound className="h-6 w-6" />
           </div>
           <div className="flex flex-col">
              <span className="text-lg font-bold leading-none tracking-tight text-slate-900">HABIT SHARE</span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-1">Social Tracker</span>
           </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="py-6 px-3">
        <SidebarMenu>
          {navItems.map((item) => {
             const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

             return (
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
             );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t bg-slate-50/50 p-4">
        <SidebarMenu>
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
        </SidebarMenu>
      </SidebarFooter>
    </div>
  );
}
