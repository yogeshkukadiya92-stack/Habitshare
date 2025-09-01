
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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import type { Recruit, RecruitmentStatus } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format } from 'date-fns';

const recruitSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits.'),
  position: z.string().min(1, 'Position is required.'),
  appliedDate: z.date(),
  status: z.enum(['Applied', 'Screening', 'Interview', 'Offered', 'Hired', 'Rejected']),
  notes: z.string().optional(),
});

type RecruitFormValues = z.infer<typeof recruitSchema>;

interface AddRecruitDialogProps {
  children: React.ReactNode;
  recruit?: Recruit;
  onSave: (recruit: Recruit) => void;
}

export function AddRecruitDialog({ children, recruit, onSave }: AddRecruitDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecruitFormValues>({
    resolver: zodResolver(recruitSchema),
    defaultValues: {
      name: recruit?.name || '',
      email: recruit?.email || '',
      phone: recruit?.phone || '',
      position: recruit?.position || '',
      appliedDate: recruit?.appliedDate || new Date(),
      status: recruit?.status || 'Applied',
      notes: recruit?.notes || '',
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: recruit?.name || '',
        email: recruit?.email || '',
        phone: recruit?.phone || '',
        position: recruit?.position || '',
        appliedDate: recruit?.appliedDate ? new Date(recruit.appliedDate) : new Date(),
        status: recruit?.status || 'Applied',
        notes: recruit?.notes || '',
      });
    }
  }, [open, recruit, reset]);


  const onSubmit = (data: RecruitFormValues) => {
    const newRecruit: Recruit = {
      id: recruit?.id || uuidv4(),
      avatarUrl: recruit?.avatarUrl || `https://placehold.co/32x32.png?text=${data.name.charAt(0)}`,
      ...data,
    };
    onSave(newRecruit);
    toast({
      title: recruit ? 'Candidate Updated' : 'Candidate Added',
      description: `The data for ${data.name} has been saved.`,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{recruit ? 'Edit Candidate Data' : 'Add New Candidate'}</DialogTitle>
            <DialogDescription>
              {recruit ? 'Update the details for this candidate.' : 'Fill in the details for a new candidate.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Full Name
              </Label>
              <div className="col-span-3">
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => <Input id="name" {...field} placeholder="e.g., Sunil Kumar" />}
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
                  render={({ field }) => <Input id="email" type="email" {...field} placeholder="sunil.k@example.com" />}
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
              </div>
            </div>

             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <div className="col-span-3">
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => <Input id="phone" type="tel" {...field} placeholder="9876543210" />}
                />
                {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
              </div>
            </div>

             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="position" className="text-right">
                Position
              </Label>
              <div className="col-span-3">
                <Controller
                  name="position"
                  control={control}
                  render={({ field }) => <Input id="position" {...field} placeholder="e.g., Marketing Head" />}
                />
                {errors.position && <p className="text-xs text-destructive mt-1">{errors.position.message}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="appliedDate" className="text-right">
                Applied On
              </Label>
              <div className="col-span-3">
                <Controller
                  name="appliedDate"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="appliedDate"
                      type="date"
                      className="w-auto"
                      value={format(new Date(field.value), 'yyyy-MM-dd')}
                      onChange={e => field.onChange(new Date(e.target.value))}
                    />
                  )}
                />
                {errors.appliedDate && <p className="text-xs text-destructive mt-1">{errors.appliedDate.message}</p>}
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
                                <SelectItem value="Applied">Applied</SelectItem>
                                <SelectItem value="Screening">Screening</SelectItem>
                                <SelectItem value="Interview">Interview</SelectItem>
                                <SelectItem value="Offered">Offered</SelectItem>
                                <SelectItem value="Hired">Hired</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                 {errors.status && <p className="text-xs text-destructive mt-1">{errors.status.message}</p>}
              </div>
            </div>

             <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right pt-2">
                Notes
              </Label>
              <div className="col-span-3">
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => <Textarea id="notes" {...field} placeholder="Add any notes about the candidate..." />}
                />
              </div>
            </div>

          </div>
          <DialogFooter className="pt-4">
            <Button type="submit">Save Candidate</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
