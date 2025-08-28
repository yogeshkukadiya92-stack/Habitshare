
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
import type { Leave, Employee, LeaveStatus, LeaveType } from '@/lib/types';
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
import { format } from 'date-fns';

const leaveRequestSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required.'),
  leaveType: z.enum(['Annual', 'Sick', 'Casual', 'Unpaid']),
  startDate: z.date(),
  endDate: z.date(),
  reason: z.string().min(10, "Reason must be at least 10 characters long."),
  status: z.enum(['Pending', 'Approved', 'Rejected']),
}).refine(data => data.endDate >= data.startDate, {
    message: "End date cannot be before start date",
    path: ["endDate"],
});

type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>;

interface AddLeaveRequestDialogProps {
  children: React.ReactNode;
  leave?: Leave;
  onSave?: (leave: Leave) => void;
  employees: Employee[];
}

export function AddLeaveRequestDialog({ children, leave, onSave, employees }: AddLeaveRequestDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [employeeComboboxOpen, setEmployeeComboboxOpen] = React.useState(false)
  
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeaveRequestFormValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      employeeId: leave?.employee.id || '',
      leaveType: leave?.leaveType || 'Annual',
      startDate: leave?.startDate || new Date(),
      endDate: leave?.endDate || new Date(),
      reason: leave?.reason || '',
      status: leave?.status || 'Pending',
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        employeeId: leave?.employee.id || '',
        leaveType: leave?.leaveType || 'Annual',
        startDate: leave?.startDate ? new Date(leave.startDate) : new Date(),
        endDate: leave?.endDate ? new Date(leave.endDate) : new Date(),
        reason: leave?.reason || '',
        status: leave?.status || 'Pending',
      });
    }
  }, [open, leave, reset]);


  const onSubmit = (data: LeaveRequestFormValues) => {
    const selectedEmployee = employees.find(e => e.id === data.employeeId);
    if (!selectedEmployee) {
        toast({ title: "Error", description: "Selected employee not found.", variant: 'destructive' });
        return;
    }
    
    const newLeave: Leave = {
      id: leave?.id || uuidv4(),
      employee: selectedEmployee,
      leaveType: data.leaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      status: data.status,
    };
    onSave?.(newLeave);
    toast({
      title: leave ? 'Leave Request Updated' : 'Leave Request Submitted',
      description: `The request for ${selectedEmployee.name} has been saved.`,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{leave ? 'Edit Leave Request' : 'New Leave Request'}</DialogTitle>
            <DialogDescription>
              {leave ? 'Update the details for this leave request.' : 'Fill in the details for a new leave request.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
            
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
              <Label htmlFor="leaveType" className="text-right">
                Leave Type
              </Label>
              <div className="col-span-3">
                 <Controller
                    name="leaveType"
                    control={control}
                    render={({ field }) => (
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select leave type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Annual">Annual</SelectItem>
                                <SelectItem value="Sick">Sick</SelectItem>
                                <SelectItem value="Casual">Casual</SelectItem>
                                <SelectItem value="Unpaid">Unpaid</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                 {errors.leaveType && <p className="text-xs text-destructive mt-1">{errors.leaveType.message}</p>}
              </div>
            </div>

             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Dates
              </Label>
              <div className="col-span-3 grid grid-cols-2 gap-2">
                 <div>
                    <Controller
                        name="startDate"
                        control={control}
                        render={({ field }) => (
                            <Input 
                                id="startDate"
                                type="date"
                                value={format(new Date(field.value), 'yyyy-MM-dd')}
                                onChange={e => field.onChange(new Date(e.target.value))}
                            />
                        )}
                    />
                    {errors.startDate && <p className="text-xs text-destructive mt-1">{errors.startDate.message}</p>}
                 </div>
                 <div>
                    <Controller
                        name="endDate"
                        control={control}
                        render={({ field }) => (
                            <Input 
                                id="endDate"
                                type="date"
                                value={format(new Date(field.value), 'yyyy-MM-dd')}
                                onChange={e => field.onChange(new Date(e.target.value))}
                            />
                        )}
                    />
                    {errors.endDate && <p className="text-xs text-destructive mt-1">{errors.endDate.message}</p>}
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="reason" className="text-right pt-2">
                Reason
              </Label>
              <div className="col-span-3">
                <Controller
                    name="reason"
                    control={control}
                    render={({ field }) => <Textarea id="reason" {...field} rows={3} placeholder="Provide a brief reason for the leave..."/>}
                />
                 {errors.reason && <p className="text-xs text-destructive mt-1">{errors.reason.message}</p>}
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
                                <SelectValue placeholder="Set status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Approved">Approved</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                 {errors.status && <p className="text-xs text-destructive mt-1">{errors.status.message}</p>}
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
