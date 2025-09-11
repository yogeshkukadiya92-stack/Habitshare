

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Upload, Download, TrendingUp } from "lucide-react";
import type { Employee, KRA, Attendance, AttendanceStatus } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AttendanceTable } from '@/components/attendance-table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, parseISO, getYear, getMonth, setYear, setMonth } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth-provider';
import { useDataStore } from '@/hooks/use-data-store';


interface MonthlyStat {
    employee: Employee;
    name: string;
    present: number;
    absent: number;
    halfDay: number;
    attendancePercentage: number;
}

export default function AttendancePage() {
    const { employees, attendances, loading, handleSaveAttendance } = useDataStore();
    const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const { getPermission } = useAuth();
    const pagePermission = getPermission('attendance');

    const [selectedYear, setSelectedYear] = React.useState<number>(getYear(new Date()));
    const [selectedMonth, setSelectedMonth] = React.useState<number>(getMonth(new Date()));

    const handleExport = () => {
        const dataToExport = attendances.map(a => ({
            'Employee ID': a.employee.id,
            'Employee Name': a.employee.name,
            'Date': format(new Date(a.date), 'yyyy-MM-dd'),
            'Status': a.status
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
        XLSX.writeFile(workbook, `AttendanceData_${format(new Date(), 'yyyyMMdd')}.xlsx`);
        toast({ title: "Export Successful", description: "Attendance data has been exported." });
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

                const importedAttendances: Attendance[] = json.map((row, index) => {
                    const employeeId = row['Employee ID'];
                    const employee = employees.find(emp => emp.id === employeeId);
                    if (!employee) {
                        throw new Error(`Row ${index + 2}: Employee with ID "${employeeId}" not found.`);
                    }

                    const dateStr = row['Date'];
                    const date = new Date(dateStr);
                    if(isNaN(date.getTime())){
                        throw new Error(`Row ${index + 2}: Invalid date format for "${dateStr}". Use YYYY-MM-DD.`);
                    }

                    const status = row['Status'] as AttendanceStatus;
                     if (!['Present', 'Absent', 'Half-day'].includes(status)) {
                        throw new Error(`Row ${index + 2}: Invalid status "${status}".`);
                    }

                    return {
                        id: `${employeeId}-${format(date, 'yyyy-MM-dd')}`, // unique id
                        employee: employee,
                        date: date,
                        status: status
                    };
                });

                importedAttendances.forEach(handleSaveAttendance);
                toast({ title: "Import Successful", description: `${json.length} records have been imported.` });

            } catch(error: any) {
                toast({ title: "Import Failed", description: error.message, variant: 'destructive' });
            } finally {
                // Reset file input
                if(fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const monthlyStats: MonthlyStat[] = React.useMemo(() => {
        const stats: MonthlyStat[] = employees.map(emp => ({
            employee: emp,
            name: emp.name,
            present: 0,
            absent: 0,
            halfDay: 0,
            attendancePercentage: 0,
        }));

        const monthAttendances = attendances.filter(a => getYear(a.date) === selectedYear && getMonth(a.date) === selectedMonth);

        monthAttendances.forEach(a => {
            const stat = stats.find(s => s.employee.id === a.employee.id);
            if (stat) {
                if (a.status === 'Present') stat.present += 1;
                else if (a.status === 'Absent') stat.absent += 1;
                else if (a.status === 'Half-day') stat.halfDay += 1;
            }
        });
        
        stats.forEach(stat => {
            const totalDays = stat.present + stat.absent + stat.halfDay;
            if(totalDays > 0) {
                 const presentEquivalent = stat.present + (stat.halfDay * 0.5);
                 stat.attendancePercentage = Math.round((presentEquivalent / totalDays) * 100);
            }
        });
        return stats;
    }, [employees, attendances, selectedYear, selectedMonth]);

    const { availableYears, availableMonths } = React.useMemo(() => {
        const years = new Set<number>();
        attendances.forEach(att => {
            years.add(getYear(new Date(att.date)));
        });
        const monthMap = [
            'January', 'February', 'March', 'April', 'May', 'June', 
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return {
            availableYears: Array.from(years).sort((a,b) => b - a),
            availableMonths: monthMap
        };
    }, [attendances]);
    
    const topPerformers = [...monthlyStats].sort((a,b) => b.attendancePercentage - a.attendancePercentage).slice(0, 5);
    const bottomPerformers = [...monthlyStats].sort((a,b) => a.attendancePercentage - b.attendancePercentage).slice(0, 5);


    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold">Attendance Management</h1>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <div className='flex items-center gap-4'>
                        <UserCheck className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>Daily Attendance</CardTitle>
                            <CardDescription>
                                View, mark, import, and export daily attendance for all employees.
                            </CardDescription>
                        </div>
                    </div>
                    <div className='flex items-center gap-2'>
                        {pagePermission === 'download' && (
                            <>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImport}
                                    className="hidden"
                                    accept=".xlsx, .xls"
                                />
                                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Import
                                </Button>
                                <Button variant="outline" onClick={handleExport}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Export
                                </Button>
                            </>
                        )}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[240px] justify-start text-left font-normal",
                                    !selectedDate && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => {
                                    const newDate = date || new Date();
                                    setSelectedDate(newDate);
                                    setSelectedYear(getYear(newDate));
                                    setSelectedMonth(getMonth(newDate));
                                }}
                                initialFocus
                                />
                            </PopoverContent>
                        </Popover>
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
                        <AttendanceTable 
                            employees={employees}
                            attendances={attendances}
                            selectedDate={selectedDate}
                            onSave={handleSaveAttendance}
                            canEdit={pagePermission === 'edit' || pagePermission === 'download'}
                        />
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                            <TrendingUp className="h-8 w-8 text-primary" />
                             <div>
                                <CardTitle>Monthly Attendance Dashboard</CardTitle>
                                <CardDescription>
                                    An overview of employee attendance for the selected month.
                                </CardDescription>
                            </div>
                        </div>
                        <div className='flex items-center gap-2'>
                             <Select value={String(selectedMonth)} onValueChange={(value) => setSelectedMonth(Number(value))}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableMonths.map((month, index) => (
                                        <SelectItem key={index} value={String(index)}>{month}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableYears.map(year => (
                                        <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                     {loading ? (
                         <Skeleton className="h-96 w-full" />
                    ) : (
                    <div className='grid grid-cols-3 gap-6'>
                        <div className='col-span-2'>
                           <ChartContainer config={{}} className="h-[400px] w-full">
                                <ResponsiveContainer>
                                    <BarChart data={monthlyStats} layout="vertical" margin={{ left: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{fill: 'hsl(var(--muted))'}}
                                        content={<ChartTooltipContent indicator="dot" />}
                                    />
                                    <Legend />
                                    <Bar dataKey="present" name="Present" stackId="a" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="halfDay" name="Half-day" stackId="a" fill="hsl(var(--chart-4))" />
                                    <Bar dataKey="absent" name="Absent" stackId="a" fill="hsl(var(--chart-5))" radius={[4, 0, 0, 4]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>
                        <div className='col-span-1 space-y-4'>
                            <div>
                                <h3 className='font-semibold mb-2'>Top 5 Performers</h3>
                                <div className='space-y-2'>
                                    {topPerformers.map(p => (
                                        <div key={p.employee.id} className='flex items-center justify-between p-2 rounded-md bg-muted/50'>
                                            <div className='flex items-center gap-2'>
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={p.employee.avatarUrl} alt={p.employee.name} />
                                                    <AvatarFallback>{p.employee.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className='text-sm font-medium'>{p.employee.name}</span>
                                            </div>
                                            <Badge variant="secondary" className='bg-green-100 text-green-800'>{p.attendancePercentage}%</Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                             <div>
                                <h3 className='font-semibold mb-2'>Bottom 5 Performers</h3>
                                 <div className='space-y-2'>
                                    {bottomPerformers.map(p => (
                                        <div key={p.employee.id} className='flex items-center justify-between p-2 rounded-md bg-muted/50'>
                                            <div className='flex items-center gap-2'>
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={p.employee.avatarUrl} alt={p.employee.name} />
                                                    <AvatarFallback>{p.employee.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className='text-sm font-medium'>{p.employee.name}</span>
                                            </div>
                                            <Badge variant="secondary" className='bg-red-100 text-red-800'>{p.attendancePercentage}%</Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
