
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Loader2, PlusCircle, Trash2, Check, ChevronsUpDown, MessageSquare, History, CalendarDays, Activity, Calendar as CalendarIcon } from 'lucide-react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { refineKraTaskDescription } from '@/ai/flows/kra-refinement';
import { useToast } from '@/hooks/use-toast';
import type { KRA, ActionItem, Employee, WeeklyUpdate, ActivityLog } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { format, addDays, startOfWeek, addWeeks } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn, ensureDate } from '@/lib/utils';
import { useAuth } from './auth-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

const weeklyUpdateSchema = z.object({
    id: z.string(),
    date: z.any().optional(),
    status: z.enum(['On Track', 'Delayed', 'Completed', 'At Risk', 'Issue']),
    comment: z.string().min(1, "Comment is required."),
    value: z.coerce.number().optional(),
});

const weeklyProgressItemSchema = z.object({
    target: z.number().nullable(),
    achieved: z.number().nullable(),
    description: z.string().optional(),
});

const actionItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Action description cannot be empty."),
  dueDate: z.any(),
  isCompleted: z.boolean(),
  weightage: z.coerce.number().min(0).optional(),
  updates: z.array(weeklyUpdateSchema).optional(),
  target: z.coerce.number().optional(),
  achieved: z.coerce.number().optional(),
});

const kraSchema = z.object({
  taskDescription: z.string().optional(),
  employeeId: z.string().min(1, 'Employee is required.'),
  weightage: z.number().positive('Weightage must be a positive number.').nullable(),
  marksAchieved: z.number().min(0).nullable(),
  bonus: z.number().min(0).nullable(),
  penalty: z.number().min(0).nullable(),
  actions: z.array(actionItemSchema).optional(),
  handover: z.string().optional(),
  extraWork: z.string().optional(),
  target: z.number().min(0).nullable(),
  achieved: z.number().min(0).nullable(),
  startDate: z.date(),
  endDate: z.date(),
  weeklyProgress: z.object({
    week1: weeklyProgressItemSchema,
    week2: weeklyProgressItemSchema,
    week3: weeklyProgressItemSchema,
    week4: weeklyProgressItemSchema,
    week5: weeklyProgressItemSchema,
  }).optional(),
  adminComment: z.string().optional(),
});

type KraFormValues = z.infer<typeof kraSchema>;
type WeeklyUpdateFormValues = z.infer<typeof weeklyUpdateSchema>;

interface AddKraDialogProps {
  children: React.ReactNode;
  kra?: KRA;
  onSave?: (kra: KRA) => void;
  employees: Employee[];
}

