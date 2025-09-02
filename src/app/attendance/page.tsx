
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Upload, Download } from "lucide-react";
import { mockKras, mockAttendances } from '@/lib/data';
import type { Employee, KRA, Attendance, AttendanceStatus } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AttendanceTable } from '@/components/attendance-table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';


export default function AttendancePage() {
    const [kras, setKras] = React.useState<KRA[]>([]);
    const [attendances, setAttendances] = React.useState<Attendance[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const employees: Employee[] = React.useMemo(() => {
        return Array.from(new Map(kras.map(kra => [kra.employee.id, kra.employee])).values())
            .sort((a, b) => a.name.localeCompare(b.name));
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

            const savedAttendances = sessionStorage.getItem('attendanceData');
            if (savedAttendances) {
                setAttendances(JSON.parse(savedAttendances, (key, value) => {
                    if (key === 'date' && value) {
                        return new Date(value);
                    }
                    return value;
                }));
            } else {
                setAttendances(mockAttendances);
            }

        } catch (error) {
            console.error("Failed to parse data from sessionStorage", error);
            setKras(mockKras);
            setAttendances(mockAttendances);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        if (!loading) {
            sessionStorage.setItem('attendanceData', JSON.stringify(attendances));
        }
    }, [attendances, loading]);

    const handleSaveAttendance = (attendanceToSave: Attendance) => {
        setAttendances((prevAttendances) => {
            const exists = prevAttendances.some(
                a => a.employee.id === attendanceToSave.employee.id &&
                format(new Date(a.date), 'yyyy-MM-dd') === format(new Date(attendanceToSave.date), 'yyyy-MM-dd')
            );
            if (exists) {
                return prevAttendances.map((att) =>
                    (att.employee.id === attendanceToSave.employee.id && format(new Date(att.date), 'yyyy-MM-dd') === format(new Date(attendanceToSave.date), 'yyyy-MM-dd'))
                        ? attendanceToSave
                        : att
                );
            }
            return [...prevAttendances, attendanceToSave];
        });
    };

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
                     if (!['Present', 'Absent', 'Half-day', 'On Leave'].includes(status)) {
                        throw new Error(`Row ${index + 2}: Invalid status "${status}".`);
                    }

                    return {
                        id: `${employeeId}-${format(date, 'yyyy-MM-dd')}`, // unique id
                        employee: employee,
                        date: date,
                        status: status
                    };
                });

                // Merge imported data with existing data
                const updatedAttendances = [...attendances];
                importedAttendances.forEach(importedAtt => {
                    const index = updatedAttendances.findIndex(
                        a => a.employee.id === importedAtt.employee.id &&
                             format(new Date(a.date), 'yyyy-MM-dd') === format(new Date(importedAtt.date), 'yyyy-MM-dd')
                    );
                    if (index !== -1) {
                        updatedAttendances[index] = importedAtt; // Update existing
                    } else {
                        updatedAttendances.push(importedAtt); // Add new
                    }
                });

                setAttendances(updatedAttendances);
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

    return (
        <div className="flex flex-col gap-4">
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
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[280px] justify-start text-left font-normal",
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
                                onSelect={(date) => setSelectedDate(date || new Date())}
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
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
