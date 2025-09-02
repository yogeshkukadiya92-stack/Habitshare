
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { mockKras, mockHolidays } from '@/lib/data';
import type { Employee, KRA, Holiday } from '@/lib/types';
import { getMonth, getYear, isSameDay, format, getDate } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Cake, PartyPopper, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
    const [kras, setKras] = React.useState<KRA[]>([]);
    const [holidays, setHolidays] = React.useState<Holiday[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
    const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
    
    const employees: Employee[] = React.useMemo(() => {
        return Array.from(new Map(kras.map(kra => [kra.employee.id, kra.employee])).values());
    }, [kras]);

    React.useEffect(() => {
        try {
            const savedKras = sessionStorage.getItem('kraData');
            if (savedKras) {
                setKras(JSON.parse(savedKras, (key, value) => {
                    if (['startDate', 'endDate', 'dueDate', 'joiningDate', 'birthDate'].includes(key) && value) {
                        return new Date(value);
                    }
                    return value;
                }));
            } else {
                setKras(mockKras);
            }
            const savedHolidays = sessionStorage.getItem('holidayData');
             if (savedHolidays) {
                setHolidays(JSON.parse(savedHolidays, (key, value) => key === 'date' ? new Date(value) : value));
            } else {
                setHolidays(mockHolidays);
            }
        } catch (error) {
            console.error("Failed to parse data from sessionStorage", error);
            setKras(mockKras);
            setHolidays(mockHolidays);
        } finally {
            setLoading(false);
        }
    }, []);

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

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold">HR Calendar</h1>
            <Card>
                 <CardHeader>
                    <CardTitle>Company Event Calendar</CardTitle>
                    <CardDescription>View birthdays, work anniversaries, and holidays all in one place.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-6">
                    <div className='md:col-span-2'>
                        {loading ? (
                            <Skeleton className='w-full h-[400px]'/>
                        ) : (
                            <Calendar
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
        </div>
    )
}