const UpdateDialog = ({ target, currentAchieved, onSave, children }: {target: number, currentAchieved: number, onSave: (update: WeeklyUpdate) => void, children: React.ReactNode}) => {
    const [open, setOpen] = React.useState(false);
    const { toast } = useToast();
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<WeeklyUpdateFormValues>({
        resolver: zodResolver(weeklyUpdateSchema),
        defaultValues: {
            status: 'On Track',
            comment: '',
            value: 0,
        }
    });

    const pending = Math.max(0, target - currentAchieved);

    const onSubmit = (data: WeeklyUpdateFormValues) => {
        onSave({ ...data, id: uuidv4(), date: new Date() });
        toast({title: "Weekly Log Saved", description: "Your progress for this week has been recorded."});
        setOpen(false);
        reset();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                 <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>Weekly Progress Log</DialogTitle>
                        <DialogDescription>
                            Record work completed this week. 
                            <span className="block mt-1 font-semibold text-primary">Pending Goal: {pending} units</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">Status</Label>
                             <div className="col-span-3">
                                <Controller
                                    name="status"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select current status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="On Track">On Track</SelectItem>
                                                <SelectItem value="Delayed">Delayed</SelectItem>
                                                <SelectItem value="At Risk">At Risk</SelectItem>
                                                <SelectItem value="Issue">Issue</SelectItem>
                                                <SelectItem value="Completed">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="value" className="text-right pt-2">Work Done</Label>
                             <div className="col-span-3">
                                <Controller
                                    name="value"
                                    control={control}
                                    render={({ field }) => <Input type="number" id="value" {...field} placeholder="e.g. 10"
                                        value={field.value ?? ''}
                                        onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                    />}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="comment" className="text-right pt-2">Notes</Label>
                            <div className="col-span-3">
                                <Controller
                                    name="comment"
                                    control={control}
                                    render={({ field }) => <Textarea id="comment" {...field} placeholder="What was achieved?"/>}
                                />
                                {errors.comment && <p className="text-xs text-destructive mt-1">{errors.comment.message}</p>}
                            </div>
                        </div>
                    </div>
                     <DialogFooter>
                        <Button type="submit" className='w-full'>Save Weekly Log</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export function AddKraDialog({ children, kra, onSave, employees }: AddKraDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isRefining, setIsRefining] = React.useState(false);
  const [employeeComboboxOpen, setEmployeeComboboxOpen] = React.useState(false)
  
  const { getPermission, currentUser: loggedInUser } = useAuth();
  const kraPermission = getPermission('kras');
  const canManageKra = kraPermission === 'edit' || kraPermission === 'download';
  const isAdmin = kraPermission === 'download';
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<KraFormValues>({
    resolver: zodResolver(kraSchema),
    defaultValues: {
      taskDescription: kra?.taskDescription || '',
      employeeId: kra?.employee.id || '',
      weightage: kra?.weightage || null,
      marksAchieved: kra?.marksAchieved || null,
      bonus: kra?.bonus || null,
      penalty: kra?.penalty || null,
      actions: [],
      handover: kra?.handover || '',
      extraWork: kra?.extraWork || '',
      target: kra?.target || null,
      achieved: kra?.achieved || null,
      startDate: ensureDate(kra?.startDate || new Date()),
      endDate: ensureDate(kra?.endDate || addWeeks(new Date(), 4)),
      weeklyProgress: {
        week1: { target: null, achieved: null, description: '' },
        week2: { target: null, achieved: null, description: '' },
        week3: { target: null, achieved: null, description: '' },
        week4: { target: null, achieved: null, description: '' },
        week5: { target: null, achieved: null, description: '' },
      },
      adminComment: '',
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "actions",
  });

  const watchedWeeklyProgress = watch('weeklyProgress');
  const watchedActions = watch('actions');
  const watchedWeightage = watch('weightage');
  const watchedTarget = watch('target');
  const watchedAchieved = watch('achieved');
  const watchedStartDate = watch('startDate');

  // Calculate week dates based on start date
  const getWeekRange = (weekNum: number) => {
    const start = addDays(watchedStartDate, (weekNum - 1) * 7);
    const end = addDays(start, 6);
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
  };

  React.useEffect(() => {
    let totalWeeklyTarget = 0;
    let totalWeeklyAchieved = 0;
    
    if (watchedWeeklyProgress) {
        Object.values(watchedWeeklyProgress).forEach(w => {
            totalWeeklyTarget += (w?.target || 0);
            totalWeeklyAchieved += (w?.achieved || 0);
        });
    }

    if (totalWeeklyTarget > 0 && watchedTarget !== totalWeeklyTarget) {
        setValue('target', totalWeeklyTarget);
    }
    if (totalWeeklyAchieved > 0 && watchedAchieved !== totalWeeklyAchieved) {
        setValue('achieved', totalWeeklyAchieved);
    }

    const currentTarget = totalWeeklyTarget > 0 ? totalWeeklyTarget : (watchedTarget || 0);
    const currentAchieved = totalWeeklyAchieved > 0 ? totalWeeklyAchieved : (watchedAchieved || 0);

    let totalMarksCalculated = 0;
    
    if (watchedActions && watchedActions.length > 0) {
        const totalKpiTarget = watchedActions.reduce((sum, action) => sum + (action.target || 0), 0);
        
        watchedActions.forEach((action) => {
            const kpiAchieved = action.achieved || action.updates?.reduce((sum, u) => sum + (u.value || 0), 0) || 0;
            const kpiWeightage = (watchedWeightage && totalKpiTarget > 0 && action.target) 
                ? (action.target / totalKpiTarget) * watchedWeightage 
                : 0;

            let kpiMarks = 0;
            if (action.target && action.target > 0) {
                kpiMarks = (kpiAchieved / action.target) * kpiWeightage;
            } else if (action.isCompleted) {
                kpiMarks = kpiWeightage;
            }
            totalMarksCalculated += kpiMarks;
        });
    } else if (currentTarget > 0 && watchedWeightage) {
         totalMarksCalculated = (currentAchieved / currentTarget) * watchedWeightage;
    }

    const finalMarks = Math.min(watchedWeightage || 0, parseFloat(totalMarksCalculated.toFixed(2)));
    if (watch('marksAchieved') !== finalMarks) {
        setValue('marksAchieved', finalMarks, { shouldValidate: true });
    }
  }, [watchedWeeklyProgress, watchedActions, watchedWeightage, watchedTarget, watchedAchieved, setValue, watch]);

  React.useEffect(() => {
    if (open) {
      reset({
        taskDescription: kra?.taskDescription || '',
        employeeId: kra?.employee.id || '',
        weightage: kra?.weightage || null,
        marksAchieved: kra?.marksAchieved || null,
        bonus: kra?.bonus || null,
        penalty: kra?.penalty || null,
        startDate: ensureDate(kra?.startDate || new Date()),
        endDate: ensureDate(kra?.endDate || addWeeks(new Date(), 4)),
        actions: kra?.actions?.map(a => ({
            ...a,
            dueDate: ensureDate(a.dueDate),
            updates: a.updates?.map(u => ({...u, date: ensureDate(u.date)})) || []
        })) || [],
        handover: kra?.handover || '',
        extraWork: kra?.extraWork || '',
        target: kra?.target || null,
        achieved: kra?.achieved || null,
        weeklyProgress: kra?.weeklyProgress || {
            week1: { target: null, achieved: null, description: '' },
            week2: { target: null, achieved: null, description: '' },
            week3: { target: null, achieved: null, description: '' },
            week4: { target: null, achieved: null, description: '' },
            week5: { target: null, achieved: null, description: '' },
        },
        adminComment: '',
      });
    }
  }, [open, kra, reset]);

  const taskDescription = watch('taskDescription');

  const handleRefine = async () => {
    if (!taskDescription) return;
    setIsRefining(true);
    try {
      const result = await refineKraTaskDescription({ taskDescription });
      setValue('taskDescription', result.refinedTaskDescription);
      toast({ title: 'Success', description: 'Task description refined.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to refine.', variant: 'destructive' });
    } finally {
      setIsRefining(false);
    }
  };
  
  const onSubmit = (data: KraFormValues) => {
    const selectedEmployee =
      employees.find(e => e.id === data.employeeId) ||
      (kra?.employee && kra.employee.id === data.employeeId ? kra.employee : undefined) ||
      (kra?.employee?.email ? employees.find(e => e.email?.toLowerCase() === kra.employee.email?.toLowerCase()) : undefined) ||
      (loggedInUser?.email ? employees.find(e => e.email?.toLowerCase() === loggedInUser.email?.toLowerCase()) : undefined) ||
      kra?.employee;

    if (!selectedEmployee) {
      toast({
        title: 'Unable to save weekly update',
        description: 'Employee profile could not be matched for this KRA. Please refresh once and try again.',
        variant: 'destructive',
      });
      return;
    }
    
    let totalWeeklyAchieved = 0;
    if (data.weeklyProgress) {
        Object.values(data.weeklyProgress).forEach(w => {
            totalWeeklyAchieved += (w.achieved || 0);
        });
    }

    let totalKpiAchieved = 0;
    const updatedActions: ActionItem[] | undefined = data.actions?.map((action) => {
        const achieved = action.achieved || action.updates?.reduce((sum, u) => sum + (u.value || 0), 0) || 0;
        totalKpiAchieved += achieved;
        return {
          ...action,
          dueDate: action.dueDate,
          achieved,
          updates: action.updates?.map((update) => ({
            ...update,
            date: update.date ?? new Date(),
          })),
        };
    });

    const hasActions = updatedActions && updatedActions.length > 0;
    const finalAchieved = totalWeeklyAchieved > 0 ? totalWeeklyAchieved : (hasActions ? totalKpiAchieved : (data.achieved || 0));
    
    let totalTarget = data.target || 0;
    if (totalWeeklyAchieved > 0) {
        // Handled by effect
    } else if (hasActions) {
        totalTarget = updatedActions.reduce((sum, action) => sum + (action.target || 0), 0);
    }

    const progress = totalTarget > 0 ? Math.round((finalAchieved / totalTarget) * 100) : 0;

    const newActivities: ActivityLog[] = [...(kra?.activities || [])];
    const timestamp = new Date();
    const actorName = loggedInUser?.name || 'System';

    if (isAdmin && data.adminComment) {
        newActivities.push({
            id: uuidv4(),
            timestamp,
            actorName,
            action: 'Admin Comment',
            details: data.adminComment
        });
    }

    if (kra) {
        if (kra.weightage !== data.weightage) {
            newActivities.push({ id: uuidv4(), timestamp, actorName, action: 'Updated Weightage', details: `Changed from ${kra.weightage} to ${data.weightage}` });
        }
        if (kra.target !== totalTarget) {
            newActivities.push({ id: uuidv4(), timestamp, actorName, action: 'Updated Goal Target', details: `Changed from ${kra.target} to ${totalTarget}` });
        }
        if (kra.bonus !== data.bonus) {
            newActivities.push({ id: uuidv4(), timestamp, actorName, action: 'Updated Bonus Marks', details: `Changed from ${kra.bonus || 0} to ${data.bonus || 0}` });
        }
        if (kra.penalty !== data.penalty) {
            newActivities.push({ id: uuidv4(), timestamp, actorName, action: 'Updated Penalty Marks', details: `Changed from ${kra.penalty || 0} to ${data.penalty || 0}` });
        }
    } else {
        newActivities.push({ id: uuidv4(), timestamp, actorName, action: 'KRA Created', details: `New KRA assigned to ${selectedEmployee.name}` });
    }

    const newKra: KRA = {
      id: kra?.id || uuidv4(),
      taskDescription: data.taskDescription,
      employee: selectedEmployee,
      progress: Math.min(100, progress),
      status: progress >= 100 ? 'Completed' : (progress > 0 ? 'On Track' : 'Pending'),
      weightage: data.weightage || null,
      marksAchieved: data.marksAchieved,
      bonus: data.bonus,
      penalty: data.penalty,
      startDate: data.startDate,
      endDate: data.endDate,
      actions: updatedActions,
      handover: data.handover,
      extraWork: data.extraWork,
      target: totalTarget,
      achieved: finalAchieved,
      weeklyProgress: data.weeklyProgress,
      activities: newActivities,
    };
    onSave?.(newKra);
    toast({ title: 'Changes saved', description: 'KRA progress and weekly updates were updated successfully.' });
    setOpen(false);
  };

  const onInvalid = () => {
    toast({
      title: 'Please check required fields',
      description: 'Some KRA fields are invalid, so the weekly update could not be saved yet.',
      variant: 'destructive',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-5xl max-h-[95vh] flex flex-col p-0">
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="flex flex-col h-full overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>{kra ? 'Update KRA & Progress' : 'Add New KRA'}</DialogTitle>
            <DialogDescription>
              Set period, weekly targets, record achievements, and manage KPI goals.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">
            <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-semibold">Employee</Label>
                <div className="col-span-3">
                    <Controller
                        name="employeeId"
                        control={control}
                        render={({ field }) => (
                        <Popover open={employeeComboboxOpen} onOpenChange={setEmployeeComboboxOpen}>
                            <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between" disabled={!isAdmin}>
                                {field.value ? employees.find((e) => e.id === field.value)?.name : "Select employee..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search employee..." />
                                <CommandList>
                                    <CommandEmpty>No employees found.</CommandEmpty>
                                    <CommandGroup>
                                    {employees.map((e) => (
                                        <CommandItem key={e.id} value={e.name} onSelect={() => { field.onChange(e.id); setEmployeeComboboxOpen(false); }}>
                                        <Check className={cn("mr-2 h-4 w-4", e.id === field.value ? "opacity-100" : "opacity-0")} />
                                        {e.name}
                                        </CommandItem>
                                    ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                            </PopoverContent>
                        </Popover>
                        )}
                    />
                </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-semibold">Period</Label>
                    <div className="col-span-3 flex items-center gap-4">
                        <div className='flex-1 space-y-1'>
                            <Label className='text-[10px] text-muted-foreground uppercase font-bold'>Start Date</Label>
                            <Controller
                                name="startDate"
                                control={control}
                                render={({ field }) => (
                                    <Input 
                                        type="date" 
                                        value={format(field.value, 'yyyy-MM-dd')} 
                                        onChange={e => field.onChange(new Date(e.target.value))}
                                        disabled={!canManageKra}
                                    />
                                )}
                            />
                        </div>
                        <div className='flex-1 space-y-1'>
                            <Label className='text-[10px] text-muted-foreground uppercase font-bold'>End Date</Label>
                            <Controller
                                name="endDate"
                                control={control}
                                render={({ field }) => (
                                    <Input 
                                        type="date" 
                                        value={format(field.value, 'yyyy-MM-dd')} 
                                        onChange={e => field.onChange(new Date(e.target.value))}
                                        disabled={!canManageKra}
                                    />
                                )}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2 font-semibold">Task</Label>
                <div className="col-span-3">
                    <Controller
                        name="taskDescription"
                        control={control}
                        render={({ field }) => <Textarea {...field} rows={3} disabled={!canManageKra} className="bg-slate-50" />}
                    />
                    {canManageKra && (
                        <Button type="button" variant="outline" size="sm" className="mt-2 gap-2" onClick={handleRefine} disabled={isRefining}>
                            {isRefining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-yellow-500" />}
                            Refine with AI
                        </Button>
                    )}
                </div>
                </div>
                
                <Separator />

                <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2 font-semibold">Weekly Targets & Achievement</Label>
                    <div className="col-span-3">
                        <div className="grid grid-cols-5 gap-4">
                            {[1, 2, 3, 4, 5].map((weekNum) => (
                                <div key={weekNum} className="space-y-3 p-3 border rounded-lg bg-slate-50/50">
                                    <div className='flex items-center justify-between mb-1'>
                                        <div className='flex items-center gap-1.5'>
                                            <CalendarDays className='h-3.5 w-3.5 text-primary' />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Week {weekNum}</span>
                                        </div>
                                    </div>
                                    <p className='text-[9px] font-medium text-muted-foreground text-center bg-white rounded py-0.5 border border-slate-100 shadow-sm'>
                                        {getWeekRange(weekNum)}
                                    </p>
                                    <div className='space-y-1.5'>
                                        <Label className="text-[9px] font-bold text-slate-400">Weekly KRA</Label>
                                        <Controller
                                            name={`weeklyProgress.week${weekNum}.description` as any}
                                            control={control}
                                            render={({ field }) => (
                                                <Textarea 
                                                    {...field} 
                                                    className="h-16 text-[10px] bg-white resize-none" 
                                                    placeholder="Task description..."
                                                />
                                            )}
                                        />
                                    </div>
                                    <div className='space-y-1.5'>
                                        <Label className="text-[9px] font-bold text-slate-400">Target</Label>
                                        <Controller
                                            name={`weeklyProgress.week${weekNum}.target` as any}
                                            control={control}
                                            render={({ field }) => (
                                                <Input 
                                                    type="number" 
                                                    {...field} 
                                                    className="h-8 text-xs bg-white" 
                                                    value={field.value ?? ''} 
                                                    onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                                />
                                            )}
                                        />
                                    </div>
                                    <div className='space-y-1.5'>
                                        <Label className="text-[9px] font-bold text-primary/70">Done</Label>
                                        <Controller
                                            name={`weeklyProgress.week${weekNum}.achieved` as any}
                                            control={control}
                                            render={({ field }) => (
                                                <Input 
                                                    type="number" 
                                                    {...field} 
                                                    className="h-8 text-xs bg-white border-primary/20 focus:border-primary" 
                                                    value={field.value ?? ''} 
                                                    onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                                />
                                            )}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2 font-semibold">Goals Summary</Label>
                    <div className="col-span-3 grid grid-cols-4 gap-3">
                        <div className='space-y-1'>
                            <Label className="text-[10px] font-bold uppercase text-slate-500">Weightage</Label>
                            <Controller
                                name="weightage"
                                control={control}
                                render={({ field }) => <Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} disabled={!canManageKra} />}
                            />
                        </div>
                        <div className='space-y-1'>
                            <Label className="text-[10px] font-bold uppercase text-slate-500">Total Target</Label>
                            <Controller
                                name="target"
                                control={control}
                                render={({ field }) => <Input type="number" {...field} value={field.value ?? ''} readOnly className="bg-slate-100 font-bold" />}
                            />
                        </div>
                        <div className='space-y-1'>
                            <Label className="text-[10px] font-bold uppercase text-primary">Total Achieved</Label>
                            <Controller
                                name="achieved"
                                control={control}
                                render={({ field }) => <Input type="number" {...field} value={field.value ?? ''} readOnly className="bg-primary/5 border-primary/20 font-bold" />}
                            />
                        </div>
                        <div className='space-y-1'>
                            <Label className="text-[10px] font-bold uppercase text-orange-600">Pending</Label>
                            <div className="h-10 flex items-center px-3 border rounded-md bg-orange-50 text-orange-700 font-bold">
                                {Math.max(0, (watch('target') || 0) - (watch('achieved') || 0))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2 font-bold text-primary">KPI Actions</Label>
                    <div className="col-span-3 space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="p-4 border rounded-lg bg-white shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        <Controller
                                            name={`actions.${index}.isCompleted`}
                                            control={control}
                                            render={({ field: f }) => <Checkbox checked={f.value} onCheckedChange={f.onChange} />}
                                        />
                                        <Controller
                                            name={`actions.${index}.name`}
                                            control={control}
                                            render={({ field: f }) => <Input placeholder="KPI Action" {...f} disabled={!canManageKra} className="flex-1 font-semibold" />}
                                        />
                                    </div>
                                    <div className='flex items-center gap-2 ml-4'>
                                        <div className='flex flex-col items-end'>
                                            <Label className='text-[8px] uppercase font-bold text-slate-400'>Due Date</Label>
                                            <Controller
                                                name={`actions.${index}.dueDate`}
                                                control={control}
                                                render={({ field: f }) => (
                                                    <Input 
                                                        type="date" 
                                                        className='h-7 text-[10px] py-0 w-28' 
                                                        value={f.value ? format(new Date(f.value), 'yyyy-MM-dd') : ''}
                                                        onChange={e => f.onChange(new Date(e.target.value))}
                                                        disabled={!canManageKra}
                                                    />
                                                )}
                                            />
                                        </div>
                                        {canManageKra && (
                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className='text-rose-500 h-8 w-8'>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className='flex items-end gap-3 pl-7'>
                                    <div className='flex-1'>
                                        <Label className='text-[10px] uppercase font-bold text-slate-500'>Target</Label>
                                        <Controller
                                            name={`actions.${index}.target`}
                                            control={control}
                                            render={({ field: f }) => <Input type="number" {...f} value={f.value ?? ''} onChange={e => f.onChange(e.target.value === '' ? undefined : Number(e.target.value))} disabled={!canManageKra} />}
                                        />
                                    </div>
                                    <div className='w-20'>
                                        <Label className='text-[10px] uppercase font-bold text-slate-500'>Done</Label>
                                        <div className="h-10 flex items-center px-2 border rounded-md bg-slate-50 text-sm font-bold">{field.achieved || 0}</div>
                                    </div>
                                    <UpdateDialog 
                                        target={field.target || 0} 
                                        currentAchieved={field.achieved || 0}
                                        onSave={(upd) => {
                                            const newUpd = [...(field.updates || []), upd];
                                            const newAch = (field.achieved || 0) + (upd.value || 0);
                                            update(index, {...field, updates: newUpd, achieved: newAch });
                                        }}
                                    >
                                        <Button type="button" size="sm" variant="outline" className='h-10'><History className='h-4 w-4 mr-2'/> Log</Button>
                                    </UpdateDialog>
                                </div>
                            </div>
                        ))}
                        {canManageKra && (
                            <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => append({ id: uuidv4(), name: '', dueDate: new Date(), isCompleted: false, weightage: 0, updates: [] })}>
                                <PlusCircle className="h-4 w-4 mr-2" /> Add KPI Action
                            </Button>
                        )}
                    </div>
                </div>
                
                <Separator />

                <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2 font-semibold">Marks & Adjustments</Label>
                    <div className="col-span-3 space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase text-slate-500">Base Marks</Label>
                                <Controller
                                    name="marksAchieved"
                                    control={control}
                                    render={({ field }) => <Input type="number" {...field} value={field.value ?? ''} readOnly className='bg-slate-100 font-bold' />}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase text-green-600">Bonus Marks</Label>
                            <Controller
                                name="bonus"
                                control={control}
                                render={({ field }) => (
                                        <Input 
                                            type="number" 
                                            {...field} 
                                            value={field.value ?? ''} 
                                            onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                            className="border-green-100 bg-green-50/20 font-bold text-green-700"
                                            disabled={!canManageKra}
                                        />
                                    )}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase text-rose-600">Penalty Marks</Label>
                            <Controller
                                name="penalty"
                                control={control}
                                render={({ field }) => (
                                        <Input 
                                            type="number" 
                                            {...field} 
                                            value={field.value ?? ''} 
                                            onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                            className="border-rose-100 bg-rose-50/20 font-bold text-rose-700"
                                            disabled={!canManageKra}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                        <div className="p-3 border rounded-lg bg-primary/5 flex items-center justify-between">
                            <span className="text-sm font-bold text-primary">Final Performance Score:</span>
                            <span className="text-2xl font-black text-primary">
                                {((watch('marksAchieved') || 0) + (watch('bonus') || 0) - (watch('penalty') || 0)).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2 font-bold text-blue-600">Extra Work Done</Label>
                    <div className="col-span-3">
                        <Controller
                            name="extraWork"
                            control={control}
                            render={({ field }) => <Textarea {...field} rows={2} placeholder="Any additional achievements or tasks..." className="border-blue-100 bg-blue-50/30" />}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2 font-semibold text-slate-500">Handover/Notes</Label>
                    <div className="col-span-3">
                        <Controller
                            name="handover"
                            control={control}
                            render={({ field }) => <Textarea {...field} rows={2} placeholder="Status handover or general remarks..." className="italic text-sm" />}
                        />
                    </div>
                </div>

                <Separator />

                {isAdmin && (
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2 font-bold text-rose-600">Admin Action/Comment</Label>
                        <div className="col-span-3">
                            <Controller
                                name="adminComment"
                                control={control}
                                render={({ field }) => <Textarea {...field} rows={2} placeholder="Add a comment or log an action for the employee..." className="border-rose-100 bg-rose-50/20" />}
                            />
                            <p className="text-[10px] text-muted-foreground mt-1 italic">This comment will be added to the KRA Activity Log below.</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-4 items-start gap-4 pt-4">
                    <Label className="text-right pt-2 font-bold flex items-center gap-2 justify-end">
                        <Activity className="h-4 w-4" /> Activity Log
                    </Label>
                    <div className="col-span-3">
                        <div className="border rounded-lg bg-slate-50 p-4">
                            <ScrollArea className="h-48">
                                {kra?.activities && kra.activities.length > 0 ? (
                                    <div className="space-y-4">
                                        {[...kra.activities].sort((a,b) => ensureDate(b.timestamp).getTime() - ensureDate(a.timestamp).getTime()).map((activity) => (
                                            <div key={activity.id} className="border-l-2 border-primary/30 pl-3 py-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] font-bold text-slate-900">{activity.actorName}</span>
                                                    <span className="text-[9px] text-slate-400">{format(ensureDate(activity.timestamp), 'MMM d, HH:mm')}</span>
                                                </div>
                                                <p className="text-[11px] font-semibold text-primary">{activity.action}</p>
                                                {activity.details && <p className="text-[10px] text-slate-600 mt-0.5">{activity.details}</p>}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                                        <Activity className="h-8 w-8 mb-2 opacity-20" />
                                        <p className="text-xs">No activity recorded yet.</p>
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          <DialogFooter className="p-6 border-t bg-slate-50 shrink-0">
            <Button type="submit" className='w-full h-12 font-bold text-lg'>Save All Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
