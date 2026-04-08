
'use client';

import * as React from 'react';
import { MoreHorizontal, CalendarCheck2, ChevronRight, MessageSquare, Edit, Trash2, History, Fingerprint, GripVertical } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
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
import type { Employee, KRA, KRAStatus, WeeklyUpdateStatus, ActionItem, WeeklyUpdate, WeeklyProgress } from '@/lib/types';
import { cn, ensureDate, sortKras } from '@/lib/utils';
import { format, addDays } from 'date-fns';
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
import { v4 as uuidv4 } from 'uuid';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const statusStyles: Record<KRAStatus, string> = {
  'On Track': 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800',
  'At Risk': 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-green-800',
  Completed: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-green-800',
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
                    <DialogTitle className="text-sm">Quick Progress Update</DialogTitle>
                    <DialogDescription className="text-xs">
                        Update achieved units for "{action.name}".
                        <span className="block mt-1 font-bold text-orange-600">Still Pending: {pending}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="py-2 space-y-2">
                    <Label htmlFor="achievedValue" className="text-[11px]">Total Work Done (Achieved)</Label>
                    <Input
                        id="achievedValue"
                        type="number"
                        value={value}
                        onChange={(e) => setValue(Number(e.target.value))}
                        className="h-8 text-xs"
                        placeholder="e.g., 150"
                    />
                    <p className='text-[10px] text-muted-foreground'>Goal Target: {action.target || 'N/A'}</p>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} size="sm" className='w-full text-xs h-8'>Update Goal Achieved</Button>
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
    
    const totalKpiTarget = newActions.reduce((sum, a) => sum + (a.target || 0), 0);
    const totalKpiAchieved = newActions.reduce((sum, a) => sum + (a.achieved || a.updates?.reduce((s, u) => s + (u.value || 0), 0) || 0), 0);
    
    let totalMarks = 0;
    if (kra.weightage && totalKpiTarget > 0) {
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
     const diff = newValue - achieved;
     if (diff === 0) return;

     const newUpdate: WeeklyUpdate = {
         id: uuidv4(),
         date: new Date(),
         status: 'On Track',
         comment: `Quick Update: Changed from ${achieved} to ${newValue} (${diff > 0 ? '+' : ''}${diff} units)`,
         value: diff
     };

     const currentUpdates = action.updates || [];
     updateKra({ ...action, achieved: newValue, updates: [...currentUpdates, newUpdate] });
  }

  const totalKpiTarget = kra.actions?.reduce((sum, a) => sum + (a.target || 0), 0) || 0;
  const kpiWeightage = (kra.weightage && totalKpiTarget > 0 && action.target) 
    ? (action.target / totalKpiTarget) * kra.weightage 
    : 0;
  let marks = (action.target && action.target > 0) ? (achieved / action.target) * kpiWeightage : 0;
  if (action.isCompleted && marks < kpiWeightage) marks = kpiWeightage;

  return (
    <Collapsible key={action.id} open={open} onOpenChange={setOpen}>
      <div className='flex items-center gap-2 text-[11px] py-1 group border-b border-dashed last:border-0 border-muted-foreground/20'>
        <Checkbox 
            id={`action-${kra.id}-${action.id}`}
            checked={action.isCompleted}
            onCheckedChange={handleCheckedChange}
            className="h-3.5 w-3.5"
        />
        <div className={cn("flex-1", action.isCompleted && 'line-through text-muted-foreground')}>
            <span className="font-medium">{action.name}</span>
             {action.target && (
                <div className='flex gap-1.5 mt-0.5'>
                    <span className='text-[9px] text-primary bg-primary/10 px-1 rounded'>Tgt: {target}</span>
                    <span className='text-[9px] text-green-600 bg-green-50 px-1 rounded'>Done: {achieved}</span>
                    <span className='text-[9px] text-orange-600 bg-orange-50 px-1 rounded font-bold'>Pending: {pending}</span>
                </div>
            )}
        </div>
        
        <QuickUpdateDialog action={{...action, achieved}} onUpdate={handleQuickUpdate}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:text-primary hover:bg-primary/10">
                        <History className="h-3 w-3" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent className="text-[10px]">Quick Progress Log</TooltipContent>
            </Tooltip>
        </QuickUpdateDialog>

        <div className="flex flex-col items-center">
            <span className="text-[8px] text-muted-foreground uppercase font-bold">Weight</span>
            <Badge variant="outline" className='font-mono h-4 px-1 text-[9px] min-w-[25px] justify-center'>{parseFloat(kpiWeightage.toFixed(2))}</Badge>
        </div>
        <div className="flex flex-col items-center ml-1">
            <span className="text-[8px] text-muted-foreground uppercase font-bold">Marks</span>
            <Badge variant="secondary" className='font-mono h-4 px-1 text-[9px] min-w-[25px] justify-center'>{parseFloat(marks.toFixed(2))}</Badge>
        </div>
        {(action.updates && action.updates.length > 0) && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className='h-5 w-5 ml-1'>
                    <ChevronRight className={cn("h-3 w-3 transition-transform", open && "rotate-90")} />
                </Button>
            </CollapsibleTrigger>
        )}
    </div>
      <CollapsibleContent className='py-1 pr-2 pl-4 bg-muted/20 rounded-b-md'>
        <p className='text-[9px] font-semibold mb-1 flex items-center gap-1'><History className="h-2.5 w-2.5"/> Weekly Progress Logs:</p>
        <div className='border rounded bg-background overflow-hidden'>
            <Table>
                <TableHeader>
                    <TableRow className="h-6">
                        <TableHead className='h-6 text-[8px] py-0 px-1.5'>Date</TableHead>
                        <TableHead className='h-6 text-[8px] py-0 px-1.5'>Status</TableHead>
                        <TableHead className='h-6 text-[8px] py-0 px-1.5'>+/-</TableHead>
                        <TableHead className='h-6 text-[8px] py-0 px-1.5'>Comment</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {action.updates?.sort((a,b) => {
                        const dateA = ensureDate(a.date).getTime();
                        const dateB = ensureDate(b.date).getTime();
                        return dateB - dateA;
                    }).map(update => {
                        const updateDate = ensureDate(update.date);
                        return (
                        <TableRow key={update.id} className="h-6 hover:bg-transparent">
                            <TableCell className='text-[8px] py-0.5 px-1.5 whitespace-nowrap'>
                                {format(updateDate, 'MMM d, HH:mm')}
                            </TableCell>
                            <TableCell className='py-0.5 px-1.5'>
                                <Badge variant="outline" className={cn('text-[7px] px-0.5 h-3 leading-none', weeklyUpdateStatusStyles[update.status])}>{update.status}</Badge>
                            </TableCell>
                            <TableCell className='text-[8px] py-0.5 px-1.5 font-bold'>{update.value}</TableCell>
                              <TableCell className='text-[8px] py-0.5 px-1.5 text-muted-foreground'>
                                  <span className="line-clamp-1" title={update.comment}>{update.comment}</span>
                              </TableCell>
                        </TableRow>
                    )})}
                </TableBody>
            </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

