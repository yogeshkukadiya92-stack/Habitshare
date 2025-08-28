
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck } from "lucide-react";
import { mockKras, mockAttendances } from '@/lib/data';
import type { Employee, KRA, Attendance } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AttendanceTable } from '@/components/attendance-table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';

export default function AttendancePage() {
    const [kras, setKras] = React.useState<KRA[]>([]);
    const [attendances, setAttendances] = React.useState<Attendance[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());

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
                                View and mark daily attendance for all employees.
                            </CardDescription>
                        </div>
                    </div>
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
