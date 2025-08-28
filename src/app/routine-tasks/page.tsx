
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


export default function RoutineTasksPage() {
    const [kras, setKras] = React.useState<KRA[]>([]);
    const [routineTasks, setRoutineTasks] = React.useState<RoutineTask[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [priorityFilter, setPriorityFilter] = React.useState('all');

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
                    if (['dueDate'].includes(key) && value) {
                        return new Date(value);
                    }
                    return value;
                }));
            } else {
                setRoutineTasks(mockRoutineTasks);
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

    const filteredTasks = React.useMemo(() => {
        return routineTasks.filter(task => {
            const statusMatch = statusFilter === 'all' || task.status === statusFilter;
            const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;
            return statusMatch && priorityMatch;
        });
    }, [routineTasks, statusFilter, priorityFilter]);

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
                    ) : (
                        <RoutineTasksTable 
                            tasks={filteredTasks} 
                            onSave={handleSaveTask}
                            onDelete={handleDeleteTask}
                            employees={employees}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
