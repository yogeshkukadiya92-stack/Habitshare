
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
import type { Expense, Employee, ExpenseStatus, ExpenseType } from '@/lib/types';
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

const expenseClaimSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required.'),
  date: z.date(),
  expenseType: z.enum(['Travel', 'Food', 'Accommodation']),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  distanceInKm: z.number().nullable().optional(),
  ratePerKm: z.number().nullable().optional(),
  amount: z.number().nullable().optional(),
  status: z.enum(['Pending', 'Approved', 'Rejected', 'Paid']),
}).refine(data => {
    if (data.expenseType === 'Travel') {
        return data.distanceInKm != null && data.distanceInKm > 0 && data.ratePerKm != null && data.ratePerKm > 0;
    }
    return true;
}, {
    message: 'Distance and Rate are required for travel expenses.',
    path: ['distanceInKm']
}).refine(data => {
     if (data.expenseType === 'Food' || data.expenseType === 'Accommodation') {
        return data.amount != null && data.amount > 0;
    }
    return true;
}, {
    message: 'Amount is required for this expense type.',
    path: ['amount']
});


type ExpenseClaimFormValues = z.infer<typeof expenseClaimSchema>;

interface AddExpenseClaimDialogProps {
  children: React.ReactNode;
  expense?: Expense;
  onSave?: (expense: Expense) => void;
  employees: Employee[];
}

export function AddExpenseClaimDialog({ children, expense, onSave, employees }: AddExpenseClaimDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [employeeComboboxOpen, setEmployeeComboboxOpen] = React.useState(false)
  
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ExpenseClaimFormValues>({
    resolver: zodResolver(expenseClaimSchema),
    defaultValues: {
      employeeId: expense?.employee.id || '',
      date: expense?.date || new Date(),
      expenseType: expense?.expenseType || 'Travel',
      description: expense?.description || '',
      distanceInKm: expense?.distanceInKm || null,
      ratePerKm: expense?.ratePerKm || 15, // Default rate
      amount: expense?.amount || null,
      status: expense?.status || 'Pending',
    },
  });

  const expenseType = watch('expenseType');

  React.useEffect(() => {
    if (open) {
      reset({
        employeeId: expense?.employee.id || '',
        date: expense?.date ? new Date(expense.date) : new Date(),
        expenseType: expense?.expenseType || 'Travel',
        description: expense?.description || '',
        distanceInKm: expense?.distanceInKm || null,
        ratePerKm: expense?.ratePerKm || 15,
        amount: expense?.amount || null,
        status: expense?.status || 'Pending',
      });
    }
  }, [open, expense, reset]);


  const onSubmit = (data: ExpenseClaimFormValues) => {
    const selectedEmployee = employees.find(e => e.id === data.employeeId);
    if (!selectedEmployee) {
        toast({ title: "Error", description: "Selected employee not found.", variant: 'destructive' });
        return;
    }

    let totalAmount = 0;
    if(data.expenseType === 'Travel' && data.distanceInKm && data.ratePerKm){
        totalAmount = data.distanceInKm * data.ratePerKm;
    } else if (data.amount) {
        totalAmount = data.amount;
    }
    
    const newExpense: Expense = {
      id: expense?.id || uuidv4(),
      employee: selectedEmployee,
      date: data.date,
      expenseType: data.expenseType,
      description: data.description,
      distanceInKm: data.distanceInKm,
      ratePerKm: data.ratePerKm,
      amount: data.amount,
      totalAmount: totalAmount,
      status: data.status,
    };
    onSave?.(newExpense);
    toast({
      title: expense ? 'Expense Claim Updated' : 'Expense Claim Submitted',
      description: `The claim for ${selectedEmployee.name} has been saved.`,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{expense ? 'Edit Expense Claim' : 'New Expense Claim'}</DialogTitle>
            <DialogDescription>
              {expense ? 'Update the details for this expense claim.' : 'Fill in the details for a new expense claim.'}
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
                <Label htmlFor="date" className="text-right">
                    Date
                </Label>
                <div className="col-span-3">
                    <Controller
                        name="date"
                        control={control}
                        render={({ field }) => (
                            <Input 
                                id="date"
                                type="date"
                                className='w-auto'
                                value={format(new Date(field.value), 'yyyy-MM-dd')}
                                onChange={e => field.onChange(new Date(e.target.value))}
                            />
                        )}
                    />
                    {errors.date && <p className="text-xs text-destructive mt-1">{errors.date.message}</p>}
                </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expenseType" className="text-right">
                Expense Type
              </Label>
              <div className="col-span-3">
                 <Controller
                    name="expenseType"
                    control={control}
                    render={({ field }) => (
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select expense type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Travel">Travel</SelectItem>
                                <SelectItem value="Food">Food</SelectItem>
                                <SelectItem value="Accommodation">Accommodation</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                 {errors.expenseType && <p className="text-xs text-destructive mt-1">{errors.expenseType.message}</p>}
              </div>
            </div>
            
            {expenseType === 'Travel' && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">
                        Travel Details
                    </Label>
                    <div className="col-span-3 grid grid-cols-2 gap-2">
                        <div>
                            <Controller
                                name="distanceInKm"
                                control={control}
                                render={({ field }) => (
                                    <Input 
                                        {...field}
                                        type="number" 
                                        placeholder="Distance (km)"
                                        value={field.value ?? ''}
                                        onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                    />
                                )}
                            />
                            {errors.distanceInKm && <p className="text-xs text-destructive mt-1">{errors.distanceInKm.message}</p>}
                        </div>
                        <div>
                            <Controller
                                name="ratePerKm"
                                control={control}
                                render={({ field }) => (
                                    <Input 
                                        {...field}
                                        type="number" 
                                        placeholder="Rate per km"
                                        value={field.value ?? ''}
                                        onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                    />
                                )}
                            />
                            {errors.ratePerKm && <p className="text-xs text-destructive mt-1">{errors.ratePerKm.message}</p>}
                        </div>
                    </div>
                </div>
            )}

            {(expenseType === 'Food' || expenseType === 'Accommodation') && (
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">
                        Amount
                    </Label>
                    <div className="col-span-3">
                        <Controller
                            name="amount"
                            control={control}
                            render={({ field }) => (
                                <Input 
                                    id="amount"
                                    type="number" 
                                    placeholder="Total amount"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                />
                            )}
                        />
                        {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
                    </div>
                 </div>
            )}

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Description
              </Label>
              <div className="col-span-3">
                <Controller
                    name="description"
                    control={control}
                    render={({ field }) => <Textarea id="description" {...field} rows={3} placeholder="Provide a brief description for the expense..."/>}
                />
                 {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
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
                                <SelectItem value="Paid">Paid</SelectItem>
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
