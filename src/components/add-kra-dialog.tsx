
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
import { Sparkles, Loader2, PlusCircle, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { refineKraTaskDescription } from '@/ai/flows/kra-refinement';
import { useToast } from '@/hooks/use-toast';
import type { KRA, ActionItem, Employee } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useAuth } from './auth-provider';


const actionItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Action description cannot be empty."),
  dueDate: z.date(),
  isCompleted: z.boolean(),
  marks: z.coerce.number().min(0, "Marks must be a positive number."),
});

const kraSchema = z.object({
  taskDescription: z.string(),
  employeeId: z.string().min(1, 'Employee is required.'),
  weightage: z.number().positive('Weightage must be a positive number.').nullable(),
  marksAchieved: z.number().min(0).nullable(),
  bonus: z.number().min(0).nullable(),
  penalty: z.number().min(0).nullable(),
  actions: z.array(actionItemSchema).optional(),
}).superRefine((data, ctx) => {
    if (data.weightage && data.actions) {
        const totalActionMarks = data.actions.reduce((sum, action) => sum + (action.marks || 0), 0);
        if (totalActionMarks > data.weightage) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Total marks of action items (${totalActionMarks}) cannot exceed the KRA weightage (${data.weightage}).`,
                path: ['actions'],
            });
        }
    }
});


type KraFormValues = z.infer<typeof kraSchema>;

interface AddKraDialogProps {
  children: React.ReactNode;
  kra?: KRA;
  onSave?: (kra: KRA) => void;
  employees: Employee[];
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
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "actions",
  });

  const actions = watch('actions');
  const employeeId = watch('employeeId');

  React.useEffect(() => {
    if (actions) {
        const completedMarks = actions
            .filter(action => action.isCompleted)
            .reduce((sum, action) => sum + (action.marks || 0), 0);
        
        setValue('marksAchieved', completedMarks, { shouldValidate: true });

        const totalActionMarks = actions.reduce((sum, action) => sum + (action.marks || 0), 0);
        // This is a proxy for progress, will be set on the KRA object later.
    } else {
        setValue('marksAchieved', 0);
    }
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
        actions: kra?.actions?.map(a => ({...a, dueDate: new Date(a.dueDate)})) || [],
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
    
    const completedMarks = data.actions?.filter(a => a.isCompleted).reduce((sum, a) => sum + (a.marks || 0), 0) || 0;
    const totalActionMarks = data.actions?.reduce((sum, a) => sum + (a.marks || 0), 0) || 0;
    const progress = totalActionMarks > 0 ? Math.round((completedMarks / totalActionMarks) * 100) : (kra?.progress || 0);
    
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
      actions: data.actions,
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
      <DialogContent className="sm:max-w-2xl">
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
                <Label className="text-right pt-2">Action Items</Label>
                <div className="col-span-3 space-y-2">
                    {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2 p-2 border rounded-md">
                        <Controller
                            name={`actions.${index}.isCompleted`}
                            control={control}
                            render={({ field }) => (
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                         <Controller
                            name={`actions.${index}.description`}
                            control={control}
                            render={({ field }) => (
                                <Input 
                                    type="text"
                                    placeholder="Action item description"
                                    className="flex-1"
                                    {...field}
                                />
                            )}
                        />
                        <Controller
                            name={`actions.${index}.dueDate`}
                            control={control}
                            render={({ field }) => (
                                <Input 
                                    type="date"
                                    className='w-auto'
                                    value={format(new Date(field.value), 'yyyy-MM-dd')}
                                    onChange={e => field.onChange(new Date(e.target.value))}
                                />
                            )}
                        />
                         <Controller
                            name={`actions.${index}.marks`}
                            control={control}
                            render={({ field }) => (
                                <Input 
                                    type="number"
                                    placeholder="Marks"
                                    className="w-20"
                                    {...field}
                                />
                            )}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                    ))}
                    <Button type="button" size="sm" variant="outline" onClick={() => append({ id: uuidv4(), description: '', dueDate: new Date(), isCompleted: false, marks: 0 })}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Action Item
                    </Button>
                     {errors.actions && <p className="text-xs text-destructive mt-1">{errors.actions.message}</p>}
                </div>
            </div>

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
