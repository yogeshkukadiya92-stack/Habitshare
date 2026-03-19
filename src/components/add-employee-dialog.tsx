
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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import type { Employee, UserRole, EmployeePermissions } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { format } from 'date-fns';
import { useAuth } from './auth-provider';
import { useDataStore } from '@/hooks/use-data-store';

const defaultPermissions: EmployeePermissions = {
    employees: 'employee_only',
    kras: 'employee_only',
    routine_tasks: 'view',
    leaves: 'employee_only',
    attendance: 'view',
    expenses: 'employee_only',
    habit_tracker: 'view',
    holidays: 'view',
    recruitment: 'view',
    hr_calendar: 'view',
    settings: 'none',
};

const employeeSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters.'),
    email: z.string().email('Invalid email address.'),
    branch: z.string().optional(),
    role: z.custom<UserRole>(),
    address: z.string().optional(),
    familyMobileNumber: z.string().optional(),
    joiningDate: z.date().optional(),
    birthDate: z.date().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface AddEmployeeDialogProps {
  children: React.ReactNode;
  onSave: (employee: Employee) => void;
}

export function AddEmployeeDialog({ children, onSave }: AddEmployeeDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const { getPermission } = useAuth();
  const { employees } = useDataStore();
  const isAdmin = getPermission('settings') === 'download';


  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
        name: '',
        email: '',
        branch: '',
        role: 'Employee',
        address: '',
        familyMobileNumber: '',
        joiningDate: new Date(),
        birthDate: new Date(),
    }
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: '',
        email: '',
        branch: '',
        role: 'Employee',
        address: '',
        familyMobileNumber: '',
        joiningDate: new Date(),
        birthDate: new Date(),
      });
    }
  }, [open, reset]);


  const onSubmit = (data: EmployeeFormValues) => {
    const normalizedEmail = data.email.toLowerCase().trim();
    const existing = employees.find(e => e.email?.toLowerCase().trim() === normalizedEmail);
    
    if (existing) {
        toast({ title: "Email Already Exists", description: `A profile for ${existing.name} is already in the system with this email.`, variant: "destructive" });
        return;
    }

    const newEmployee: Employee = {
      id: uuidv4(),
      avatarUrl: `https://placehold.co/32x32.png?text=${data.name.charAt(0)}`,
      ...data,
      email: normalizedEmail,
      joiningDate: data.joiningDate,
      birthDate: data.birthDate,
      permissions: defaultPermissions, // Ensure default permissions are assigned
    };
    onSave(newEmployee);
    toast({
      title: 'Employee Added',
      description: `${data.name} has been added to the system.`,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Enter the details for the new employee.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <div className="col-span-3">
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => <Input id="name" {...field} placeholder="Full Name" />}
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                    Email
                </Label>
                <div className="col-span-3">
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => <Input id="email" type="email" {...field} placeholder="employee@example.com" />}
                    />
                     {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
                </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="branch" className="text-right">
                    Branch
                </Label>
                <div className="col-span-3">
                    <Controller
                        name="branch"
                        control={control}
                        render={({ field }) => <Input id="branch" {...field} placeholder="e.g. Engineering" />}
                    />
                </div>
            </div>
            
            {isAdmin && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                        Role
                    </Label>
                    <div className="col-span-3">
                        <Controller
                            name="role"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                        <SelectItem value="Manager">Manager</SelectItem>
                                        <SelectItem value="Employee">Employee</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="address" className="text-right pt-2">
                    Address
                </Label>
                <div className="col-span-3">
                    <Controller
                        name="address"
                        control={control}
                        render={({ field }) => <Textarea id="address" {...field} placeholder="Employee's current address" />}
                    />
                </div>
            </div>

             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="familyMobileNumber" className="text-right">
                    Family Contact
                </Label>
                <div className="col-span-3">
                    <Controller
                        name="familyMobileNumber"
                        control={control}
                        render={({ field }) => <Input id="familyMobileNumber" {...field} placeholder="Family member's number" />}
                    />
                </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="joiningDate" className="text-right">
                    Joining Date
                </Label>
                <div className="col-span-3">
                    <Controller
                        name="joiningDate"
                        control={control}
                        render={({ field }) => (
                            <Input
                            id="joiningDate"
                            type="date"
                            className="w-auto"
                            value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                            onChange={e => field.onChange(new Date(e.target.value))}
                            />
                        )}
                    />
                </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="birthDate" className="text-right">
                    Birth Date
                </Label>
                <div className="col-span-3">
                    <Controller
                        name="birthDate"
                        control={control}
                        render={({ field }) => (
                            <Input
                            id="birthDate"
                            type="date"
                            className="w-auto"
                            value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                            onChange={e => field.onChange(new Date(e.target.value))}
                            />
                        )}
                    />
                </div>
            </div>

          </div>
          <DialogFooter className="pt-4">
            <Button type="submit">Add Employee</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
