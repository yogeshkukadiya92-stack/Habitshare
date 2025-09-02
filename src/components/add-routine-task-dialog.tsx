
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
import { Check, ChevronsUpDown } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import type { RoutineTask, Employee, RoutineTaskStatus } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format, parseISO } from 'date-fns';


const routineTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(1, "Description cannot be empty."),
  employeeId: z.string().min(1, 'Employee is required.'),
  assignedDate: z.date(),
  dueDate: z.date(),
  status: z.enum(['To Do', 'In Progress', 'Completed']),
  priority: z.enum(['Low', 'Medium', 'High']),
  remarks: z.string().optional(),
});

type RoutineTaskFormValues = z.infer<typeof routineTaskSchema>;

interface AddRoutineTaskDialogProps {
  children: React.ReactNode;
  task?: RoutineTask;
  onSave?: (task: RoutineTask) => void;
  employees: Employee[];
}

export function AddRoutineTaskDialog({ children, task, onSave, employees }: AddRoutineTaskDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [employeeComboboxOpen, setEmployeeComboboxOpen] = React.useState(false)
  
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<RoutineTaskFormValues>({
    resolver: zodResolver(routineTaskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      employeeId: task?.employee.id || '',
      assignedDate: task?.assignedDate || new Date(),
      dueDate: task?.dueDate || new Date(),
      status: task?.status || 'To Do',
      priority: task?.priority || 'Medium',
      remarks: task?.remarks || '',
    },
  });

  const employeeId = watch('employeeId');

  React.useEffect(() => {
    if (open) {
      reset({
        title: task?.title || '',
        description: task?.description || '',
        employeeId: task?.employee.id || '',
        assignedDate: task?.assignedDate ? new Date(task.assignedDate) : new Date(),
        dueDate: task?.dueDate ? new Date(task.dueDate) : new Date(),
        status: task?.status || 'To Do',
        priority: task?.priority || 'Medium',
        remarks: task?.remarks || '',
      });
    }
  }, [open, task, reset]);


  const onSubmit = (data: RoutineTaskFormValues) => {
    const selectedEmployee = employees.find(e => e.id === data.employeeId);
    if (!selectedEmployee) {
        toast({ title: "Error", description: "Selected employee not found.", variant: 'destructive' });
        return;
    }
    
    const newTask: RoutineTask = {
      id: task?.id || uuidv4(),
      title: data.title,
      description: data.description,
      employee: selectedEmployee,
      assignedDate: data.assignedDate,
      dueDate: data.dueDate,
      status: data.status,
      priority: data.priority,
      remarks: data.remarks,
    };
    onSave?.(newTask);
    toast({
      title: task ? 'Task Updated' : 'Task Added',
      description: `The task "${data.title}" has been saved successfully.`,
    });
    setOpen(false);
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{task ? 'Edit Routine Task' : 'Add New Routine Task'}</DialogTitle>
            <DialogDescription>
              {task ? 'Update the details for this task.' : 'Fill in the details for the new routine task.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <div className="col-span-3">
                 <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                     <Input id="title" {...field} placeholder="e.g. Daily Standup Meeting" />
                  )}
                />
                {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Description
              </Label>
              <div className="col-span-3">
                <Controller
                    name="description"
                    control={control}
                    render={({ field }) => <Textarea id="description" {...field} rows={3} />}
                />
                 {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
              </div>
            </div>

             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="employeeId" className="text-right">
                Assign To
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
                            <CommandInput placeholder="Search employee..."/>
                            <CommandList>
                                <CommandEmpty>No employee found.</CommandEmpty>
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
            
             <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                    Dates
                </Label>
                <div className="col-span-3 grid grid-cols-2 gap-2">
                    <div>
                         <Label htmlFor="assignedDate" className="text-xs text-muted-foreground">Assigned</Label>
                         <Controller
                            name="assignedDate"
                            control={control}
                            render={({ field }) => (
                                <Input 
                                    id="assignedDate"
                                    type="date"
                                    className='w-full'
                                    value={format(field.value, 'yyyy-MM-dd')}
                                    onChange={e => field.onChange(e.target.valueAsDate || new Date(e.target.value))}
                                />
                            )}
                        />
                        {errors.assignedDate && <p className="text-xs text-destructive mt-1">{errors.assignedDate.message}</p>}
                    </div>
                    <div>
                         <Label htmlFor="dueDate" className="text-xs text-muted-foreground">Due</Label>
                         <Controller
                            name="dueDate"
                            control={control}
                            render={({ field }) => (
                                <Input 
                                    id="dueDate"
                                    type="date"
                                    className='w-full'
                                    value={format(field.value, 'yyyy-MM-dd')}
                                    onChange={e => field.onChange(e.target.valueAsDate || new Date(e.target.value))}
                                />
                            )}
                        />
                        {errors.dueDate && <p className="text-xs text-destructive mt-1">{errors.dueDate.message}</p>}
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">
                Priority
              </Label>
              <div className="col-span-3">
                 <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Low">Low</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                 {errors.priority && <p className="text-xs text-destructive mt-1">{errors.priority.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
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
                                <SelectItem value="To Do">To Do</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                 {errors.status && <p className="text-xs text-destructive mt-1">{errors.status.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="remarks" className="text-right pt-2">
                Remarks
              </Label>
              <div className="col-span-3">
                <Controller
                    name="remarks"
                    control={control}
                    render={({ field }) => <Textarea id="remarks" {...field} rows={2} placeholder="Add any comments or remarks..." />}
                />
                 {errors.remarks && <p className="text-xs text-destructive mt-1">{errors.remarks.message}</p>}
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

    