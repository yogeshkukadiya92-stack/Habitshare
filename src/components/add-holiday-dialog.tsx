
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
import type { Holiday, HolidayType } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format } from 'date-fns';

const holidaySchema = z.object({
  name: z.string().min(3, 'Holiday name must be at least 3 characters.'),
  date: z.date(),
  type: z.enum(['Full Day', 'Half Day']),
});

type HolidayFormValues = z.infer<typeof holidaySchema>;

interface AddHolidayDialogProps {
  children: React.ReactNode;
  holiday?: Holiday;
  onSave: (holiday: Holiday) => void;
}

export function AddHolidayDialog({ children, holiday, onSave }: AddHolidayDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HolidayFormValues>({
    resolver: zodResolver(holidaySchema),
    defaultValues: {
      name: holiday?.name || '',
      date: holiday?.date || new Date(),
      type: holiday?.type || 'Full Day',
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: holiday?.name || '',
        date: holiday?.date ? new Date(holiday.date) : new Date(),
        type: holiday?.type || 'Full Day',
      });
    }
  }, [open, holiday, reset]);


  const onSubmit = (data: HolidayFormValues) => {
    const newHoliday: Holiday = {
      id: holiday?.id || uuidv4(),
      name: data.name,
      date: data.date,
      type: data.type,
    };
    onSave(newHoliday);
    toast({
      title: holiday ? 'Holiday Updated' : 'Holiday Added',
      description: `The holiday "${data.name}" has been saved.`,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{holiday ? 'Edit Holiday' : 'Add New Holiday'}</DialogTitle>
            <DialogDescription>
              {holiday ? 'Update the details for this holiday.' : 'Add a new company-wide holiday to the list.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Holiday Name
              </Label>
              <div className="col-span-3">
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => <Input id="name" {...field} placeholder="e.g., Diwali" />}
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
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
                      className="w-auto"
                      value={format(new Date(field.value), 'yyyy-MM-dd')}
                      onChange={e => field.onChange(new Date(e.target.value))}
                    />
                  )}
                />
                {errors.date && <p className="text-xs text-destructive mt-1">{errors.date.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <div className="col-span-3">
                 <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Full Day">Full Day</SelectItem>
                                <SelectItem value="Half Day">Half Day</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                 {errors.type && <p className="text-xs text-destructive mt-1">{errors.type.message}</p>}
              </div>
            </div>

          </div>
          <DialogFooter className="pt-4">
            <Button type="submit">Save Holiday</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
