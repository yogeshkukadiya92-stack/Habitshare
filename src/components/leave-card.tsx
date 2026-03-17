
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal, Calendar, CheckCircle, XCircle, Hourglass, Trash2, Edit, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Employee, Leave, LeaveStatus } from '@/lib/types';
import { cn, ensureDate } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { AddLeaveRequestDialog } from './add-leave-request-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './auth-provider';

const statusConfig: Record<LeaveStatus, { className: string; icon: React.ElementType }> = {
  'Pending': { className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Hourglass },
  'Approved': { className: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  'Rejected': { className: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
};

interface LeaveCardProps {
    leave: Leave;
    employees: Employee[];
    onSave: (leave: Leave) => void;
    onDelete: (id: string) => void;
}

export function LeaveCard({ leave, employees, onSave, onDelete }: LeaveCardProps) {
  const { toast } = useToast();
  const { getPermission } = useAuth();
  const isAdmin = getPermission('leaves') === 'download' || getPermission('leaves') === 'edit';
  
  const Icon = statusConfig[leave.status].icon;
  const duration = leave.duration ?? (differenceInDays(ensureDate(leave.endDate), ensureDate(leave.startDate)) + 1);

  const handleStatusChange = (leave: Leave, status: LeaveStatus) => {
    onSave({ ...leave, status });
    toast({
        title: status === 'Approved' ? "Leave Approved" : "Status Updated",
        description: `Leave request for ${leave.employee.name} has been ${status.toLowerCase()}.`
    })
  }

  return (
    <Card className={cn("flex flex-col h-full border-slate-200 shadow-sm transition-all hover:shadow-md", leave.status === 'Pending' && 'border-l-4 border-l-yellow-400')}>
      <CardHeader className="p-4">
        <div className="flex items-start justify-between">
            <div className='flex items-center gap-3'>
                <Avatar className="h-10 w-10 border border-slate-100">
                    <AvatarImage src={leave.employee.avatarUrl} alt={leave.employee.name} data-ai-hint="people" />
                    <AvatarFallback>{leave.employee.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-sm font-bold">{leave.employee.name}</CardTitle>
                    <CardDescription className='text-[10px] uppercase font-bold tracking-tighter text-slate-400'>Leave Request</CardDescription>
                </div>
            </div>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="text-[11px]">
                <DropdownMenuLabel className="text-[10px]">Actions</DropdownMenuLabel>
                    <AddLeaveRequestDialog leave={leave} onSave={onSave} employees={employees}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                        <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                </AddLeaveRequestDialog>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleStatusChange(leave, 'Approved')} disabled={leave.status === 'Approved'} className="cursor-pointer text-green-600">
                    <CheckCircle className="mr-2 h-4 w-4" /> Approve
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange(leave, 'Rejected')} disabled={leave.status === 'Rejected'} className="cursor-pointer text-rose-600">
                    <XCircle className="mr-2 h-4 w-4" /> Reject
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(leave.id)} className="text-destructive cursor-pointer">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 p-4 pt-0">
         <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 bg-slate-50 p-1.5 rounded-md border border-slate-100">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>{format(ensureDate(leave.startDate), 'MMM d')} - {format(ensureDate(leave.endDate), 'MMM d, yyyy')}</span>
        </div>
        <p className="text-xs text-slate-500 italic leading-relaxed line-clamp-3">"{leave.reason}"</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center p-4 border-t bg-slate-50/50">
        <Badge variant="outline" className={cn('gap-1.5 h-6 text-[10px] font-bold px-2', statusConfig[leave.status].className)}>
            <Icon className="h-3 w-3" />
            {leave.status}
        </Badge>
        <div className='flex items-center gap-2'>
            <Badge variant="secondary" className="text-[10px] font-bold h-6">{duration} day{duration > 1 ? 's' : ''}</Badge>
            {(leave.status === 'Pending' && isAdmin) && (
                <Button 
                    size="sm" 
                    className="h-7 gap-1 text-[10px] font-bold bg-green-600 hover:bg-green-700"
                    onClick={() => handleStatusChange(leave, 'Approved')}
                >
                    <Check className="h-3 w-3" /> Approve
                </Button>
            )}
        </div>
      </CardFooter>
    </Card>
  );
}
