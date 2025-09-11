

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo, PlusCircle } from "lucide-react";
import type { Employee, RoutineTask, KRA } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RoutineTasksTable } from '@/components/routine-tasks-table';
import { AddRoutineTaskDialog } from '@/components/add-routine-task-dialog';
import { getMonth, getYear } from 'date-fns';
import { ViewSwitcher } from '@/components/view-switcher';
import { RoutineTaskCard } from '@/components/routine-task-card';
import { useDataStore } from '@/hooks/use-data-store';


export default function RoutineTasksPage() {
    const { employees, routineTasks, loading, handleSaveRoutineTask } = useDataStore();
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [priorityFilter, setPriorityFilter] = React.useState('all');
    const [yearFilter, setYearFilter] = React.useState<string>('all');
    const [monthFilter, setMonthFilter] = React.useState<string>('all');
    const [view, setView] = React.useState<'list' | 'grid'>('list');

    React.useEffect(() => {
        try {
             const savedView = localStorage.getItem('routineTaskView');
            if (savedView === 'grid' || savedView === 'list') {
                setView(savedView);
            }
        } catch (error) {
            console.error("Failed to parse data from localStorage", error);
        }
    }, []);

    const handleDeleteTask = (taskId: string) => {
        // This needs to be implemented in the data store
        console.log("Delete task action triggered for", taskId);
    };

    const { availableYears, availableMonths } = React.useMemo(() => {
        const years = new Set<number>();
        routineTasks.forEach(task => {
            years.add(getYear(new Date(task.dueDate)));
        });
        const monthMap = [
            'January', 'February', 'March', 'April', 'May', 'June', 
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return {
            availableYears: Array.from(years).sort((a,b) => b - a),
            availableMonths: monthMap
        };
    }, [routineTasks]);

    const filteredTasks = React.useMemo(() => {
        return routineTasks.filter(task => {
            const statusMatch = statusFilter === 'all' || task.status === statusFilter;
            const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;
            const yearMatch = yearFilter === 'all' || getYear(new Date(task.dueDate)) === parseInt(yearFilter);
            const monthMatch = monthFilter === 'all' || getMonth(new Date(task.dueDate)) === parseInt(monthFilter);
            return statusMatch && priorityMatch && yearMatch && monthMatch;
        }).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
    }, [routineTasks, statusFilter, priorityFilter, yearFilter, monthFilter]);

    const handleViewChange = (newView: 'list' | 'grid') => {
        setView(newView);
        localStorage.setItem('routineTaskView', newView);
    };

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold">Routine Tasks</h1>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <div className='flex items-center gap-4'>
                        <ListTodo className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>Task Management</CardTitle>
                            <CardDescription>
                                Assign and track daily and weekly routine tasks for all employees.
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ViewSwitcher view={view} onViewChange={handleViewChange} />
                        <Select value={yearFilter} onValueChange={setYearFilter}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Years</SelectItem>
                                {availableYears.map(year => (
                                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         <Select value={monthFilter} onValueChange={setMonthFilter}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Months</SelectItem>
                                {availableMonths.map((month, index) => (
                                    <SelectItem key={index} value={String(index)}>{month}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Filter by Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="To Do">To Do</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                         <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Filter by Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priorities</SelectItem>
                                <SelectItem value="Low">Low</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                            </SelectContent>
                        </Select>
                        <AddRoutineTaskDialog employees={employees} onSave={handleSaveRoutineTask}>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Task
                            </Button>
                        </AddRoutineTaskDialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                         <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                         </div>
                    ) : view === 'list' ? (
                        <RoutineTasksTable 
                            tasks={filteredTasks} 
                            onSave={handleSaveRoutineTask}
                            onDelete={handleDeleteTask}
                            employees={employees}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                           {filteredTasks.map(task => (
                                <RoutineTaskCard 
                                    key={task.id}
                                    task={task}
                                    onSave={handleSaveRoutineTask}
                                    onDelete={handleDeleteTask}
                                    employees={employees}
                                />
                           ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
