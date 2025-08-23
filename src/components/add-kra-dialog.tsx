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
import { Sparkles, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { refineKraTaskDescription } from '@/ai/flows/kra-refinement';
import { useToast } from '@/hooks/use-toast';
import type { KRA, WeeklyScore } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { format, getMonth, getYear } from 'date-fns';

const weeklyScoreSchema = z.object({
  date: z.date(),
  score: z.number().min(0, "Score must be positive").max(100, "Score cannot exceed 100"),
});

const kraSchema = z.object({
  taskDescription: z.string().min(10, 'Task description must be at least 10 characters.'),
  employeeName: z.string().min(2, 'Employee name is required.'),
  target: z.number().positive('Target must be a positive number.').optional().nullable(),
  achieved: z.number().nonnegative('Achieved value must be non-negative.').optional().nullable(),
  score: z.number().min(0).max(100).nullable(),
  weeklyScores: z.array(weeklyScoreSchema).optional(),
}).refine(data => {
    if (data.target && data.achieved && data.achieved > data.target) {
        return false;
    }
    return true;
}, {
    message: 'Achieved value cannot be greater than the target.',
    path: ['achieved'],
});

type KraFormValues = z.infer<typeof kraSchema>;

interface AddKraDialogProps {
  children: React.ReactNode;
  kra?: KRA;
  onSave?: (kra: KRA) => void;
}

export function AddKraDialog({ children, kra, onSave }: AddKraDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isRefining, setIsRefining] = React.useState(false);
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
      employeeName: kra?.employee.name || '',
      target: kra?.target || null,
      achieved: kra?.achieved || null,
      score: kra?.score || null,
      weeklyScores: kra?.weeklyScores || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "weeklyScores",
  });

  const target = watch('target');
  const achieved = watch('achieved');
  const weeklyScores = watch('weeklyScores');

  React.useEffect(() => {
    if (target && achieved !== null && achieved !== undefined) {
      const calculatedScore = Math.round((achieved / target) * 100);
      setValue('score', Math.min(100, calculatedScore), { shouldValidate: true });
    } else if (weeklyScores && weeklyScores.length > 0) {
        const now = new Date();
        const currentMonthScores = weeklyScores
            .filter(ws => getYear(ws.date) === getYear(now) && getMonth(ws.date) === getMonth(now))
            .map(ws => ws.score);

        if (currentMonthScores.length > 0) {
            const avgScore = currentMonthScores.reduce((sum, score) => sum + score, 0) / currentMonthScores.length;
            setValue('score', Math.round(avgScore), { shouldValidate: true });
        } else {
             setValue('score', null);
        }
    } else {
        setValue('score', kra?.score || null);
    }
  }, [target, achieved, setValue, kra, weeklyScores]);

  React.useEffect(() => {
    if (open) {
      reset({
        taskDescription: kra?.taskDescription || '',
        employeeName: kra?.employee.name || '',
        target: kra?.target || null,
        achieved: kra?.achieved || null,
        score: kra?.score || null,
        weeklyScores: kra?.weeklyScores?.map(ws => ({...ws, date: new Date(ws.date)})) || [],
      });
    }
  }, [open, kra, reset]);


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
    const progress = (data.target && data.achieved) ? Math.round((data.achieved / data.target) * 100) : (kra?.progress || 0);

    const newKra: KRA = {
      id: kra?.id || uuidv4(),
      taskDescription: data.taskDescription,
      employee: {
        id: kra?.employee.id || uuidv4(),
        name: data.employeeName,
        avatarUrl: kra?.employee.avatarUrl || `https://placehold.co/32x32.png?text=${data.employeeName.charAt(0)}`,
      },
      progress: Math.min(100, progress),
      status: kra?.status || 'Pending',
      score: data.score,
      startDate: kra?.startDate || new Date(),
      endDate: kra?.endDate || new Date(new Date().setMonth(new Date().getMonth() + 3)),
      target: data.target || undefined,
      achieved: data.achieved || undefined,
      weeklyScores: data.weeklyScores,
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
                  name="employeeName"
                  control={control}
                  render={({ field }) => <Input id="employeeName" {...field} />}
                />
                 {errors.employeeName && <p className="text-xs text-destructive mt-1">{errors.employeeName.message}</p>}
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
                    render={({ field }) => <Textarea id="taskDescription" {...field} rows={4} />}
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
             <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Weekly Scores</Label>
                <div className="col-span-3 space-y-2">
                    {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                        <Controller
                            name={`weeklyScores.${index}.date`}
                            control={control}
                            render={({ field }) => (
                                <Input 
                                    type="date"
                                    value={format(new Date(field.value), 'yyyy-MM-dd')}
                                    onChange={e => field.onChange(new Date(e.target.value))}
                                />
                            )}
                        />
                        <Controller
                            name={`weeklyScores.${index}.score`}
                            control={control}
                            render={({ field }) => (
                                <Input 
                                    type="number"
                                    placeholder="Score"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                />
                            )}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                    ))}
                    <Button type="button" size="sm" variant="outline" onClick={() => append({ date: new Date(), score: 0 })}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Weekly Score
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
               <Label className="text-right">Sales</Label>
               <div className="col-span-3 grid grid-cols-2 gap-2">
                    <div>
                        <Label htmlFor="target" className="text-xs text-muted-foreground">Target</Label>
                        <Controller
                            name="target"
                            control={control}
                             render={({ field }) => (
                                <Input 
                                    id="target" 
                                    type="number" 
                                    {...field} 
                                    value={field.value ?? ''}
                                    onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                    placeholder="e.g. 1500"
                                />
                            )}
                        />
                        {errors.target && <p className="text-xs text-destructive mt-1">{errors.target.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="achieved" className="text-xs text-muted-foreground">Achieved</Label>
                         <Controller
                            name="achieved"
                            control={control}
                             render={({ field }) => (
                                <Input 
                                    id="achieved" 
                                    type="number" 
                                    {...field} 
                                    value={field.value ?? ''}
                                    onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                    placeholder="e.g. 1400"
                                />
                            )}
                        />
                        {errors.achieved && <p className="text-xs text-destructive mt-1">{errors.achieved.message}</p>}
                    </div>
               </div>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="score" className="text-right">
                Monthly Score
              </Label>
              <div className="col-span-3">
                 <Controller
                  name="score"
                  control={control}
                  render={({ field }) => (
                     <Input 
                        id="score" 
                        type="number" 
                        {...field} 
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                        placeholder="Auto-calculated"
                        readOnly
                     />
                  )}
                />
                {errors.score && <p className="text-xs text-destructive mt-1">{errors.score.message}</p>}
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
