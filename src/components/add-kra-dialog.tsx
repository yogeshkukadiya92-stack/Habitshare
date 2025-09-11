

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
import { Sparkles, Loader2, PlusCircle, Trash2, Check, ChevronsUpDown, MessageSquare } from 'lucide-react';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { refineKraTaskDescription } from '@/ai/flows/kra-refinement';
import { useToast } from '@/hooks/use-toast';
import type { KRA, ActionItem, Employee, WeeklyUpdate, WeeklyUpdateStatus } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useAuth } from './auth-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';

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
  weightage: z.coerce.number().min(0, "Marks must be a positive number."),
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
}).superRefine((data, ctx) => {
    if (data.weightage && data.actions) {
        const totalActionMarks = data.actions.reduce((sum, action) => sum + (action.weightage || 0), 0);
        if (totalActionMarks > data.weightage) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Total weightage of KPIs (${totalActionMarks}) cannot exceed the KRA weightage (${data.weightage}).`,
                path: ['actions'],
            });
        }
    }
});


type KraFormValues = z.infer<typeof kraSchema>;
type WeeklyUpdateFormValues = z.infer<typeof weeklyUpdateSchema>;

interface AddKraDialogProps {
  children: React.ReactNode;
  kra?: KRA;
  onSave?: (kra: KRA) => void;
  employees: Employee[];
}

const UpdateDialog = ({ onSave, children }: {onSave: (update: WeeklyUpdate) => void, children: React.ReactNode}) => {
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

    const onSubmit = (data: WeeklyUpdateFormValues) => {
        onSave({ id: uuidv4(), ...data });
        toast({title: "Update Added", description: "The weekly update has been saved."});
        setOpen(false);
        reset();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                 <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>Add Weekly Update</DialogTitle>
                        <DialogDescription>
                            Provide a status update for this KPI.
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
                                                <SelectValue placeholder="Select status" />
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
                            <Label htmlFor="value" className="text-right pt-2">Update Value</Label>
                             <div className="col-span-3">
                                <Controller
                                    name="value"
                                    control={control}
                                    render={({ field }) => <Input type="number" id="value" {...field} placeholder="e.g. 300"/>}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="comment" className="text-right pt-2">Comment</Label>
                            <div className="col-span-3">
                                <Controller
                                    name="comment"
                                    control={control}
                                    render={({ field }) => <Textarea id="comment" {...field} placeholder="Add your update comment..."/>}
                                />
                                {errors.comment && <p className="text-xs text-destructive mt-1">{errors.comment.message}</p>}
                            </div>
                        </div>
                    </div>
                     <DialogFooter>
                        <Button type="submit">Save Update</Button>
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
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "actions",
  });

  const actions = watch('actions');
  const employeeId = watch('employeeId');

  React.useEffect(() => {
    let totalMarksAchieved = 0;
    actions?.forEach(action => {
        const achievedValue = action.updates?.reduce((sum, u) => sum + (u.value || 0), 0) || 0;
        
        let marks = 0;
        if(action.target && action.target > 0 && action.weightage > 0) {
            marks = (achievedValue / action.target) * action.weightage;
        } else if (action.isCompleted && action.weightage) {
            marks = action.weightage;
        }
        totalMarksAchieved += marks;
    });

    setValue('marksAchieved', Math.round(totalMarksAchieved * 100) / 100, { shouldValidate: true });

  }, [actions, setValue]);

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
      });
    }
  }, [open, kra, reset, employees]);

  const taskDescription = watch('taskDescription');

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
    
    const updatedActions = data.actions?.map(action => {
        const achieved = action.updates?.reduce((sum, u) => sum + (u.value || 0), 0) || action.achieved || 0;
        return {...action, achieved };
    });

    const totalAchieved = updatedActions?.reduce((sum, action) => sum + (action.achieved || 0), 0) || 0;
    const totalTarget = updatedActions?.reduce((sum, action) => sum + (action.target || 0), 0) || 0;
    const progress = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : (kra?.progress || 0);

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
    };
    onSave?.(newKra);
    toast({
      title: 'KRA Saved',
      description: `The KRA for ${selectedEmployee.name} has been saved successfully.`,
    });
    setOpen(false);
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{kra ? 'Edit KRA' : 'Add New KRA'}</DialogTitle>
            <DialogDescription>
              {kra ? 'Update the details for this KRA.' : 'Fill in the details for the new KRA task.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
            <fieldset disabled={!isAdmin}>
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
                        render={({ field }) => <Textarea id="taskDescription" {...field} rows={3} />}
                    />
                    {errors.taskDescription && <p className="text-xs text-destructive mt-1">{errors.taskDescription.message}</p>}
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
                    Refine with AI
                    </Button>
                </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="weightage" className="text-right">
                    Weightage
                </Label>
                <div className="col-span-3">
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
                            placeholder="e.g. 15"
                        />
                    )}
                    />
                    {errors.weightage && <p className="text-xs text-destructive mt-1">{errors.weightage.message}</p>}
                </div>
                </div>
            </fieldset>

             <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">KPIs</Label>
                <div className="col-span-3 space-y-3">
                    {fields.map((field, index) => (
                    <div key={field.id} className="space-y-2 p-3 border rounded-md bg-muted/50">
                        <div className="flex items-center gap-2">
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
                            <div className='flex-1 grid grid-cols-3 gap-2'>
                                <Controller
                                    name={`actions.${index}.name`}
                                    control={control}
                                    render={({ field }) => (
                                        <Input 
                                            type="text"
                                            placeholder="KPI (e.g. Calls)"
                                            className="bg-background"
                                            {...field}
                                        />
                                    )}
                                />
                                <Controller
                                    name={`actions.${index}.target`}
                                    control={control}
                                    render={({ field }) => (
                                        <Input 
                                            type="number"
                                            placeholder="Target (e.g. 1500)"
                                            className="bg-background"
                                            {...field}
                                            value={field.value ?? ''}
                                            onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                        />
                                    )}
                                />
                                 <Controller
                                    name={`actions.${index}.weightage`}
                                    control={control}
                                    render={({ field }) => (
                                        <Input 
                                            type="number"
                                            placeholder="Weightage"
                                            className="bg-background"
                                            {...field}
                                            value={field.value ?? ''}
                                            onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                        />
                                    )}
                                />
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                        <div className='flex items-end gap-2 pl-6'>
                             <div className='flex-1 space-y-1'>
                                <Label className='text-xs'>Due Date</Label>
                                 <Controller
                                    name={`actions.${index}.dueDate`}
                                    control={control}
                                    render={({ field }) => (
                                        <Input 
                                            type="date"
                                            className='w-full bg-background'
                                            value={format(new Date(field.value), 'yyyy-MM-dd')}
                                            onChange={e => field.onChange(new Date(e.target.value))}
                                        />
                                    )}
                                />
                            </div>
                            <UpdateDialog onSave={(update) => {
                                const currentUpdates = field.updates || [];
                                update.id = uuidv4();
                                update.date = new Date();
                                const newUpdates = [...currentUpdates, update];
                                update(index, {...field, updates: newUpdates });
                            }}>
                                <Button type="button" size="sm" variant="outline" className='gap-2 bg-background'>
                                    <MessageSquare className='h-4 w-4'/> Add Update
                                </Button>
                            </UpdateDialog>
                        </div>
                    </div>
                    ))}
                    <Button type="button" size="sm" variant="outline" onClick={() => append({ id: uuidv4(), name: '', dueDate: new Date(), isCompleted: false, weightage: 0, updates: [] })}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add KPI
                    </Button>
                     {errors.actions && <p className="text-xs text-destructive mt-1">{errors.actions.message}</p>}
                </div>
            </div>
            
            <Separator />

            <fieldset disabled={!isAdmin}>
                <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="marksAchieved" className="text-right">
                    Marks Achieved
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
                            placeholder="Auto-calculated"
                            readOnly
                            className='bg-muted'
                        />
                    )}
                    />
                    {errors.marksAchieved && <p className="text-xs text-destructive mt-1">{errors.marksAchieved.message}</p>}
                </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bonus" className="text-right">
                    Bonus Marks
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
                            placeholder="e.g. 2"
                        />
                    )}
                    />
                    {errors.bonus && <p className="text-xs text-destructive mt-1">{errors.bonus.message}</p>}
                </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="penalty" className="text-right">
                    Penalty Marks
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
                            placeholder="e.g. 1"
                        />
                    )}
                    />
                    {errors.penalty && <p className="text-xs text-destructive mt-1">{errors.penalty.message}</p>}
                </div>
                </div>
                 <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="handover" className="text-right pt-2">
                        Handover Notes
                    </Label>
                    <div className="col-span-3">
                        <Controller
                            name="handover"
                            control={control}
                            render={({ field }) => (
                                <Textarea 
                                    id="handover" 
                                    {...field} 
                                    rows={3} 
                                    placeholder="Add any notes for handover..."
                                />
                            )}
                        />
                        {errors.handover && <p className="text-xs text-destructive mt-1">{errors.handover.message}</p>}
                    </div>
                </div>
            </fieldset>
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
