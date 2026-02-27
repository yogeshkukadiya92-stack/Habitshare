
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import type { Employee, KRA, Holiday, HolidayWithEvents } from '@/lib/types';
import { getMonth, getYear, isSameDay, format, getDate } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Cake, PartyPopper, Briefcase, PlusCircle, Upload, Download, CalendarDays, FileSpreadsheet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDataStore } from '@/hooks/use-data-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HolidaysTable } from '@/components/holidays-table';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddHolidayDialog } from '@/components/add-holiday-dialog';
import * as XLSX from 'xlsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type EventType = 'birthday' | 'anniversary' | 'holiday';

interface CalendarEvent {
    date: Date;
    type: EventType;
    title: string;
    employee?: Employee;
}

const eventConfig: Record<EventType, { className: string, icon: React.ElementType, badgeClass: string }> = {
    birthday: { className: 'event-birthday', icon: Cake, badgeClass: 'bg-pink-100 text-pink-800' },
    anniversary: { className: 'event-anniversary', icon: PartyPopper, badgeClass: 'bg-green-100 text-green-800' },
    holiday: { className: 'event-holiday', icon: Briefcase, badgeClass: 'bg-indigo-100 text-indigo-800' },
};

export default function HRCalendarPage() {
    const { employees, holidays, loading, handleSaveHoliday } = useDataStore();
    const { getPermission } = useAuth();
    const { toast } = useToast();
    
    const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
    const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
    
    const pagePermission = getPermission('holidays');
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [selectedYear, setSelectedYear] = React.useState<string>(String(getYear(new Date())));
    const [selectedMonth, setSelectedMonth] = React.useState<string>('all');

    const calendarEvents: CalendarEvent[] = React.useMemo(() => {
        const events: CalendarEvent[] = [];
        const year = getYear(currentMonth);

        // Employee events
        employees.forEach(emp => {
            if (emp.birthDate) {
                const birthDateThisYear = new Date(year, getMonth(emp.birthDate), getDate(emp.birthDate));
                events.push({ date: birthDateThisYear, type: 'birthday', title: `${emp.name}'s Birthday`, employee: emp });
            }
            if (emp.joiningDate) {
                const anniversaryThisYear = new Date(year, getMonth(emp.joiningDate), getDate(emp.joiningDate));
                if (getYear(anniversaryThisYear) > getYear(emp.joiningDate)) {
                     events.push({ date: anniversaryThisYear, type: 'anniversary', title: `${emp.name}'s Work Anniversary`, employee: emp });
                }
            }
        });

        // Holidays
        holidays.forEach(hol => {
            events.push({ date: new Date(hol.date), type: 'holiday', title: hol.name });
        });
        
        return events;
    }, [employees, holidays, currentMonth]);

    const getModifiers = (date: Date) => {
        const modifiers: Record<string, boolean> = {};
        calendarEvents.forEach(event => {
            if (isSameDay(date, event.date)) {
                modifiers[eventConfig[event.type].className] = true;
            }
        });
        return modifiers;
    };

    const selectedDayEvents = calendarEvents.filter(event => isSameDay(event.date, selectedDate)).sort((a,b) => a.type.localeCompare(b.type));

     const handleDeleteHoliday = (holidayId: string) => {
        // This needs to be implemented in the data store
        console.log("Delete holiday action triggered for", holidayId);
    };

     const { availableYears, availableMonths } = React.useMemo(() => {
        const years = new Set<number>();
        holidays.forEach(att => {
            years.add(getYear(new Date(att.date)));
        });
        if (!years.has(getYear(new Date()))) {
            years.add(getYear(new Date()));
        }
        const monthMap = [
            'January', 'February', 'March', 'April', 'May', 'June', 
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return {
            availableYears: Array.from(years).sort((a,b) => b - a),
            availableMonths: monthMap
        };
    }, [holidays]);

    const filteredHolidays: HolidayWithEvents[] = React.useMemo(() => {
        const employeeEvents: CalendarEvent[] = [];
        employees.forEach(emp => {
             if (emp.birthDate) {
                const birthDate = new Date(emp.birthDate);
                employeeEvents.push({ date: birthDate, type: 'birthday', title: `${emp.name}'s Birthday`, employee: emp });
            }
            if (emp.joiningDate) {
                const joiningDate = new Date(emp.joiningDate);
                 employeeEvents.push({ date: joiningDate, type: 'anniversary', title: `${emp.name}'s Work Anniversary`, employee: emp });
            }
        });

        return holidays
            .filter(holiday => {
                const date = new Date(holiday.date);
                const yearMatch = selectedYear === 'all' || getYear(date) === parseInt(selectedYear);
                const monthMatch = selectedMonth === 'all' || getMonth(date) === parseInt(selectedMonth);
                return yearMatch && monthMatch;
            })
            .map(holiday => {
                const holidayDate = new Date(holiday.date);
                const otherEvents = employeeEvents
                    .filter(event => 
                        getMonth(event.date) === getMonth(holidayDate) && 
                        getDate(event.date) === getDate(holidayDate)
                    )
                    .map(e => e.title);
                return { ...holiday, otherEvents };
            });
    }, [holidays, employees, selectedYear, selectedMonth]);

    const handleExport = () => {
        const dataToExport = holidays.map(h => ({
            'Name': h.name,
            'Date': format(new Date(h.date), 'yyyy-MM-dd'),
            'Type': h.type
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Holidays');
        XLSX.writeFile(workbook, `HolidayData_${selectedYear}.xlsx`);
        toast({ title: "Export Successful", description: "Holiday data has been exported." });
    };

    const handleDownloadSample = () => {
        const sampleData = [
            {
                'Name': 'Diwali',
                'Date': '2024-11-01',
                'Type': 'Full Day'
            }
        ];
        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample_Holidays');
        XLSX.writeFile(workbook, 'Sample_Holidays_Template.xlsx');
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

                const importedHolidays: Holiday[] = json.map((row, index) => {
                     const dateStr = row['Date'];
                     const date = new Date(dateStr);
                     if(isNaN(date.getTime())){
                        throw new Error(`Row ${index + 2}: Invalid date format for "${dateStr}". Use YYYY-MM-DD.`);
                    }

                    const type = row['Type'];
                    if (!['Full Day', 'Half Day'].includes(type)) {
                        throw new Error(`Row ${index + 2}: Invalid type "${type}". Use 'Full Day' or 'Half Day'.`);
                    }

                    return {
                        id: `${row['Name']}-${format(date, 'yyyy-MM-dd')}`, // unique id
                        name: row['Name'],
                        date: date,
                        type: type,
                    };
                });
                
                importedHolidays.forEach(handleSaveHoliday);

                toast({ title: "Import Successful", description: `${json.length} holidays have been imported.` });

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
            <h1 className="text-2xl font-semibold">Calendar & Holidays</h1>
            <Tabs defaultValue="calendar">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="calendar">Event Calendar</TabsTrigger>
                    <TabsTrigger value="holidays">Holiday List</TabsTrigger>
                </TabsList>
                <TabsContent value="calendar">
                    <Card className='mt-4'>
                        <CardHeader>
                            <CardTitle>Company Event Calendar</CardTitle>
                            <CardDescription>View birthdays, work anniversaries, and holidays all in one place.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-6">
                            <div className='md:col-span-2'>
                                {loading ? (
                                    <Skeleton className='w-full h-[400px]'/>
                                ) : (
                                    <CalendarComponent
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(day) => setSelectedDate(day || new Date())}
                                        month={currentMonth}
                                        onMonthChange={setCurrentMonth}
                                        modifiers={getModifiers}
                                        modifiersClassNames={{
                                            'event-birthday': 'event-birthday',
                                            'event-anniversary': 'event-anniversary',
                                            'event-holiday': 'event-holiday',
                                        }}
                                        className="rounded-md border"
                                    />
                                )}
                            </div>
                            <div className='md:col-span-1'>
                                <h3 className="text-lg font-semibold mb-4">
                                    Events on {format(selectedDate, "MMMM d, yyyy")}
                                </h3>
                                <div className="space-y-3">
                                    {selectedDayEvents.length > 0 ? (
                                        selectedDayEvents.map((event, index) => {
                                            const { icon: Icon, badgeClass } = eventConfig[event.type];
                                            return (
                                                <div key={index} className='flex items-center gap-3 p-3 rounded-md bg-muted/50'>
                                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                                    <div className='flex-1'>
                                                        <p className='font-medium text-sm'>{event.title}</p>
                                                        {event.employee && (
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarImage src={event.employee.avatarUrl} alt={event.employee.name} />
                                                                    <AvatarFallback>{event.employee.name.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                                <span className='text-xs text-muted-foreground'>{event.employee.name}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Badge className={badgeClass}>{event.type}</Badge>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-10">No events for this day.</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="holidays">
                     <Card className='mt-4'>
                        <CardHeader className="flex flex-row items-center justify-between gap-4">
                            <div className='flex items-center gap-4'>
                                <CalendarDays className="h-8 w-8 text-primary" />
                                <div>
                                    <CardTitle>Yearly Holiday List</CardTitle>
                                    <CardDescription>
                                        View all company-wide holidays for the year.
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
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
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableYears.map(year => (
                                            <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {pagePermission === 'download' && (
                                    <>
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
                                        <TooltipContent>Download sample holidays template</TooltipContent>
                                    </Tooltip>
                                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Import
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleExport}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Export
                                    </Button>
                                    </>
                                )}
                                {(pagePermission === 'edit' || pagePermission === 'download') && (
                                    <AddHolidayDialog onSave={handleSaveHoliday}>
                                        <Button>
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Add Holiday
                                        </Button>
                                    </AddHolidayDialog>
                                )}
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
                                <HolidaysTable
                                    holidays={filteredHolidays}
                                    onSave={handleSaveHoliday}
                                    onDelete={handleDeleteHoliday}
                                    canEdit={pagePermission === 'edit' || pagePermission === 'download'}
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
     </TooltipProvider>
    )
}
