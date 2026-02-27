'use client';

import * as React from 'react';
import { MoreHorizontal, Calendar, CheckCircle, XCircle, Hourglass, Trash2, BadgeDollarSign, Car, Utensils, BedDouble } from 'lucide-react';
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
import type { Employee, Expense, ExpenseStatus, ExpenseType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AddExpenseClaimDialog } from './add-expense-claim-dialog';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from './ui/checkbox';
import { useDataStore } from '@/hooks/use-data-store';
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

const statusConfig: Record<ExpenseStatus, { className: string; icon: React.ElementType }> = {
  'Pending': { 
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Hourglass
  },
  'Approved': { 
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle
  },
  'Rejected': {
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle
  },
  'Paid': {
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: BadgeDollarSign
  }
};

const typeConfig: Record<ExpenseType, { icon: React.ElementType }> = {
    'Travel': { icon: Car },
    'Food': { icon: Utensils },
    'Accommodation': { icon: BedDouble },
}

interface ExpenseClaimsTableProps {
    expenses: Expense[];
    employees: Employee[];
    onSave: (expense: Expense) => void;
    onDelete: (id: string) => void;
}

export function ExpenseClaimsTable({ expenses, employees, onSave, onDelete }: ExpenseClaimsTableProps) {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const { handleDeleteMultipleExpenses } = useDataStore();

  const handleStatusChange = (expense: Expense, status: ExpenseStatus) => {
    onSave({ ...expense, status });
    toast({
        title: "Status Updated",
        description: `Expense claim for ${expense.employee.name} has been marked as ${status.toLowerCase()}.`
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(expenses.map(e => e.id));
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
    handleDeleteMultipleExpenses(selectedIds);
    setSelectedIds([]);
    toast({ title: "Bulk Delete Successful", description: `${selectedIds.length} claims removed.` });
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
                    This will permanently delete {selectedIds.length} expense claims. This action cannot be undone.
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
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={selectedIds.length === expenses.length && expenses.length > 0}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  />
                </TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                          No expense claims found.
                      </TableCell>
                  </TableRow>
              )}
              {expenses.map((expense) => {
                 const StatusIcon = statusConfig[expense.status].icon;
                 const TypeIcon = typeConfig[expense.expenseType].icon;

                 return(
                <TableRow key={expense.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.includes(expense.id)}
                      onCheckedChange={(checked) => handleSelectOne(expense.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={expense.employee.avatarUrl} alt={expense.employee.name} data-ai-hint="people" />
                        <AvatarFallback>{expense.employee.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{expense.employee.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{format(expense.date, 'MMM d, yyyy')}</span>
                      </div>
                  </TableCell>
                   <TableCell>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Badge variant="outline" className="flex items-center justify-center gap-2 w-28">
                                  <TypeIcon className="h-4 w-4" />
                                  {expense.expenseType}
                              </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                             <p>{expense.expenseType} Claim</p>
                          </TooltipContent>
                      </Tooltip>
                  </TableCell>
                  <TableCell className="max-w-xs">
                       <Tooltip>
                          <TooltipTrigger>
                             <p className="truncate">{expense.description}</p>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                             <p>{expense.description}</p>
                          </TooltipContent>
                      </Tooltip>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                      ₹{expense.totalAmount.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('gap-1.5 w-28 justify-center', statusConfig[expense.status].className)}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {expense.status}
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
                           <AddExpenseClaimDialog expense={expense} onSave={onSave} employees={employees}>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  Edit
                              </DropdownMenuItem>
                          </AddExpenseClaimDialog>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleStatusChange(expense, 'Approved')} disabled={expense.status === 'Approved' || expense.status === 'Paid'}>
                              <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />
                              Approve
                          </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleStatusChange(expense, 'Rejected')} disabled={expense.status === 'Rejected'}>
                              <XCircle className="mr-2 h-4 w-4 text-red-500" />
                              Reject
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(expense, 'Paid')} disabled={expense.status !== 'Approved'}>
                              <BadgeDollarSign className="mr-2 h-4 w-4 text-green-500" />
                              Mark as Paid
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onDelete(expense.id)} className="text-destructive">
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
