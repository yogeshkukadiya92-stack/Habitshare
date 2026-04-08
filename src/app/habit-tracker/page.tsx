
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, PlusCircle, Download, Upload, FileSpreadsheet } from "lucide-react";
import type { Employee, Habit } from '@/lib/types';
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
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/components/auth-provider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function HabitTrackerPage() {
    const { employees, habits, loading, handleSaveHabit } = useDataStore();
    const [selectedEmployee, setSelectedEmployee] = React.useState('all');
    const { toast } = useToast();
    const { getPermission } = useAuth();
    const pagePermission = getPermission('habit_tracker');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const filteredHabits = selectedEmployee === 'all'
        ? habits
        : habits.filter(habit => habit.employee.id === selectedEmployee);

    const handleExport = () => {
        const dataToExport = habits.map(h => ({
            'Employee ID': h.employee.id,
            'Employee Name': h.employee.name,
            'Habit Name': h.name,
            'Description': h.description,
            'Goal Days': h.goalDays,
            'Start Date': format(new Date(h.startDate), 'yyyy-MM-dd'),
            'Check-in Dates': h.checkIns.map(d => format(new Date(d), 'yyyy-MM-dd')).join(', ')
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Habits');
        XLSX.writeFile(workbook, `HabitData_${format(new Date(), 'yyyyMMdd')}.xlsx`);
        toast({ title: "Export Successful", description: "Habit data has been exported for Google Sheets." });
    };

    const handleDownloadSample = () => {
        const sampleData = [
            {
                'Employee ID': 'EMP001',
                'Employee Name': 'Rahul Mehta',
                'Habit Name': 'Read 30 mins',
                'Description': 'Read a professional development book',
                'Goal Days': 30,
                'Start Date': '2024-03-01',
                'Check-in Dates': '2024-03-01, 2024-03-02'
            }
        ];
        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample_Habits');
        XLSX.writeFile(workbook, 'Sample_HabitTracker_Template.xlsx');
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

                const importedHabits: Habit[] = json.map((row, index) => {
                    const employeeId = String(row['Employee ID']);
                    const employee = employees.find(emp => emp.id === employeeId);
                    if (!employee) {
                        throw new Error(`Row ${index + 2}: Employee with ID "${employeeId}" not found.`);
                    }

                    const checkInStrings = String(row['Check-in Dates'] || '').split(',').filter(Boolean);
                    const checkIns = checkInStrings.map(s => {
                        const d = new Date(s.trim());
                        return isNaN(d.getTime()) ? null : d;
                    }).filter(Boolean) as Date[];

                    return {
                        id: `habit-imported-${Date.now()}-${index}`,
                        employee: employee,
                        name: String(row['Habit Name'] || 'New Habit'),
                        description: String(row['Description'] || ''),
                        goalDays: Number(row['Goal Days']) || 30,
                        startDate: row['Start Date'] ? new Date(row['Start Date']) : new Date(),
                        checkIns: checkIns,
                    };
                });

                importedHabits.forEach(handleSaveHabit);
                toast({ title: "Import Successful", description: `${json.length} habits imported.` });

            } catch(error: any) {
                toast({ title: "Import Failed", description: error.message, variant: 'destructive' });
            } finally {
                if(fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
     <TooltipProvider>
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold">Habit Tracker</h1>
            <Card>
                <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className='flex items-center gap-4'>
                        <Target className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>Employee Habits</CardTitle>
                            <CardDescription>
                                Track and encourage positive habits among employees.
                            </CardDescription>
                        </div>
                    </div>
                    <div className='flex items-center gap-2 flex-wrap'>
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

                        {pagePermission === 'download' && (
                            <div className='flex gap-2'>
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
                                    <TooltipContent>Download sample habits template</TooltipContent>
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

                         <AddHabitDialog employees={employees} onSave={handleSaveHabit}>
                            <Button size="sm">
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
                                    <HabitCard key={habit.id} habit={habit} />
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
     </TooltipProvider>
    )
}
