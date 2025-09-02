
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo, PlusCircle } from "lucide-react";
import { mockKras, mockRoutineTasks } from '@/lib/data';
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


export default function RoutineTasksPage() {
    const [kras, setKras] = React.useState<KRA[]>([]);
    const [routineTasks, setRoutineTasks] = React.useState<RoutineTask[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [priorityFilter, setPriorityFilter] = React.useState('all');
    const [yearFilter, setYearFilter] = React.useState<string>('all');
    const [monthFilter, setMonthFilter] = React.useState<string>('all');
    const [view, setView] = React.useState<'list' | 'grid'>('list');

    const employees: Employee[] = React.useMemo(() => {
        return Array.from(new Map(kras.map(kra => [kra.employee.id, kra.employee])).values());
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

            const savedTasks = sessionStorage.getItem('routineTasksData');
            if (savedTasks) {
                setRoutineTasks(JSON.parse(savedTasks, (key, value) => {
                    if (['dueDate', 'assignedDate'].includes(key) && value) {
                        return new Date(value);
                    }
                    return value;
                }));
            } else {
                setRoutineTasks(mockRoutineTasks);
            }
             const savedView = localStorage.getItem('routineTaskView');
            if (savedView === 'grid' || savedView === 'list') {
                setView(savedView);
            }

        } catch (error) {
            console.error("Failed to parse data from sessionStorage", error);
            setKras(mockKras);
            setRoutineTasks(mockRoutineTasks);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        if (!loading) {
            sessionStorage.setItem('routineTasksData', JSON.stringify(routineTasks));
        }
    }, [routineTasks, loading]);


    const handleSaveTask = (taskToSave: RoutineTask) => {
        setRoutineTasks((prevTasks) => {
            const exists = prevTasks.some(t => t.id === taskToSave.id);
            if (exists) {
                return prevTasks.map((task) => (task.id === taskToSave.id ? taskToSave : task));
            }
            return [taskToSave, ...prevTasks];
        });
    };

    const handleDeleteTask = (taskId: string) => {
        setRoutineTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
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
                        <AddRoutineTaskDialog employees={employees} onSave={handleSaveTask}>
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
                            onSave={handleSaveTask}
                            onDelete={handleDeleteTask}
                            employees={employees}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                           {filteredTasks.map(task => (
                                <RoutineTaskCard 
                                    key={task.id}
                                    task={task}
                                    onSave={handleSaveTask}
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
