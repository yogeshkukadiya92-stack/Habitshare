
'use client';

import * as React from 'react';
import { MoreHorizontal, Calendar, CheckCircle, XCircle, Hourglass, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AddLeaveRequestDialog } from './add-leave-request-dialog';
import { useToast } from '@/hooks/use-toast';

const statusConfig: Record<LeaveStatus, { className: string; icon: React.ElementType }> = {
  'Pending': { 
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800',
    icon: Hourglass
  },
  'Approved': { 
    className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800',
    icon: CheckCircle
  },
  'Rejected': {
    className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800',
    icon: XCircle
  },
};

interface LeaveRequestsTableProps {
    leaves: Leave[];
    employees: Employee[];
    onSave: (leave: Leave) => void;
    onDelete: (id: string) => void;
}

export function LeaveRequestsTable({ leaves, employees, onSave, onDelete }: LeaveRequestsTableProps) {
  const { toast } = useToast();

  const handleStatusChange = (leave: Leave, status: LeaveStatus) => {
    onSave({ ...leave, status });
    toast({
        title: "Status Updated",
        description: `Leave request for ${leave.employee.name} has been ${status.toLowerCase()}.`
    })
  }

  return (
     <TooltipProvider>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaves.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                        No leave requests found.
                    </TableCell>
                </TableRow>
            )}
            {leaves.map((leave) => {
               const Icon = statusConfig[leave.status].icon;
               const duration = differenceInDays(leave.endDate, leave.startDate) + 1;
               return(
              <TableRow key={leave.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={leave.employee.avatarUrl} alt={leave.employee.name} data-ai-hint="people" />
                      <AvatarFallback>{leave.employee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{leave.employee.name}</div>
                  </div>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{format(leave.startDate, 'MMM d')} - {format(leave.endDate, 'MMM d, yyyy')}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <Badge variant="outline">{duration} day{duration > 1 ? 's' : ''}</Badge>
                </TableCell>
                <TableCell>
                    <span className="font-medium">{leave.leaveType}</span>
                </TableCell>
                <TableCell className="max-w-xs">
                     <Tooltip>
                        <TooltipTrigger>
                           <p className="truncate">{leave.reason}</p>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                           <p>{leave.reason}</p>
                        </TooltipContent>
                    </Tooltip>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn('gap-1.5', statusConfig[leave.status].className)}>
                    <Icon className="h-3.5 w-3.5" />
                    {leave.status}
                  </Badge>
                </TableCell>
                <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                         <AddLeaveRequestDialog leave={leave} onSave={onSave} employees={employees}>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                Edit
                            </DropdownMenuItem>
                        </AddLeaveRequestDialog>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatusChange(leave, 'Approved')} disabled={leave.status === 'Approved'}>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                            Approve
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => handleStatusChange(leave, 'Rejected')} disabled={leave.status === 'Rejected'}>
                            <XCircle className="mr-2 h-4 w-4 text-red-500" />
                            Reject
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => handleStatusChange(leave, 'Pending')} disabled={leave.status === 'Pending'}>
                            <Hourglass className="mr-2 h-4 w-4 text-yellow-500" />
                            Mark as Pending
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(leave.id)} className="text-destructive">
                           <Trash2 className="mr-2 h-4 w-4" />
                           Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