interface SortableKraRowProps {
    kra: KRA;
    selectedIds: string[];
    onSelectOne: (id: string, checked: boolean) => void;
    onSave: (kra: KRA) => void;
    onDelete: (id: string) => void;
    employees: Employee[];
    renderWeekCell: (weekData?: WeeklyProgress, kraStartDate?: Date, weekNum?: number) => React.ReactNode;
}

const SortableKraRow = ({ kra, selectedIds, onSelectOne, onSave, onDelete, employees, renderWeekCell }: SortableKraRowProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: kra.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 100 : 1,
    };

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
        <TableRow ref={setNodeRef} style={style} className="align-top hover:bg-slate-50/50">
            <TableCell className="px-3 pt-2">
                <div className="flex items-center gap-2">
                    <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
                        <GripVertical className="h-4 w-4" />
                    </div>
                    <Checkbox 
                        checked={selectedIds.includes(kra.id)}
                        onCheckedChange={(checked) => onSelectOne(kra.id, !!checked)}
                        className="h-3.5 w-3.5"
                    />
                </div>
            </TableCell>
            <TableCell className="pt-2">
                <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                        <AvatarImage src={kra.employee.avatarUrl} alt={kra.employee.name} data-ai-hint="people" />
                        <AvatarFallback className="text-[10px]">{kra.employee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-semibold text-[11px] leading-tight">{kra.employee.name}</div>
                        <div className='flex items-center gap-1 mt-0.5 text-[9px] text-muted-foreground font-mono'>
                            <Fingerprint className='h-2 w-2'/> {kra.employee.id.slice(0,6)}
                        </div>
                    </div>
                </div>
            </TableCell>
            <TableCell className="max-w-sm pt-2">
                <AddKraDialog kra={kra} onSave={onSave} employees={employees}>
                    <div className="cursor-pointer">
                        <p className="font-bold text-primary hover:underline text-[11px] leading-tight line-clamp-2">{kra.taskDescription || "General KRA Task"}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            <Badge variant="outline" className="text-[9px] h-4 py-0 px-1">Goal: {totalTarget}</Badge>
                            <Badge variant="outline" className="text-[9px] h-4 py-0 px-1 text-green-600 bg-green-50 border-green-100">Done: {totalAchieved}</Badge>
                            <Badge variant="outline" className="text-[9px] h-4 py-0 px-1 text-orange-600 bg-orange-50 border-orange-100 font-bold">Pend: {totalPending}</Badge>
                            <span className="text-[9px] text-muted-foreground self-center">Due: {kra.endDate ? format(ensureDate(kra.endDate), 'MMM d') : 'N/A'}</span>
                        </div>
                    </div>
                </AddKraDialog>
                {(kra.actions && kra.actions.length > 0) && (
                    <div className='mt-2 space-y-0.5 pl-2 border-l-2 border-primary/20 ml-1'>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-wider py-0.5 border-b mb-1">
                            <span className="flex-1">KPI Sub-Goals</span>
                            <span className='w-10 text-center'>Wght</span>
                            <span className='w-10 text-center'>Mrks</span>
                            <span className='w-5'></span>
                        </div>
                        {kra.actions.map((action) => (
                            <KpiRow key={action.id} kra={kra} action={action} onSave={onSave} />
                        ))}
                    </div>
                )}
            </TableCell>
            <TableCell className="text-center pt-2">
                <div className="flex flex-col items-center">
                    <span className="font-bold text-green-600 text-[11px]">{totalAchieved}</span>
                    <span className="text-[8px] text-muted-foreground border-t w-8 mt-0.5">Tgt: {totalTarget}</span>
                </div>
            </TableCell>
            <TableCell className="text-center pt-2">
                {kra.weightage !== null ? (
                    <span className="font-bold text-[13px] text-slate-600">{kra.weightage}</span>
                ) : (
                    <span className="text-muted-foreground text-[11px]">-</span>
                )}
            </TableCell>
            <TableCell className="text-center pt-2">
                <Tooltip>
                    <TooltipTrigger>
                        <span className={cn("font-black text-[14px] block leading-tight", finalMarks >= (kra.weightage || 0) ? 'text-green-600' : 'text-primary', hasBonusOrPenalty && 'underline decoration-dotted')}>
                            {finalMarks.toFixed(2)}
                        </span>
                    </TooltipTrigger>
                    {hasBonusOrPenalty && (
                        <TooltipContent className="text-[10px] p-2">
                            <div className="space-y-0.5">
                                <p>Base Marks: {baseMarks.toFixed(2)}</p>
                                {bonus > 0 && <p className="text-green-600 font-medium">Bonus: +{bonus}</p>}
                                {penalty > 0 && <p className="text-destructive font-medium">Penalty: -{penalty}</p>}
                                <p className="font-bold border-t mt-1 pt-1">Total: {finalMarks.toFixed(2)}</p>
                            </div>
                        </TooltipContent>
                    )}
                </Tooltip>
            </TableCell>
            <TableCell className="text-center pt-2">{renderWeekCell(kra.weeklyProgress?.week1, kra.startDate, 1)}</TableCell>
            <TableCell className="text-center pt-2">{renderWeekCell(kra.weeklyProgress?.week2, kra.startDate, 2)}</TableCell>
            <TableCell className="text-center pt-2">{renderWeekCell(kra.weeklyProgress?.week3, kra.startDate, 3)}</TableCell>
            <TableCell className="text-center pt-2">{renderWeekCell(kra.weeklyProgress?.week4, kra.startDate, 4)}</TableCell>
            <TableCell className="text-center pt-2">{renderWeekCell(kra.weeklyProgress?.week5, kra.startDate, 5)}</TableCell>
            <TableCell className="pt-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-[11px]">
                        <DropdownMenuLabel className="text-[10px]">Actions</DropdownMenuLabel>
                        <AddKraDialog kra={kra} onSave={onSave} employees={employees}>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2 text-[11px] cursor-pointer">
                                <History className="h-3 w-3"/> Weekly Update
                            </DropdownMenuItem>
                        </AddKraDialog>
                        <DropdownMenuItem onClick={() => onDelete(kra.id)} className="text-destructive gap-2 text-[11px] cursor-pointer">
                            <Trash2 className="h-3 w-3"/> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
};

