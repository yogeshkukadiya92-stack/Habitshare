
'use client';

import * as React from 'react';
import { MoreHorizontal, Calendar, CheckCircle, XCircle, Hourglass, Trash2, Fingerprint, Check } from 'lucide-react';
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
import { cn, ensureDate } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AddLeaveRequestDialog } from './add-leave-request-dialog';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from './ui/checkbox';
import { useDataStore } from '@/hooks/use-data-store';
import { useAuth } from './auth-provider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const statusConfig: Record<LeaveStatus, { className: string; icon: React.ElementType }> = {
  'Pending': { 
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800',
    icon: Hourglass
  },
  'Approved': { 
    className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-yellow-800',
    icon: CheckCircle
  },
  'Rejected': {
    className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-yellow-800',
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
  const { getPermission } = useAuth();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const { handleDeleteMultipleLeaves } = useDataStore();
  
  const isAdmin = getPermission('leaves') === 'download' || getPermission('leaves') === 'edit';

  const handleStatusChange = (leave: Leave, status: LeaveStatus) => {
    onSave({ ...leave, status });
    toast({
        title: status === 'Approved' ? "Leave Approved" : "Status Updated",
        description: `Leave request for ${leave.employee.name} has been ${status.toLowerCase()}.`
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(leaves.map(l => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleBulkDelete = () => {
    handleDeleteMultipleLeaves(selectedIds);
    setSelectedIds([]);
    toast({ title: "Bulk Delete Successful", description: `${selectedIds.length} requests removed.` });
  };

  return (
     <TooltipProvider>
      <div className="space-y-4">
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-2 bg-muted rounded-md border border-primary/20">
            <span className="text-sm font-medium">{selectedIds.length} items selected</span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Selected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {selectedIds.length} leave requests. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
        <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={selectedIds.length === leaves.length && leaves.length > 0}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  />
                </TableHead>
                <TableHead className='text-[10px] uppercase font-bold tracking-wider py-0 h-10'>Employee</TableHead>
                <TableHead className='text-[10px] uppercase font-bold tracking-wider py-0 h-10'>Dates</TableHead>
                <TableHead className='text-[10px] uppercase font-bold tracking-wider py-0 h-10'>Days</TableHead>
                <TableHead className='text-[10px] uppercase font-bold tracking-wider py-0 h-10'>Reason</TableHead>
                <TableHead className='text-[10px] uppercase font-bold tracking-wider py-0 h-10'>Status & Action</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground italic">
                          No leave requests found.
                      </TableCell>
                  </TableRow>
              )}
              {leaves.map((leave) => {
                 const Icon = statusConfig[leave.status].icon;
                 const duration = leave.duration ?? (differenceInDays(ensureDate(leave.endDate), ensureDate(leave.startDate)) + 1);
                 return(
                <TableRow key={leave.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.includes(leave.id)}
                      onCheckedChange={(checked) => handleSelectOne(leave.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-slate-200">
                        <AvatarImage src={leave.employee.avatarUrl} alt={leave.employee.name} data-ai-hint="people" />
                        <AvatarFallback>{leave.employee.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-bold text-xs">{leave.employee.name}</div>
                        <div className='flex items-center gap-1 text-[9px] text-muted-foreground font-mono'>
                            <Fingerprint className='h-2.5 w-2.5'/> {leave.employee.id.slice(0,8)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{format(ensureDate(leave.startDate), 'MMM d')} - {format(ensureDate(leave.endDate), 'MMM d, yyyy')}</span>
                      </div>
                  </TableCell>
                  <TableCell>
                      <Badge variant="secondary" className="text-[10px] font-bold h-5 px-1.5">{duration} day{duration > 1 ? 's' : ''}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                       <Tooltip>
                          <TooltipTrigger className="text-left">
                             <p className="truncate text-xs text-slate-500 italic max-w-[150px]">"{leave.reason}"</p>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                             <p>{leave.reason}</p>
                          </TooltipContent>
                      </Tooltip>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                        <Badge variant="outline" className={cn('gap-1.5 h-6 px-2 text-[10px] font-bold min-w-[80px] justify-center', statusConfig[leave.status].className)}>
                            <Icon className="h-3 w-3" />
                            {leave.status}
                        </Badge>
                        {(leave.status === 'Pending' && isAdmin) && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button 
                                        size="icon" 
                                        variant="outline" 
                                        className="h-7 w-7 rounded-full border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                                        onClick={() => handleStatusChange(leave, 'Approved')}
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="text-[10px]">Quick Approve</TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
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
                                  Edit Request
                              </DropdownMenuItem>
                          </AddLeaveRequestDialog>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleStatusChange(leave, 'Approved')} disabled={leave.status === 'Approved'} className="cursor-pointer text-green-600">
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                          </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleStatusChange(leave, 'Rejected')} disabled={leave.status === 'Rejected'} className="cursor-pointer text-rose-600">
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                          </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleStatusChange(leave, 'Pending')} disabled={leave.status === 'Pending'} className="cursor-pointer">
                              <Hourglass className="mr-2 h-4 w-4 text-yellow-500" />
                              Revert to Pending
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onDelete(leave.id)} className="text-destructive cursor-pointer">
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
      </div>
    </TooltipProvider>
  );
}
