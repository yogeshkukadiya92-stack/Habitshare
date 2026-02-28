
'use client';

import * as React from 'react';
import { MoreHorizontal, CalendarCheck2, ChevronRight, MessageSquare, Edit, Trash2, History } from 'lucide-react';
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
import { useDataStore } from '@/hooks/use-data-store';

const statusStyles: Record<KRAStatus, string> = {
  'On Track': 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800',
  'At Risk': 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-green-800',
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

    const pending = Math.max(0, (action.target || 0) - value);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-xs">
                <DialogHeader>
                    <DialogTitle>Quick Progress Update</DialogTitle>
                    <DialogDescription>
                        Update achieved units for "{action.name}".
                        <span className="block mt-1 font-bold text-orange-600">Still Pending: {pending}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                    <Label htmlFor="achievedValue">Total Work Done (Achieved)</Label>
                    <Input
                        id="achievedValue"
                        type="number"
                        value={value}
                        onChange={(e) => setValue(Number(e.target.value))}
                        placeholder="e.g., 150"
                    />
                    <p className='text-xs text-muted-foreground'>Goal Target: {action.target || 'N/A'}</p>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} className='w-full'>Update Goal Achieved</Button>
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
  const target = action.target || 0;
  const pending = Math.max(0, target - achieved);
  
  const updateKra = (updatedAction: ActionItem) => {
    const newActions = kra.actions!.map(a => a.id === updatedAction.id ? updatedAction : a);
    
    // Recalculate everything for the entire KRA
    const totalKpiTarget = newActions.reduce((sum, a) => sum + (a.target || 0), 0);
    const totalKpiAchieved = newActions.reduce((sum, a) => sum + (a.achieved || a.updates?.reduce((s, u) => s + (u.value || 0), 0) || 0), 0);
    
    let totalMarks = 0;
    if (kra.weightage && totalKpiTarget > 0) {
        // Marks are calculated based on overall weighted progress
        totalMarks = (totalKpiAchieved / totalKpiTarget) * kra.weightage;
    }

    const progress = totalKpiTarget > 0 ? Math.round((totalKpiAchieved / totalKpiTarget) * 100) : 0;

    onSave({ 
        ...kra, 
        actions: newActions, 
        marksAchieved: Math.min(kra.weightage || 0, parseFloat(totalMarks.toFixed(2))),
        progress: Math.min(100, progress),
        status: progress >= 100 ? 'Completed' : (progress > 0 ? 'On Track' : 'Pending'),
        achieved: totalKpiAchieved
    });
  };

  const handleCheckedChange = (checked: boolean) => {
    updateKra({ ...action, isCompleted: checked });
  };

  const handleQuickUpdate = (newValue: number) => {
     updateKra({ ...action, achieved: newValue });
  }

  // Visual calculation for this specific row only
  const totalKpiTarget = kra.actions?.reduce((sum, a) => sum + (a.target || 0), 0) || 0;
  const kpiWeightage = (kra.weightage && totalKpiTarget > 0 && action.target) 
    ? (action.target / totalKpiTarget) * kra.weightage 
    : 0;
  let marks = (action.target && action.target > 0) ? (achieved / action.target) * kpiWeightage : 0;
  if (action.isCompleted && marks < kpiWeightage) marks = kpiWeightage;

  return (
    <Collapsible key={action.id} open={open} onOpenChange={setOpen}>
      <div className='flex items-center gap-2 text-sm py-1.5 group border-b border-dashed last:border-0 border-muted-foreground/20'>
        <Checkbox 
            id={`action-${kra.id}-${action.id}`}
            checked={action.isCompleted}
            onCheckedChange={handleCheckedChange}
        />
        <div className={cn("flex-1", action.isCompleted && 'line-through text-muted-foreground')}>
            <span className="font-medium">{action.name}</span>
             {action.target && (
                <div className='flex gap-2 mt-0.5'>
                    <span className='text-[10px] text-primary bg-primary/10 px-1.5 rounded'>Tgt: {target}</span>
                    <span className='text-[10px] text-green-600 bg-green-50 px-1.5 rounded'>Done: {achieved}</span>
                    <span className='text-[10px] text-orange-600 bg-orange-50 px-1.5 rounded font-bold'>Pending: {pending}</span>
                </div>
            )}
        </div>
        
        <QuickUpdateDialog action={{...action, achieved}} onUpdate={handleQuickUpdate}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10">
                        <History className="h-3.5 w-3.5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Quick Weekly Progress Log</TooltipContent>
            </Tooltip>
        </QuickUpdateDialog>

        <div className="flex flex-col items-center">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Weight</span>
            <Badge variant="outline" className='font-mono h-5 px-1 min-w-[30px] justify-center'>{parseFloat(kpiWeightage.toFixed(2))}</Badge>
        </div>
        <div className="flex flex-col items-center">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Marks</span>
            <Badge variant="secondary" className='font-mono h-5 px-1 min-w-[30px] justify-center'>{parseFloat(marks.toFixed(2))}</Badge>
        </div>
        {(action.updates && action.updates.length > 0) && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className='h-6 w-6'>
                    <ChevronRight className={cn("h-4 w-4 transition-transform", open && "rotate-90")} />
                </Button>
            </CollapsibleTrigger>
        )}
    </div>
      <CollapsibleContent className='py-2 pr-4 pl-6 bg-muted/20 rounded-b-md'>
        <p className='text-xs font-semibold mb-1 flex items-center gap-1'><History className="h-3 w-3"/> Weekly Progress Logs:</p>
        <div className='border rounded-md max-h-40 overflow-y-auto bg-background'>
            <Table>
                <TableHeader>
                    <TableRow className="h-7">
                        <TableHead className='h-7 text-[10px] py-0 px-2'>Date</TableHead>
                        <TableHead className='h-7 text-[10px] py-0 px-2'>Status</TableHead>
                        <TableHead className='h-7 text-[10px] py-0 px-2'>Done</TableHead>
                        <TableHead className='h-7 text-[10px] py-0 px-2'>Comment</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {action.updates?.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(update => (
                        <TableRow key={update.id} className="h-7 hover:bg-transparent">
                            <TableCell className='text-[10px] py-1 px-2'>{format(new Date(update.date), 'MMM d')}</TableCell>
                            <TableCell className='py-1 px-2'>
                                <Badge variant="outline" className={cn('text-[9px] px-1 h-4 leading-none', weeklyUpdateStatusStyles[update.status])}>{update.status}</Badge>
                            </TableCell>
                            <TableCell className='text-[10px] py-1 px-2 font-bold'>{update.value}</TableCell>
                              <TableCell className='text-[10px] py-1 px-2 text-muted-foreground line-clamp-1'>{update.comment}</TableCell>
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
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const { handleDeleteMultipleKras } = useDataStore();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(kras.map(k => k.id));
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
    handleDeleteMultipleKras(selectedIds);
    setSelectedIds([]);
  };

  return (
     <TooltipProvider>
    <div className='space-y-4'>
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
                  This will permanently delete {selectedIds.length} KRAs. This action cannot be undone.
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
      <div className='border rounded-lg overflow-hidden'>
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox 
                checked={selectedIds.length === kras.length && kras.length > 0}
                onCheckedChange={(checked) => handleSelectAll(!!checked)}
              />
            </TableHead>
            <TableHead>Employee</TableHead>
            <TableHead className='w-[450px]'>KRA-KPI Task Details</TableHead>
            <TableHead className="text-center">Weightage</TableHead>
            <TableHead className="text-center">Performance</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {kras.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">No KRAs found.</TableCell>
            </TableRow>
          )}
          {kras.map((kra) => {
            const baseMarks = kra.marksAchieved ?? 0;
            const bonus = kra.bonus ?? 0;
            const penalty = kra.penalty ?? 0;
            const finalMarks = baseMarks + bonus - penalty;
            const hasBonusOrPenalty = bonus > 0 || penalty > 0;

            const totalTarget = kra.actions && kra.actions.length > 0 
                ? kra.actions.reduce((sum, a) => sum + (a.target || 0), 0)
                : (kra.target || 0);
            
            const totalAchieved = kra.actions && kra.actions.length > 0 
                ? kra.actions.reduce((sum, a) => sum + (a.achieved || a.updates?.reduce((s, u) => s + (u.value || 0), 0) || 0), 0)
                : (kra.achieved || 0);
            
            const totalPending = Math.max(0, totalTarget - totalAchieved);

            return (
            <TableRow key={kra.id} className="align-top">
              <TableCell>
                <Checkbox 
                  checked={selectedIds.includes(kra.id)}
                  onCheckedChange={(checked) => handleSelectOne(kra.id, !!checked)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={kra.employee.avatarUrl} alt={kra.employee.name} data-ai-hint="people" />
                    <AvatarFallback>{kra.employee.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="font-medium text-xs sm:text-sm">{kra.employee.name}</div>
                </div>
              </TableCell>
              <TableCell className="max-w-sm">
                  <AddKraDialog kra={kra} onSave={onSave} employees={employees}>
                      <div className="cursor-pointer">
                          <p className="font-bold text-primary hover:underline">{kra.taskDescription || "General KRA Task"}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                             <Badge variant="outline" className="text-[10px] h-5 py-0">Goal: {totalTarget}</Badge>
                             <Badge variant="outline" className="text-[10px] h-5 py-0 text-green-600 bg-green-50 border-green-100">Done: {totalAchieved}</Badge>
                             <Badge variant="outline" className="text-[10px] h-5 py-0 text-orange-600 bg-orange-50 border-orange-100 font-bold">Pending: {totalPending}</Badge>
                             <span className="text-[10px] text-muted-foreground self-center">Due: {format(kra.endDate, 'MMM d, yyyy')}</span>
                          </div>
                      </div>
                  </AddKraDialog>
                  {(kra.actions && kra.actions.length > 0) && (
                      <div className='mt-3 space-y-1 pl-3 border-l-2 border-primary/20 ml-1'>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider py-1 border-b mb-1">
                              <span className="flex-1">KPI Sub-Goals</span>
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
              <TableCell className="text-center">
                   {kra.weightage !== null ? (
                      <span className="font-bold text-base text-muted-foreground">{kra.weightage}</span>
                  ) : (
                      <span className="text-muted-foreground">-</span>
                  )}
              </TableCell>
              <TableCell className="text-center">
                  <Tooltip>
                      <TooltipTrigger>
                          <span className={cn("font-black text-lg block", finalMarks >= (kra.weightage || 0) ? 'text-green-600' : 'text-primary', hasBonusOrPenalty && 'underline decoration-dotted')}>
                              {finalMarks.toFixed(2)}
                          </span>
                      </TooltipTrigger>
                       {hasBonusOrPenalty && (
                          <TooltipContent>
                              <div className="text-xs">
                                  <p>Base Marks: {baseMarks.toFixed(2)}</p>
                                  {bonus > 0 && <p className="text-green-600">Bonus: +{bonus}</p>}
                                  {penalty > 0 && <p className="text-destructive">Penalty: -{penalty}</p>}
                                  <p className="font-bold border-t mt-1 pt-1">Grand Total: {finalMarks.toFixed(2)}</p>
                              </div>
                          </TooltipContent>
                      )}
                  </Tooltip>
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
                      <AddKraDialog kra={kra} onSave={onSave} employees={employees}>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2">
                              <History className="h-4 w-4"/> Log Progress / Weekly Update
                          </DropdownMenuItem>
                      </AddKraDialog>
                      <DropdownMenuItem onClick={() => onDelete(kra.id)} className="text-destructive gap-2">
                          <Trash2 className="h-4 w-4"/> Delete KRA
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>
    </div>
    </TooltipProvider>
  );
}
