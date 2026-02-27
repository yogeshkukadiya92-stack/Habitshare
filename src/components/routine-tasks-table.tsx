'use client';

import * as React from 'react';
import { MoreHorizontal, Flag, Calendar, MessageSquare, Edit, Trash2 } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Employee, RoutineTask, RoutineTaskStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AddRoutineTaskDialog } from './add-routine-task-dialog';
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
import { useToast } from '@/hooks/use-toast';

const statusStyles: Record<RoutineTaskStatus, string> = {
  'To Do': 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700',
  'In Progress': 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800',
  'Completed': 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800',
};

const priorityStyles: Record<'Low' | 'Medium' | 'High', string> = {
    'Low': 'text-gray-500',
    'Medium': 'text-yellow-500',
    'High': 'text-red-500',
}

interface RoutineTasksTableProps {
    tasks: RoutineTask[];
    employees: Employee[];
    onSave: (task: RoutineTask) => void;
    onDelete: (id: string) => void;
}

export function RoutineTasksTable({ tasks, employees, onSave, onDelete }: RoutineTasksTableProps) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const { handleDeleteMultipleRoutineTasks } = useDataStore();
  const { toast } = useToast();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(tasks.map(t => t.id));
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
    handleDeleteMultipleRoutineTasks(selectedIds);
    setSelectedIds([]);
    toast({ title: "Bulk Delete Successful", description: `${selectedIds.length} tasks removed.` });
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
                    This will permanently delete {selectedIds.length} routine tasks.
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
                    checked={selectedIds.length === tasks.length && tasks.length > 0}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  />
                </TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                          No routine tasks found.
                      </TableCell>
                  </TableRow>
              )}
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.includes(task.id)}
                      onCheckedChange={(checked) => handleSelectOne(task.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium max-w-sm">
                      <AddRoutineTaskDialog task={task} onSave={onSave} employees={employees}>
                          <div className="cursor-pointer group">
                              <div className="flex items-center gap-2">
                                  <p className="truncate font-semibold group-hover:underline">{task.title}</p>
                                  {task.remarks && (
                                      <Tooltip>
                                          <TooltipTrigger onClick={(e) => e.stopPropagation()}>
                                              <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                              <p>{task.remarks}</p>
                                          </TooltipContent>
                                      </Tooltip>
                                  )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                          </div>
                      </AddRoutineTaskDialog>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={task.employee.avatarUrl} alt={task.employee.name} data-ai-hint="people" />
                        <AvatarFallback>{task.employee.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{task.employee.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                       <div className="text-sm text-muted-foreground">
                          <p>Assigned: {format(new Date(task.assignedDate), 'MMM d, yyyy')}</p>
                          <p className='font-semibold text-foreground'>Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}</p>
                       </div>
                  </TableCell>
                  <TableCell>
                      <Tooltip>
                          <TooltipTrigger>
                             <Flag className={cn("h-5 w-5", priorityStyles[task.priority])} />
                          </TooltipTrigger>
                          <TooltipContent>
                             <p>{task.priority} Priority</p>
                          </TooltipContent>
                      </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(statusStyles[task.status])}>
                      {task.status}
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
                           <AddRoutineTaskDialog task={task} onSave={onSave} employees={employees}>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                              </DropdownMenuItem>
                          </AddRoutineTaskDialog>
                          <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
}
