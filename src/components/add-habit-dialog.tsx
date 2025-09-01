
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
import type { Habit, Employee } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const habitSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required.'),
  name: z.string().min(3, 'Habit name must be at least 3 characters.'),
  description: z.string().optional(),
  goalDays: z.number().int().positive('Goal must be a positive number of days.'),
  startDate: z.date(),
});

type HabitFormValues = z.infer<typeof habitSchema>;

interface AddHabitDialogProps {
  children: React.ReactNode;
  habit?: Habit;
  onSave: (habit: Habit) => void;
  employees: Employee[];
}

export function AddHabitDialog({ children, habit, onSave, employees }: AddHabitDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [employeeComboboxOpen, setEmployeeComboboxOpen] = React.useState(false)
  
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HabitFormValues>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      employeeId: habit?.employee.id || '',
      name: habit?.name || '',
      description: habit?.description || '',
      goalDays: habit?.goalDays || 30,
      startDate: habit?.startDate || new Date(),
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        employeeId: habit?.employee.id || '',
        name: habit?.name || '',
        description: habit?.description || '',
        goalDays: habit?.goalDays || 30,
        startDate: habit?.startDate ? new Date(habit.startDate) : new Date(),
      });
    }
  }, [open, habit, reset]);


  const onSubmit = (data: HabitFormValues) => {
    const selectedEmployee = employees.find(e => e.id === data.employeeId);
    if (!selectedEmployee) {
        toast({ title: "Error", description: "Selected employee not found.", variant: 'destructive' });
        return;
    }
    
    const newHabit: Habit = {
      id: habit?.id || uuidv4(),
      employee: selectedEmployee,
      name: data.name,
      description: data.description || '',
      goalDays: data.goalDays,
      startDate: data.startDate,
      checkIns: habit?.checkIns || [],
    };
    onSave(newHabit);
    toast({
      title: habit ? 'Habit Updated' : 'Habit Created',
      description: `The habit "${data.name}" has been assigned to ${selectedEmployee.name}.`,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{habit ? 'Edit Habit' : 'Create New Habit'}</DialogTitle>
            <DialogDescription>
              {habit ? 'Update the details for this habit.' : 'Assign a new habit to an employee to track their progress.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="employeeId" className="text-right">
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
              <Label htmlFor="name" className="text-right">
                Habit Name
              </Label>
              <div className="col-span-3">
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => <Input id="name" {...field} placeholder="e.g., Read 30 mins daily" />}
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
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
                  render={({ field }) => <Textarea id="description" {...field} placeholder="Briefly describe the habit..." />}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="goalDays" className="text-right">
                Goal (Days)
              </Label>
              <div className="col-span-3">
                <Controller
                  name="goalDays"
                  control={control}
                  render={({ field }) => <Input id="goalDays" type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} />}
                />
                {errors.goalDays && <p className="text-xs text-destructive mt-1">{errors.goalDays.message}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Start Date
              </Label>
              <div className="col-span-3">
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="startDate"
                      type="date"
                      className="w-auto"
                      value={format(new Date(field.value), 'yyyy-MM-dd')}
                      onChange={e => field.onChange(new Date(e.target.value))}
                    />
                  )}
                />
                {errors.startDate && <p className="text-xs text-destructive mt-1">{errors.startDate.message}</p>}
              </div>
            </div>

          </div>
          <DialogFooter className="pt-4">
            <Button type="submit">Save Habit</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
