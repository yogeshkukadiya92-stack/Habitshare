
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo, PlusCircle, Download, Upload, FileSpreadsheet } from "lucide-react";
import type { Employee, RoutineTask, KRA, RoutineTaskStatus } from '@/lib/types';
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
import { getMonth, getYear, format } from 'date-fns';
import { ViewSwitcher } from '@/components/view-switcher';
import { RoutineTaskCard } from '@/components/routine-task-card';
import { useDataStore } from '@/hooks/use-data-store';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


export default function RoutineTasksPage() {
    const { employees, routineTasks, loading, handleSaveRoutineTask, handleDeleteRoutineTask } = useDataStore();
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [priorityFilter, setPriorityFilter] = React.useState('all');
    const [yearFilter, setYearFilter] = React.useState<string>('all');
    const [monthFilter, setMonthFilter] = React.useState<string>('all');
    const [view, setView] = React.useState<'list' | 'grid'>('list');
    const { toast } = useToast();
    const { getPermission } = useAuth();
    const pagePermission = getPermission('routine_tasks');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

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

    const handleExport = () => {
        const dataToExport = filteredTasks.map(t => ({
            'Employee ID': t.employee.id,
            'Employee Name': t.employee.name,
            'Title': t.title,
            'Description': t.description,
            'Assigned Date': format(new Date(t.assignedDate), 'yyyy-MM-dd'),
            'Due Date': format(new Date(t.dueDate), 'yyyy-MM-dd'),
            'Status': t.status,
            'Priority': t.priority,
            'Remarks': t.remarks || ''
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'RoutineTasks');
        XLSX.writeFile(workbook, `RoutineTasks_${format(new Date(), 'yyyyMMdd')}.xlsx`);
        toast({ title: "Export Successful", description: "Routine task data has been exported." });
    };

    const handleDownloadSample = () => {
        const sampleData = [
            {
                'Employee ID': 'EMP001',
                'Employee Name': 'Rahul Mehta',
                'Title': 'Weekly Report Submission',
                'Description': 'Prepare and submit the weekly progress report.',
                'Assigned Date': '2024-03-01',
                'Due Date': '2024-03-07',
                'Status': 'To Do',
                'Priority': 'Medium',
                'Remarks': ''
            }
        ];
        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample_Tasks');
        XLSX.writeFile(workbook, 'Sample_RoutineTasks_Template.xlsx');
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet) as any[];

                const importedTasks: RoutineTask[] = json.map((row, index) => {
                    const employeeId = String(row['Employee ID']);
                    const employee = employees.find(emp => emp.id === employeeId);
                    if (!employee) {
                        throw new Error(`Row ${index + 2}: Employee with ID "${employeeId}" not found.`);
                    }

                    return {
                        id: `task-${Date.now()}-${index}`,
                        employee: employee,
                        title: String(row['Title'] || ''),
                        description: String(row['Description'] || ''),
                        assignedDate: row['Assigned Date'] ? new Date(row['Assigned Date']) : new Date(),
                        dueDate: row['Due Date'] ? new Date(row['Due Date']) : new Date(),
                        status: (row['Status'] as RoutineTaskStatus) || 'To Do',
                        priority: (row['Priority'] as any) || 'Medium',
                        remarks: String(row['Remarks'] || '')
                    };
                });

                importedTasks.forEach(handleSaveRoutineTask);
                toast({ title: "Import Successful", description: `${json.length} routine tasks imported.` });

            } catch(error: any) {
                toast({ title: "Import Failed", description: error.message, variant: 'destructive' });
            } finally {
                if(fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
     <TooltipProvider>
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold">Routine Tasks</h1>
            <Card>
                <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className='flex items-center gap-4'>
                        <ListTodo className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>Task Management</CardTitle>
                            <CardDescription>
                                Assign and track daily and weekly routine tasks for all employees.
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
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

                        {pagePermission === 'download' && (
                            <div className="flex gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImport}
                                    className="hidden"
                                    accept=".xlsx, .xls"
                                />
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="sm" onClick={handleDownloadSample}>
                                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                                            Sample
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Download sample tasks template</TooltipContent>
                                </Tooltip>
                                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Import
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleExport}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Export
                                </Button>
                            </div>
                        )}

                        <AddRoutineTaskDialog employees={employees} onSave={handleSaveRoutineTask}>
                            <Button size="sm">
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
                            onDelete={handleDeleteRoutineTask}
                            employees={employees}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                           {filteredTasks.map(task => (
                                <RoutineTaskCard 
                                    key={task.id}
                                    task={task}
                                    onSave={handleSaveRoutineTask}
                                    onDelete={handleDeleteRoutineTask}
                                    employees={employees}
                                />
                           ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
     </TooltipProvider>
    )
}
