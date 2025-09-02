
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
import type { Employee, UserRole } from '@/lib/types';
import { useAuth } from './auth-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { format } from 'date-fns';

const employeeSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters.'),
    branch: z.string().optional(),
    role: z.custom<UserRole>().optional(),
    address: z.string().optional(),
    joiningDate: z.date().optional(),
    birthDate: z.date().optional(),
    email: z.string().email().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface EditEmployeeDialogProps {
  children: React.ReactNode;
  employee: Employee;
  onSave: (employee: Employee) => void;
}

export function EditEmployeeDialog({ children, employee, onSave }: EditEmployeeDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const { currentUserRole } = useAuth();
  const isAdmin = currentUserRole === 'Admin';

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: employee.name,
        branch: employee.branch || '',
        role: employee.role || 'Employee',
        address: employee.address || '',
        joiningDate: employee.joiningDate ? new Date(employee.joiningDate) : undefined,
        birthDate: employee.birthDate ? new Date(employee.birthDate) : undefined,
        email: employee.email || '',
      });
    }
  }, [open, employee, reset]);


  const onSubmit = (data: EmployeeFormValues) => {
    const updatedEmployee: Employee = {
      ...employee,
      ...data,
      joiningDate: data.joiningDate || employee.joiningDate,
      birthDate: data.birthDate || employee.birthDate,
    };
    onSave(updatedEmployee);
    toast({
      title: 'Employee Updated',
      description: `The details for ${employee.name} have been updated.`,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Employee Details</DialogTitle>
            <DialogDescription>
              Update the information for {employee.name}.
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
                  render={({ field }) => <Input id="name" {...field} />}
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
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
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
