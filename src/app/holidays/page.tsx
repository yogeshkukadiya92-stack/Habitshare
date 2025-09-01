
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, PlusCircle } from "lucide-react";
import { mockHolidays } from '@/lib/data';
import type { Holiday } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/auth-provider';
import { HolidaysTable } from '@/components/holidays-table';
import { AddHolidayDialog } from '@/components/add-holiday-dialog';


export default function HolidaysPage() {
    const [holidays, setHolidays] = React.useState<Holiday[]>([]);
    const [loading, setLoading] = React.useState(true);
    const { currentUserRole } = useAuth();
    const isAdmin = currentUserRole === 'Admin';

    React.useEffect(() => {
        try {
            const savedHolidays = sessionStorage.getItem('holidayData');
            if (savedHolidays) {
                setHolidays(JSON.parse(savedHolidays, (key, value) => {
                    if (key === 'date' && value) {
                        return new Date(value);
                    }
                    return value;
                }));
            } else {
                setHolidays(mockHolidays);
            }

        } catch (error) {
            console.error("Failed to parse data from sessionStorage", error);
            setHolidays(mockHolidays);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        if (!loading) {
            sessionStorage.setItem('holidayData', JSON.stringify(holidays));
        }
    }, [holidays, loading]);

    const handleSaveHoliday = (holidayToSave: Holiday) => {
        setHolidays((prevHolidays) => {
            const exists = prevHolidays.some(h => h.id === holidayToSave.id);
            const updatedHolidays = exists 
                ? prevHolidays.map((holiday) => (holiday.id === holidayToSave.id ? holidayToSave : holiday))
                : [...prevHolidays, holidayToSave];
            
            return updatedHolidays.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        });
    };

    const handleDeleteHoliday = (holidayId: string) => {
        setHolidays((prevHolidays) => prevHolidays.filter((holiday) => holiday.id !== holidayId));
    };

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold">Company Holidays</h1>
            <Card>
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
                     {isAdmin && (
                        <AddHolidayDialog onSave={handleSaveHoliday}>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Holiday
                            </Button>
                        </AddHolidayDialog>
                    )}
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
                            holidays={holidays}
                            onSave={handleSaveHoliday}
                            onDelete={handleDeleteHoliday}
                            isAdmin={isAdmin}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
