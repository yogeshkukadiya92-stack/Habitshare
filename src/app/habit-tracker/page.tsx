

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, PlusCircle } from "lucide-react";
import type { Employee, KRA, Habit } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AddHabitDialog } from '@/components/add-habit-dialog';
import { HabitCard } from '@/components/habit-card';
import { useDataStore } from '@/hooks/use-data-store';

export default function HabitTrackerPage() {
    const { employees, habits, loading, handleSaveHabit } = useDataStore();
    const [selectedEmployee, setSelectedEmployee] = React.useState('all');

    const filteredHabits = selectedEmployee === 'all'
        ? habits
        : habits.filter(habit => habit.employee.id === selectedEmployee);

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold">Habit Tracker</h1>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <div className='flex items-center gap-4'>
                        <Target className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>Employee Habits</CardTitle>
                            <CardDescription>
                                Track and encourage positive habits among employees.
                            </CardDescription>
                        </div>
                    </div>
                    <div className='flex items-center gap-2'>
                        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by Employee" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Employees</SelectItem>
                                {employees.map(employee => (
                                <SelectItem key={employee.id} value={employee.id}>
                                    {employee.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         <AddHabitDialog employees={employees} onSave={handleSaveHabit}>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Habit
                            </Button>
                        </AddHabitDialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
                         </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredHabits.length > 0 ? (
                                filteredHabits.map(habit => (
                                    <HabitCard key={habit.id} habit={habit} onSave={handleSaveHabit} />
                                ))
                            ) : (
                                <div className="col-span-full text-center text-muted-foreground py-10">
                                    No habits found for the selected employee.
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
