
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, PlusCircle } from "lucide-react";
import { mockKras, mockHabits } from '@/lib/data';
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

export default function HabitTrackerPage() {
    const [kras, setKras] = React.useState<KRA[]>([]);
    const [habits, setHabits] = React.useState<Habit[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedEmployee, setSelectedEmployee] = React.useState('all');

    const employees: Employee[] = React.useMemo(() => {
        return Array.from(new Map(kras.map(kra => [kra.employee.id, kra.employee])).values())
            .sort((a,b) => a.name.localeCompare(b.name));
    }, [kras]);

    React.useEffect(() => {
        try {
            const savedKras = sessionStorage.getItem('kraData');
            if (savedKras) {
                setKras(JSON.parse(savedKras, (key, value) => {
                    if (['startDate', 'endDate', 'dueDate'].includes(key) && value) {
                        return new Date(value);
                    }
                    return value;
                }));
            } else {
                setKras(mockKras);
            }

            const savedHabits = sessionStorage.getItem('habitData');
            if (savedHabits) {
                setHabits(JSON.parse(savedHabits, (key, value) => {
                    if (['startDate', 'checkIns'].includes(key) && Array.isArray(value)) {
                        return value.map(d => new Date(d));
                    }
                     if (key === 'startDate' && value) {
                        return new Date(value);
                    }
                    return value;
                }));
            } else {
                setHabits(mockHabits);
            }

        } catch (error) {
            console.error("Failed to parse data from sessionStorage", error);
            setKras(mockKras);
            setHabits(mockHabits);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        if (!loading) {
            sessionStorage.setItem('habitData', JSON.stringify(habits));
        }
    }, [habits, loading]);

    const handleSaveHabit = (habitToSave: Habit) => {
        setHabits((prevHabits) => {
            const exists = prevHabits.some(h => h.id === habitToSave.id);
            if (exists) {
                return prevHabits.map((habit) => (habit.id === habitToSave.id ? habitToSave : habit));
            }
            return [...prevHabits, habitToSave];
        });
    };

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
