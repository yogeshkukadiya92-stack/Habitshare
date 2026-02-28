
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
import { Sparkles, Loader2, PlusCircle, Trash2, Check, ChevronsUpDown, MessageSquare, History } from 'lucide-react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { refineKraTaskDescription } from '@/ai/flows/kra-refinement';
import { useToast } from '@/hooks/use-toast';
import type { KRA, ActionItem, Employee, WeeklyUpdate } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useAuth } from './auth-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';

const weeklyUpdateSchema = z.object({
    id: z.string(),
    date: z.date(),
    status: z.enum(['On Track', 'Delayed', 'Completed', 'At Risk', 'Issue']),
    comment: z.string().min(1, "Comment is required."),
    value: z.coerce.number().optional(),
});

const actionItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Action description cannot be empty."),
  dueDate: z.date(),
  isCompleted: z.boolean(),
  weightage: z.coerce.number().min(0, "Marks must be a positive number.").optional(),
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
  target: z.number().min(0).nullable(),
  achieved: z.number().min(0).nullable(),
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
            date: new Date(),
            status: 'On Track',
            comment: '',
            value: 0,
        }
    });

    const pending = Math.max(0, target - currentAchieved);

    const onSubmit = (data: WeeklyUpdateFormValues) => {
        onSave({ id: uuidv4(), ...data });
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
                            Record how much work you completed this week. 
                            <span className="block mt-1 font-semibold text-orange-600">Pending Goal: {pending} units</span>
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
                                <p className='text-xs text-muted-foreground mt-1'>This will decrease your pending work automatically.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="comment" className="text-right pt-2">Notes</Label>
                            <div className="col-span-3">
                                <Controller
                                    name="comment"
                                    control={control}
                                    render={({ field }) => <Textarea id="comment" {...field} placeholder="What was achieved this week?"/>}
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
  
  const { getPermission } = useAuth();
  const isAdmin = getPermission('employees') === 'download';


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
      target: kra?.target || null,
      achieved: kra?.achieved || null,
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "actions",
  });

  const allWatchedFields = watch();

   React.useEffect(() => {
    const { actions, weightage, target, achieved } = allWatchedFields;
    let totalMarksAchieved = 0;
    
    // Case 1: KRA has actions (KPIs)
    if (actions && actions.length > 0) {
        
        const totalKpiTarget = actions.reduce((sum, action) => sum + (action.target || 0), 0);
        
        actions.forEach((action, index) => {
            const kpiAchieved = action.achieved || action.updates?.reduce((sum, u) => sum + (u.value || 0), 0) || 0;
            
            const kpiWeightage = (weightage && totalKpiTarget > 0 && action.target) 
                ? (action.target / totalKpiTarget) * weightage 
                : 0;

            if (watch(`actions.${index}.weightage`) !== parseFloat(kpiWeightage.toFixed(2))) {
                setValue(`actions.${index}.weightage`, parseFloat(kpiWeightage.toFixed(2)));
            }
             if (watch(`actions.${index}.achieved`) !== kpiAchieved) {
                setValue(`actions.${index}.achieved`, kpiAchieved);
            }

            let marks = 0;
            if(action.target && action.target > 0 && kpiWeightage > 0) {
                marks = (kpiAchieved / action.target) * kpiWeightage;
            } else if (action.isCompleted && kpiWeightage) {
                marks = kpiWeightage;
            }
            totalMarksAchieved += marks;
        });
    } 
    // Case 2: KRA has no actions, but has a target
    else if (target && target > 0 && weightage) {
         totalMarksAchieved = ((achieved || 0) / target) * weightage;
    }

    if (watch('marksAchieved') !== parseFloat(totalMarksAchieved.toFixed(2))) {
        setValue('marksAchieved', parseFloat(totalMarksAchieved.toFixed(2)), { shouldValidate: true });
    }

  }, [allWatchedFields, setValue, watch]);


  React.useEffect(() => {
    if (open) {
      reset({
        taskDescription: kra?.taskDescription || '',
        employeeId: kra?.employee.id || '',
        weightage: kra?.weightage || null,
        marksAchieved: kra?.marksAchieved || null,
        bonus: kra?.bonus || null,
        penalty: kra?.penalty || null,
        actions: kra?.actions?.map(a => ({
            ...a,
            dueDate: new Date(a.dueDate),
            updates: a.updates?.map(u => ({...u, date: new Date(u.date)})) || []
        })) || [],
        handover: kra?.handover || '',
        target: kra?.target || null,
        achieved: kra?.achieved || null,
      });
    }
  }, [open, kra, reset, employees]);

  const taskDescription = watch('taskDescription');
  const hasActions = allWatchedFields.actions && allWatchedFields.actions.length > 0;

  const handleRefine = async () => {
    if (!taskDescription) {
      toast({
        title: 'Error',
        description: 'Please enter a task description first.',
        variant: 'destructive',
      });
      return;
    }
    setIsRefining(true);
    try {
      const result = await refineKraTaskDescription({ taskDescription });
      setValue('taskDescription', result.refinedTaskDescription, {
        shouldValidate: true,
      });
      toast({
        title: 'Success',
        description: 'Task description has been refined.',
      });
    } catch (error) {
      console.error('Failed to refine KRA task:', error);
      toast({
        title: 'Error',
        description: 'Failed to refine task description. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefining(false);
    }
  };
  
  const onSubmit = (data: KraFormValues) => {
    const selectedEmployee = employees.find(e => e.id === data.employeeId);
    if (!selectedEmployee) {
      toast({
        title: 'Error',
        description: 'Employee not found. Please select an employee.',
        variant: 'destructive',
      });
      return;
    }
    
    let kraAchieved = 0;
    const updatedActions = data.actions?.map(action => {
        const achieved = action.achieved || action.updates?.reduce((sum, u) => sum + (u.value || 0), 0) || 0;
        kraAchieved += achieved;
        return {...action, achieved };
    });

    const totalTarget = updatedActions?.reduce((sum, action) => sum + (action.target || 0), 0) || (data.target || 0);
    const finalAchieved = data.actions && data.actions.length > 0 ? kraAchieved : (data.achieved || 0);
    const progress = totalTarget > 0 ? Math.round((finalAchieved / totalTarget) * 100) : (kra?.progress || 0);

    const newKra: KRA = {
      id: kra?.id || uuidv4(),
      taskDescription: data.taskDescription,
      employee: selectedEmployee,
      progress: Math.min(100, progress),
      status: kra?.status || 'Pending',
      weightage: data.weightage || null,
      marksAchieved: data.marksAchieved,
      bonus: data.bonus,
      penalty: data.penalty,
      startDate: kra?.startDate || new Date(),
      endDate: kra?.endDate || new Date(new Date().setMonth(new Date().getMonth() + 3)),
      actions: updatedActions,
      handover: data.handover,
      target: data.target,
      achieved: finalAchieved,
    };
    onSave?.(newKra);
    toast({
      title: 'Progress Synchronized',
      description: `Updates for ${selectedEmployee.name} have been saved.`,
    });
    setOpen(false);
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{kra ? 'Update KRA & Weekly KPI Logs' : 'Add New KRA'}</DialogTitle>
            <DialogDescription>
              {kra ? 'Log your weekly progress. The system will automatically calculate pending units.' : 'Fill in the details for the new KRA task.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            
            <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="employeeName" className="text-right">
                Employee
            </Label>
            <div className="col-span-3">
                <Controller
                    name="employeeId"
                    control={control}
                    render={({ field }) => (
                    <Popover open={employeeComboboxOpen} onOpenChange={setEmployeeComboboxOpen}>
                        <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={employeeComboboxOpen}
                            className="w-full justify-between"
                            disabled={!isAdmin}
                        >
                            {field.value
                            ? employees.find((employee) => employee.id === field.value)?.name
                            : "Select employee..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                            <CommandInput 
                            placeholder="Search employee..."
                            />
                            <CommandList>
                                <CommandEmpty>No employees found.</CommandEmpty>
                                <CommandGroup>
                                {employees.map((employee) => (
                                    <CommandItem
                                    key={employee.id}
                                    value={employee.name}
                                    onSelect={() => {
                                        field.onChange(employee.id)
                                        setEmployeeComboboxOpen(false);
                                    }}
                                    >
                                    <Check
                                        className={cn(
                                        "mr-2 h-4 w-4",
                                        employee.id === field.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {employee.name}
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                        </PopoverContent>
                    </Popover>
                    )}
                />
                {errors.employeeId && <p className="text-xs text-destructive mt-1">{errors.employeeId.message}</p>}
            </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="taskDescription" className="text-right pt-2">
                Task
            </Label>
            <div className="col-span-3">
                <Controller
                    name="taskDescription"
                    control={control}
                    render={({ field }) => <Textarea id="taskDescription" {...field} rows={2} disabled={!isAdmin} />}
                />
                {errors.taskDescription && <p className="text-xs text-destructive mt-1">{errors.taskDescription.message}</p>}
                {isAdmin && (
                    <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleRefine}
                    disabled={isRefining}
                    >
                    {isRefining ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
                    )}
                    Refine Task with AI
                    </Button>
                )}
            </div>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="weightage" className="text-right">
                   Overall Goals
                </Label>
                 <div className="col-span-3 grid grid-cols-4 gap-2">
                    <div>
                         <Label className="text-xs text-muted-foreground">Weightage</Label>
                        <Controller
                        name="weightage"
                        control={control}
                        render={({ field }) => (
                            <Input 
                                id="weightage" 
                                type="number" 
                                {...field} 
                                value={field.value ?? ''}
                                onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                placeholder="Marks"
                                disabled={!isAdmin}
                            />
                        )}
                        />
                    </div>
                     <div>
                        <Label className="text-xs text-muted-foreground">Goal Target</Label>
                         <Controller
                        name="target"
                        control={control}
                        render={({ field }) => (
                            <Input 
                                id="target" 
                                type="number" 
                                {...field} 
                                value={field.value ?? ''}
                                onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                placeholder="Units"
                                disabled={!isAdmin}
                            />
                        )}
                        />
                    </div>
                     <div>
                        <Label className="text-xs text-muted-foreground font-semibold text-primary">Achieved</Label>
                         <Controller
                        name="achieved"
                        control={control}
                        render={({ field }) => (
                            <Input 
                                id="achieved" 
                                type="number" 
                                {...field} 
                                value={field.value ?? ''}
                                onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                placeholder="Work Done"
                                className='border-primary/50'
                                disabled={hasActions}
                            />
                        )}
                        />
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground font-semibold text-orange-600">Pending</Label>
                        <div className="h-10 flex items-center px-3 border rounded-md bg-orange-50 text-orange-700 font-bold">
                            {Math.max(0, (watch('target') || 0) - (watch('achieved') || 0))}
                        </div>
                    </div>
                </div>
            </div>

             <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2 font-semibold">Weekly KPI Logs</Label>
                <div className="col-span-3 space-y-4">
                    {fields.map((field, index) => {
                        const target = field.target || 0;
                        const achieved = field.achieved || 0;
                        const pending = Math.max(0, target - achieved);

                        return (
                        <div key={field.id} className="space-y-2 p-4 border rounded-lg bg-muted/30 shadow-sm">
                            <div className="flex items-center gap-3">
                                <Controller
                                    name={`actions.${index}.isCompleted`}
                                    control={control}
                                    render={({ field: checkboxField }) => (
                                        <Checkbox
                                            checked={checkboxField.value}
                                            onCheckedChange={checkboxField.onChange}
                                        />
                                    )}
                                />
                                <div className='flex-1 grid grid-cols-[1fr,100px] gap-2'>
                                    <Controller
                                        name={`actions.${index}.name`}
                                        control={control}
                                        render={({ field: nameField }) => (
                                            <Input 
                                                type="text"
                                                placeholder="KPI Description"
                                                className="bg-background font-medium"
                                                {...nameField}
                                                disabled={!isAdmin}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name={`actions.${index}.target`}
                                        control={control}
                                        render={({ field: targetField }) => (
                                            <Input 
                                                type="number"
                                                placeholder="Target"
                                                className="bg-background"
                                                {...targetField}
                                                value={targetField.value ?? ''}
                                                onChange={e => targetField.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                                disabled={!isAdmin}
                                            />
                                        )}
                                    />
                                </div>
                                {isAdmin && (
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                )}
                            </div>
                            <div className='flex items-end gap-3 pl-7'>
                                <div className='flex-1 space-y-1'>
                                    <Label className='text-xs'>Deadline</Label>
                                    <Controller
                                        name={`actions.${index}.dueDate`}
                                        control={control}
                                        render={({ field: dateField }) => (
                                            <Input 
                                                type="date"
                                                className='w-full bg-background h-9'
                                                value={format(new Date(dateField.value), 'yyyy-MM-dd')}
                                                onChange={e => dateField.onChange(new Date(e.target.value))}
                                                disabled={!isAdmin}
                                            />
                                        )}
                                    />
                                </div>
                                <div className='w-24 space-y-1'>
                                    <Label className='text-xs font-semibold text-primary'>Done</Label>
                                    <div className="h-9 flex items-center px-3 border rounded-md bg-primary/5 text-primary font-bold text-sm">
                                        {achieved}
                                    </div>
                                </div>
                                <div className='w-24 space-y-1'>
                                    <Label className='text-xs font-semibold text-orange-600'>Pending</Label>
                                    <div className="h-9 flex items-center px-3 border rounded-md bg-orange-50 text-orange-700 font-bold text-sm">
                                        {pending}
                                    </div>
                                </div>
                                <UpdateDialog 
                                    target={target} 
                                    currentAchieved={achieved}
                                    onSave={(updateData) => {
                                        const currentUpdates = field.updates || [];
                                        const newUpdates = [...currentUpdates, { ...updateData, id: uuidv4(), date: new Date() }];
                                        const newAchieved = achieved + (updateData.value || 0);
                                        update(index, {...field, updates: newUpdates, achieved: newAchieved });
                                    }}
                                >
                                    <Button type="button" size="sm" variant="outline" className='gap-2 bg-background border-primary/20 text-primary hover:bg-primary/5 h-9'>
                                        <History className='h-4 w-4'/> Weekly Log
                                    </Button>
                                </UpdateDialog>
                            </div>
                        </div>
                        )
                    })}
                    {isAdmin && (
                        <Button type="button" size="sm" variant="outline" className="w-full border-dashed" onClick={() => append({ id: uuidv4(), name: '', dueDate: new Date(), isCompleted: false, weightage: 0, updates: [] })}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New KPI Goal
                        </Button>
                    )}
                </div>
            </div>
            
            <Separator />

            <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="marksAchieved" className="text-right">
                Calculated Marks
            </Label>
            <div className="col-span-3">
                <Controller
                name="marksAchieved"
                control={control}
                render={({ field }) => (
                    <Input 
                        id="marksAchieved" 
                        type="number" 
                        {...field} 
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                        placeholder="Auto-calculated based on progress"
                        readOnly
                        className='bg-muted font-bold'
                    />
                )}
                />
            </div>
            </div>
            
            {isAdmin && (
                <>
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="bonus" className="text-right">
                        Bonus Points
                    </Label>
                    <div className="col-span-3">
                        <Controller
                        name="bonus"
                        control={control}
                        render={({ field }) => (
                            <Input 
                                id="bonus" 
                                type="number" 
                                {...field} 
                                value={field.value ?? ''}
                                onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                placeholder="Extra performance points"
                            />
                        )}
                        />
                    </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="penalty" className="text-right">
                        Penalty Points
                    </Label>
                    <div className="col-span-3">
                        <Controller
                        name="penalty"
                        control={control}
                        render={({ field }) => (
                            <Input 
                                id="penalty" 
                                type="number" 
                                {...field} 
                                value={field.value ?? ''}
                                onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                placeholder="Deductions if any"
                            />
                        )}
                        />
                    </div>
                    </div>
                </>
            )}

             <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="handover" className="text-right pt-2">
                    Work Handover
                </Label>
                <div className="col-span-3">
                    <Controller
                        name="handover"
                        control={control}
                        render={({ field }) => (
                            <Textarea 
                                id="handover" 
                                {...field} 
                                rows={2} 
                                placeholder="Any notes regarding work handover or status..."
                            />
                        )}
                    />
                </div>
            </div>
          </div>
          <DialogFooter className="pt-4 sticky bottom-0 bg-background border-t mt-2 py-4">
            <Button type="submit" className='w-full'>Sync All Progress Data</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
