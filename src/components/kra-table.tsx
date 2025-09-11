

'use client';

import * as React from 'react';
import { MoreHorizontal, CalendarCheck2, ChevronRight, MessageSquare, Edit } from 'lucide-react';
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
import type { Employee, KRA, KRAStatus, WeeklyUpdateStatus, ActionItem } from '@/lib/types';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

const statusStyles: Record<KRAStatus, string> = {
  'On Track': 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800',
  'At Risk': 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800',
  Completed: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
  Pending: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700',
};

const weeklyUpdateStatusStyles: Record<WeeklyUpdateStatus, string> = {
    'On Track': 'bg-green-100 text-green-800',
    'Delayed': 'bg-yellow-100 text-yellow-800',
    'Completed': 'bg-blue-100 text-blue-800',
    'At Risk': 'bg-orange-100 text-orange-800',
    'Issue': 'bg-red-100 text-red-800',
};


const QuickUpdateDialog = ({ action, onUpdate, children }: { action: ActionItem, onUpdate: (newValue: number) => void, children: React.ReactNode }) => {
    const [open, setOpen] = React.useState(false);
    const [value, setValue] = React.useState(action.achieved || 0);

    React.useEffect(() => {
        if(open) {
            setValue(action.achieved || 0);
        }
    }, [open, action.achieved]);

    const handleSave = () => {
        onUpdate(value);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-xs">
                <DialogHeader>
                    <DialogTitle>Quick Update KPI</DialogTitle>
                    <DialogDescription>Update the total achieved value for "{action.name}".</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="achievedValue">Total Achieved Value</Label>
                    <Input
                        id="achievedValue"
                        type="number"
                        value={value}
                        onChange={(e) => setValue(Number(e.target.value))}
                        placeholder="e.g., 150"
                    />
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


interface KraTableProps {
    kras: KRA[];
    employees: Employee[];
    onSave: (kra: KRA) => void;
    onDelete: (id: string) => void;
}

const KpiRow = ({ kra, action, onSave }: { kra: KRA, action: ActionItem, onSave: (kra: KRA) => void }) => {
  const [open, setOpen] = React.useState(false);
  const achieved = action.achieved || action.updates?.reduce((sum, u) => sum + (u.value || 0), 0) || 0;
  
  let marks = 0;
  if(action.target && action.target > 0 && action.weightage && action.weightage > 0) {
    marks = (achieved / action.target) * action.weightage;
  } else if (action.isCompleted && action.weightage) {
    marks = action.weightage;
  }
  marks = Math.round(marks * 100) / 100;

  const updateKra = (updatedAction: ActionItem) => {
    const newActions = kra.actions!.map(a => a.id === updatedAction.id ? updatedAction : a);
    let totalMarks = 0;

    newActions.forEach(act => {
        const actAchieved = act.achieved || act.updates?.reduce((sum, u) => sum + (u.value || 0), 0) || 0;
         if(act.target && act.target > 0 && act.weightage && act.weightage > 0) {
            totalMarks += (actAchieved / act.target) * act.weightage;
        } else if (act.isCompleted && act.weightage) {
            totalMarks += act.weightage;
        }
    });
    onSave({ ...kra, actions: newActions, marksAchieved: totalMarks });
  };

  const handleCheckedChange = (checked: boolean) => {
    updateKra({ ...action, isCompleted: checked });
  };

  const handleQuickUpdate = (newValue: number) => {
     updateKra({ ...action, achieved: newValue });
  }

  return (
    <Collapsible key={action.id} open={open} onOpenChange={setOpen}>
      <div className='flex items-center gap-2 text-sm py-1'>
        <Checkbox 
            id={`action-${kra.id}-${action.id}`}
            checked={action.isCompleted}
            onCheckedChange={handleCheckedChange}
        />
        <div className={cn("flex-1", action.isCompleted && 'line-through text-muted-foreground')}>
            {action.name} 
             {action.target && (
                 <QuickUpdateDialog action={{...action, achieved}} onUpdate={handleQuickUpdate}>
                    <span className='text-muted-foreground text-xs cursor-pointer hover:underline'> ({achieved} / {action.target})</span>
                 </QuickUpdateDialog>
            )}
        </div>
        <Badge variant="outline" className='font-mono w-12 justify-center'>{action.weightage}</Badge>
        <Badge variant="secondary" className='font-mono w-12 justify-center'>{marks}</Badge>
        {(action.updates && action.updates.length > 0) && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className='h-6 w-6'>
                    <ChevronRight className={cn("h-4 w-4 transition-transform", open && "rotate-90")} />
                </Button>
            </CollapsibleTrigger>
        )}
    </div>
      <CollapsibleContent className='py-2 pr-4 pl-6'>
        <p className='text-xs font-semibold mb-1'>Weekly Updates:</p>
        <div className='border rounded-md max-h-40 overflow-y-auto'>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className='h-8 text-xs'>Date</TableHead>
                        <TableHead className='h-8 text-xs'>Status</TableHead>
                        <TableHead className='h-8 text-xs'>Value</TableHead>
                        <TableHead className='h-8 text-xs'>Comment</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {action.updates?.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(update => (
                        <TableRow key={update.id}>
                            <TableCell className='text-xs py-1.5'>{format(new Date(update.date), 'MMM d')}</TableCell>
                            <TableCell className='py-1.5'>
                                <Badge variant="outline" className={cn('text-xs', weeklyUpdateStatusStyles[update.status])}>{update.status}</Badge>
                            </TableCell>
                            <TableCell className='text-xs py-1.5'>{update.value}</TableCell>
                              <TableCell className='text-xs py-1.5'>{update.comment}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}


export function KraTable({ kras, employees, onSave, onDelete }: KraTableProps) {
  
  return (
     <TooltipProvider>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead className='w-[450px]'>KRA-KPI</TableHead>
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
                    <div className='mt-2 space-y-1 pl-4 border-l ml-2'>
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground py-1">
                            <span className="flex-1">KPI</span>
                            <span className='w-12 text-center'>Weight</span>
                            <span className='w-12 text-center'>Marks</span>
                            <span className='w-6'></span>
                        </div>
                        {kra.actions.map((action) => (
                           <KpiRow key={action.id} kra={kra} action={action} onSave={onSave} />
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
                            {finalMarks.toFixed(2)}
                        </span>
                    </TooltipTrigger>
                     {hasBonusOrPenalty && (
                        <TooltipContent>
                            <div className="text-xs">
                                <p>Base: {baseMarks.toFixed(2)}</p>
                                {bonus > 0 && <p>Bonus: +{bonus}</p>}
                                {penalty > 0 && <p>Penalty: -{penalty}</p>}
                                <p className="font-bold border-t mt-1 pt-1">Total: {finalMarks.toFixed(2)}</p>
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
