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


const actionItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Action description cannot be empty."),
  dueDate: z.date(),
  isCompleted: z.boolean(),
});

const kraSchema = z.object({
  taskDescription: z.string().min(10, 'Task description must be at least 10 characters.'),
  employeeId: z.string().min(1, 'Employee is required.'),
  employeeName: z.string().min(2, 'Employee name is required.'),
  employeeBranch: z.string().optional(),
  weightage: z.number().positive('Weightage must be a positive number.').nullable(),
  marksAchieved: z.number().min(0).nullable(),
  bonus: z.number().min(0).nullable(),
  penalty: z.number().min(0).nullable(),
  actions: z.array(actionItemSchema).optional(),
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
  const [currentEmployees, setCurrentEmployees] = React.useState<Employee[]>(employees);
  const [newEmployeeName, setNewEmployeeName] = React.useState('');
  const [showNewEmployeeFields, setShowNewEmployeeFields] = React.useState(false);


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
      employeeName: kra?.employee.name || '',
      employeeBranch: kra?.employee.branch || '',
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
  const weightage = watch('weightage');
  const employeeId = watch('employeeId');

  React.useEffect(() => {
    if (actions && actions.length > 0 && weightage) {
        const completedActions = actions.filter(action => action.isCompleted).length;
        const totalActions = actions.length;
        
        if (totalActions > 0) {
            const calculatedMarks = (completedActions / totalActions) * weightage;
            setValue('marksAchieved', Math.round(Math.min(calculatedMarks, weightage)), { shouldValidate: true });
            
            const progress = Math.round((completedActions / totalActions) * 100);
            // This is a proxy for progress, will be set on the KRA object later.
        } else {
            setValue('marksAchieved', 0);
        }

    } else if (weightage) {
        setValue('marksAchieved', 0);
    } else {
        setValue('marksAchieved', kra?.marksAchieved || null);
    }
  }, [actions, weightage, setValue, kra]);

  React.useEffect(() => {
    if (open) {
      const isEditingNewEmployee = kra && !employees.some(e => e.id === kra.employee.id);
      setShowNewEmployeeFields(isEditingNewEmployee);
      setCurrentEmployees(employees);
      reset({
        taskDescription: kra?.taskDescription || '',
        employeeId: kra?.employee.id || '',
        employeeName: kra?.employee.name || '',
        employeeBranch: kra?.employee.branch || '',
        weightage: kra?.weightage || null,
        marksAchieved: kra?.marksAchieved || null,
        bonus: kra?.bonus || null,
        penalty: kra?.penalty || null,
        actions: kra?.actions?.map(a => ({...a, dueDate: new Date(a.dueDate)})) || [],
      });
    }
  }, [open, kra, reset, employees]);

  React.useEffect(() => {
    const selectedEmployee = currentEmployees.find(e => e.id === employeeId);
    if(selectedEmployee) {
        setValue("employeeBranch", selectedEmployee.branch || '');
        setValue("employeeName", selectedEmployee.name);
        setShowNewEmployeeFields(false);
    }
  }, [employeeId, currentEmployees, setValue]);


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
    const totalActions = data.actions?.length || 0;
    const completedActions = data.actions?.filter(a => a.isCompleted).length || 0;
    const progress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : (kra?.progress || 0);
    
    const selectedEmployee = currentEmployees.find(e => e.id === data.employeeId);
    
    const finalEmployeeId = showNewEmployeeFields ? uuidv4() : data.employeeId;

    const newKra: KRA = {
      id: kra?.id || uuidv4(),
      taskDescription: data.taskDescription,
      employee: {
        id: finalEmployeeId,
        name: data.employeeName,
        branch: data.employeeBranch,
        avatarUrl: selectedEmployee?.avatarUrl || `https://placehold.co/32x32.png?text=${data.employeeName.charAt(0)}`,
      },
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
      description: `The KRA for ${data.employeeName} has been saved successfully.`,
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
                              placeholder="Search employee or add new..."
                              onValueChange={setNewEmployeeName}
                              value={newEmployeeName}
                            />
                            <CommandList>
                                <CommandEmpty>
                                     <CommandItem
                                      onSelect={() => {
                                        setValue("employeeName", newEmployeeName.trim());
                                        setValue("employeeId", newEmployeeName.trim()); // Temporary ID
                                        setShowNewEmployeeFields(true);
                                        setEmployeeComboboxOpen(false);
                                      }}
                                    >
                                       <PlusCircle className="mr-2 h-4 w-4" />
                                       <span>Add "{newEmployeeName}"</span>
                                    </CommandItem>
                                </CommandEmpty>
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
                 <Controller name="employeeName" control={control} render={({field}) => <input type="hidden" {...field} />} />
              </div>
            </div>

            {showNewEmployeeFields && (
                <>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="newEmployeeName" className="text-right">
                            New Employee
                        </Label>
                        <div className="col-span-3">
                             <Input id="newEmployeeName" value={watch('employeeName')} disabled />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="employeeBranch" className="text-right">
                            Branch
                        </Label>
                        <div className="col-span-3">
                            <Controller
                                name="employeeBranch"
                                control={control}
                                render={({ field }) => <Input id="employeeBranch" {...field} placeholder="e.g. Engineering" />}
                            />
                        </div>
                    </div>
                </>
            )}

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
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                    ))}
                    <Button type="button" size="sm" variant="outline" onClick={() => append({ id: uuidv4(), description: '', dueDate: new Date(), isCompleted: false })}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Action Item
                    </Button>
                </div>
            </div>
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
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
