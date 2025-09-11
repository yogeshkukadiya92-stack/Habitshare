

'use client';

import * as React from 'react';
import { MoreHorizontal, CalendarCheck2 } from 'lucide-react';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Employee, KRA, KRAStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { AddKraDialog } from './add-kra-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Checkbox } from './ui/checkbox';

const statusStyles: Record<KRAStatus, string> = {
  'On Track': 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800',
  'At Risk': 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800',
  Completed: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
  Pending: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700',
};

interface KraTableProps {
    kras: KRA[];
    employees: Employee[];
    onSave: (kra: KRA) => void;
    onDelete: (id: string) => void;
}


export function KraTable({ kras, employees, onSave, onDelete }: KraTableProps) {
  
  return (
     <TooltipProvider>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead className='w-[400px]'>KRA-KPI</TableHead>
          <TableHead>Weightage</TableHead>
          <TableHead>Marks Achieved</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {kras.map((kra) => {
          const baseMarks = kra.marksAchieved ?? 0;
          const bonus = kra.bonus ?? 0;
          const penalty = kra.penalty ?? 0;
          const finalMarks = baseMarks + bonus - penalty;
          const hasBonusOrPenalty = bonus > 0 || penalty > 0;

          return (
          <TableRow key={kra.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={kra.employee.avatarUrl} alt={kra.employee.name} data-ai-hint="people" />
                  <AvatarFallback>{kra.employee.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="font-medium">{kra.employee.name}</div>
              </div>
            </TableCell>
            <TableCell className="max-w-sm align-top">
                <AddKraDialog kra={kra} onSave={onSave} employees={employees}>
                    <div className="cursor-pointer">
                        <p className="font-semibold hover:underline">{kra.taskDescription || "KRA"}</p>
                        <p className="text-xs text-muted-foreground">Due: {format(kra.endDate, 'MMM d, yyyy')}</p>
                    </div>
                </AddKraDialog>
                {(kra.actions && kra.actions.length > 0) && (
                    <div className='mt-2 space-y-1 pl-4'>
                        {kra.actions.map((action, index) => (
                            <div key={action.id} className='flex items-center gap-2 text-sm'>
                                <Checkbox 
                                    id={`action-${kra.id}-${action.id}`}
                                    checked={action.isCompleted}
                                    onCheckedChange={(checked) => {
                                        const newActions = [...kra.actions!];
                                        newActions[index].isCompleted = !!checked;
                                        onSave({...kra, actions: newActions});
                                    }}
                                />
                                <label htmlFor={`action-${kra.id}-${action.id}`} className={cn("flex-1", action.isCompleted && 'line-through text-muted-foreground')}>{action.name}</label>
                                <Badge variant="outline" className='font-mono'>{action.weightage}</Badge>
                            </div>
                        ))}
                    </div>
                )}
            </TableCell>
            <TableCell className="align-top">
                 {kra.weightage !== null ? (
                    <span className="font-semibold text-base">{kra.weightage}</span>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )}
            </TableCell>
            <TableCell className="align-top">
                <Tooltip>
                    <TooltipTrigger>
                        <span className={cn("font-semibold text-base", hasBonusOrPenalty && 'underline decoration-dotted')}>
                            {finalMarks}
                        </span>
                    </TooltipTrigger>
                     {hasBonusOrPenalty && (
                        <TooltipContent>
                            <div className="text-xs">
                                <p>Base: {baseMarks}</p>
                                {bonus > 0 && <p>Bonus: +{bonus}</p>}
                                {penalty > 0 && <p>Penalty: -{penalty}</p>}
                                <p className="font-bold border-t mt-1 pt-1">Total: {finalMarks}</p>
                            </div>
                        </TooltipContent>
                    )}
                </Tooltip>
            </TableCell>
            <TableCell className="align-top">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <AddKraDialog kra={kra} onSave={onSave} employees={employees}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            Edit
                        </DropdownMenuItem>
                    </AddKraDialog>
                    <DropdownMenuItem onClick={() => onDelete(kra.id)} className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
          </TableRow>
          );
        })}
      </TableBody>
    </Table>
    </TooltipProvider>
  );
}