export function KraTable({ kras, employees, onSave, onDelete }: KraTableProps) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const { handleDeleteMultipleKras, handleReorderKras } = useDataStore();
  
  // Internal state to hold the list during/after dragging to prevent snap-back
  const [displayKras, setDisplayKras] = React.useState<KRA[]>(kras);

  // Sync internal state when kras prop changes (e.g. from server)
  React.useEffect(() => {
    setDisplayKras(kras);
  }, [kras]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8,
        },
    }),
    useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
        const oldIndex = displayKras.findIndex((k) => k.id === active.id);
        const newIndex = displayKras.findIndex((k) => k.id === over?.id);
        
        const newKras = arrayMove(displayKras, oldIndex, newIndex);
        
        // Update local state immediately for visual responsiveness
        setDisplayKras(newKras);
        
        // Update Firestore asynchronously
        handleReorderKras(newKras);
    }
  };

  const totalWeightage = React.useMemo(() => 
    displayKras.reduce((sum, kra) => sum + (kra.weightage || 0), 0)
  , [displayKras]);

  const totalBonus = React.useMemo(() => 
    displayKras.reduce((sum, kra) => sum + (kra.bonus || 0), 0)
  , [displayKras]);

  const totalPenalty = React.useMemo(() => 
    displayKras.reduce((sum, kra) => sum + (kra.penalty || 0), 0)
  , [displayKras]);

  const totalPerformance = React.useMemo(() => 
    displayKras.reduce((sum, kra) => sum + ((kra.marksAchieved || 0) + (kra.bonus || 0) - (kra.penalty || 0)), 0)
  , [displayKras]);

  const totalOverallTarget = React.useMemo(() => 
    displayKras.reduce((sum, kra) => sum + (kra.target || 0), 0)
  , [displayKras]);

  const totalOverallAchieved = React.useMemo(() => 
    displayKras.reduce((sum, kra) => sum + (kra.achieved || 0), 0)
  , [displayKras]);

  const weeklyTotals = React.useMemo(() => {
    const totals = {
      week1: { target: 0, achieved: 0 },
      week2: { target: 0, achieved: 0 },
      week3: { target: 0, achieved: 0 },
      week4: { target: 0, achieved: 0 },
      week5: { target: 0, achieved: 0 },
    };

    displayKras.forEach(kra => {
      if (kra.weeklyProgress) {
        Object.keys(kra.weeklyProgress).forEach(week => {
          const w = week as keyof typeof totals;
          const weekData = kra.weeklyProgress![w];
          totals[w].target += weekData.target || 0;
          totals[w].achieved += weekData.achieved || 0;
        });
      }
    });

    return totals;
  }, [displayKras]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(displayKras.map(k => k.id));
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

  const renderWeekCell = (weekData?: WeeklyProgress, kraStartDate?: Date, weekNum?: number) => {
    if (!weekData || (weekData.target === null && weekData.achieved === null && !weekData.description)) return "-";
    
    let weekRangeStr = "";
    if (kraStartDate && weekNum) {
        const start = addDays(ensureDate(kraStartDate), (weekNum - 1) * 7);
        const end = addDays(start, 6);
        weekRangeStr = `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="flex flex-col items-center text-[9px] cursor-help">
                    <span className="font-bold text-primary">{weekData.achieved ?? 0}</span>
                    <span className="text-muted-foreground border-t border-muted-foreground/20 w-6 text-center">{weekData.target ?? 0}</span>
                </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px]">
                <div className="space-y-1">
                    <p className="font-bold border-b pb-0.5 text-[10px]">Week {weekNum}: {weekRangeStr}</p>
                    {weekData.description && <p className="text-[10px] leading-tight">{weekData.description}</p>}
                    {!weekData.description && <p className="text-[9px] italic text-muted-foreground">No description provided.</p>}
                </div>
            </TooltipContent>
        </Tooltip>
    );
  };

  return (
     <TooltipProvider>
    <div className='space-y-2'>
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-1.5 bg-muted rounded-md border border-primary/20">
          <span className="text-xs font-medium">{selectedIds.length} items selected</span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="h-7 text-[10px] gap-1.5">
                <Trash2 className="h-3.5 w-3.5" />
                Delete Selected
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-base">Are you sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  This will permanently delete {selectedIds.length} KRAs. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
              <AlertDialogCancel className="text-xs h-8">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90 text-xs h-8">
                Delete
              </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
      <div className='border rounded-lg overflow-hidden bg-white shadow-sm overflow-x-auto'>
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Table className="min-w-[1100px]">
            <TableHeader className="bg-muted/50 h-9">
            <TableRow className="h-9">
                <TableHead className="w-[60px] px-3">
                <div className="flex items-center gap-2">
                    <span className="w-4"></span>
                    <Checkbox 
                        checked={selectedIds.length === displayKras.length && displayKras.length > 0}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        className="h-3.5 w-3.5"
                    />
                </div>
                </TableHead>
                <TableHead className="text-[10px] uppercase font-bold py-0 h-9">Employee</TableHead>
                <TableHead className='w-[300px] text-[10px] uppercase font-bold py-0 h-9'>Task Details</TableHead>
                <TableHead className="text-center w-20 text-[10px] uppercase font-bold py-0 h-9">Total Achieved</TableHead>
                <TableHead className="text-center w-20 text-[10px] uppercase font-bold py-0 h-9">Weightage</TableHead>
                <TableHead className="text-center w-20 text-[10px] uppercase font-bold py-0 h-9">Performance</TableHead>
                <TableHead className="text-center w-14 text-[10px] uppercase font-bold py-0 h-9">
                    <Tooltip>
                        <TooltipTrigger>W1</TooltipTrigger>
                        <TooltipContent className='text-[9px]'>Week 1 Progress</TooltipContent>
                    </Tooltip>
                </TableHead>
                <TableHead className="text-center w-14 text-[10px] uppercase font-bold py-0 h-9">
                    <Tooltip>
                        <TooltipTrigger>W2</TooltipTrigger>
                        <TooltipContent className='text-[9px]'>Week 2 Progress</TooltipContent>
                    </Tooltip>
                </TableHead>
                <TableHead className="text-center w-14 text-[10px] uppercase font-bold py-0 h-9">
                    <Tooltip>
                        <TooltipTrigger>W3</TooltipTrigger>
                        <TooltipContent className='text-[9px]'>Week 3 Progress</TooltipContent>
                    </Tooltip>
                </TableHead>
                <TableHead className="text-center w-14 text-[10px] uppercase font-bold py-0 h-9">
                    <Tooltip>
                        <TooltipTrigger>W4</TooltipTrigger>
                        <TooltipContent className='text-[9px]'>Week 4 Progress</TooltipContent>
                    </Tooltip>
                </TableHead>
                <TableHead className="text-center w-14 text-[10px] uppercase font-bold py-0 h-9">
                    <Tooltip>
                        <TooltipTrigger>W5</TooltipTrigger>
                        <TooltipContent className='text-[9px]'>Week 5 Progress</TooltipContent>
                    </Tooltip>
                </TableHead>
                <TableHead className="w-10 h-9">
                <span className="sr-only">Actions</span>
                </TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {displayKras.length === 0 && (
                <TableRow>
                <TableCell colSpan={12} className="h-20 text-center text-xs text-muted-foreground">No KRAs found.</TableCell>
                </TableRow>
            )}
            <SortableContext 
                items={displayKras.map(k => k.id)}
                strategy={verticalListSortingStrategy}
            >
                {displayKras.map((kra) => (
                    <SortableKraRow 
                        key={kra.id}
                        kra={kra}
                        selectedIds={selectedIds}
                        onSelectOne={handleSelectOne}
                        onSave={onSave}
                        onDelete={onDelete}
                        employees={employees}
                        renderWeekCell={renderWeekCell}
                    />
                ))}
            </SortableContext>
            </TableBody>
            {displayKras.length > 0 && (
            <TableFooter className="bg-slate-50/80 font-bold border-t-2 h-12">
                <TableRow className="h-12">
                <TableCell colSpan={3} className="text-right py-2 pr-4 text-slate-500 uppercase text-[9px] tracking-widest h-12">
                    Monthly Aggregated Totals
                </TableCell>
                <TableCell className="text-center h-12 py-1">
                    <div className="flex flex-col items-center">
                        <span className="text-[13px] font-black text-green-600 leading-tight">
                            {totalOverallAchieved}
                        </span>
                        <span className="text-[8px] text-muted-foreground border-t w-10 text-center mt-0.5">Tgt: {totalOverallTarget}</span>
                    </div>
                </TableCell>
                <TableCell className="text-center text-[13px] font-black text-slate-700 h-12 py-1">
                    {totalWeightage}
                </TableCell>
                <TableCell className="text-center h-12 py-1">
                    <div className="flex flex-col items-center">
                        <span className="text-[14px] font-black text-primary leading-tight">
                            {totalPerformance.toFixed(2)}
                        </span>
                        <div className="flex gap-1.5 text-[8px] font-bold uppercase mt-0.5">
                            <span className="text-green-600">B:+{totalBonus}</span>
                            <span className="text-rose-600">P:-{totalPenalty}</span>
                        </div>
                    </div>
                </TableCell>
                <TableCell className="text-center h-12 py-1">
                    <div className="flex flex-col items-center text-[9px]">
                        <span className="font-bold text-primary">{weeklyTotals.week1.achieved}</span>
                        <span className="text-muted-foreground border-t border-muted-foreground/20 w-6 text-center">{weeklyTotals.week1.target}</span>
                    </div>
                </TableCell>
                <TableCell className="text-center h-12 py-1">
                    <div className="flex flex-col items-center text-[9px]">
                        <span className="font-bold text-primary">{weeklyTotals.week2.achieved}</span>
                        <span className="text-muted-foreground border-t border-muted-foreground/20 w-6 text-center">{weeklyTotals.week2.target}</span>
                    </div>
                </TableCell>
                <TableCell className="text-center h-12 py-1">
                    <div className="flex flex-col items-center text-[9px]">
                        <span className="font-bold text-primary">{weeklyTotals.week3.achieved}</span>
                        <span className="text-muted-foreground border-t border-muted-foreground/20 w-6 text-center">{weeklyTotals.week3.target}</span>
                    </div>
                </TableCell>
                <TableCell className="text-center h-12 py-1">
                    <div className="flex flex-col items-center text-[9px]">
                        <span className="font-bold text-primary">{weeklyTotals.week4.achieved}</span>
                        <span className="text-muted-foreground border-t border-muted-foreground/20 w-6 text-center">{weeklyTotals.week4.target}</span>
                    </div>
                </TableCell>
                <TableCell className="text-center h-12 py-1">
                    <div className="flex flex-col items-center text-[9px]">
                        <span className="font-bold text-primary">{weeklyTotals.week5.achieved}</span>
                        <span className="text-muted-foreground border-t border-muted-foreground/20 w-6 text-center">{weeklyTotals.week5.target}</span>
                    </div>
                </TableCell>
                <TableCell className="h-12" />
                </TableRow>
            </TableFooter>
            )}
        </Table>
      </DndContext>
      </div>
    </div>
    </TooltipProvider>
  );
}
