

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, PlusCircle, Upload, Download } from "lucide-react";
import type { Holiday } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/auth-provider';
import { HolidaysTable } from '@/components/holidays-table';
import { AddHolidayDialog } from '@/components/add-holiday-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getYear, getMonth, format } from 'date-fns';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { useDataStore } from '@/hooks/use-data-store';


export default function HolidaysPage() {
    const { holidays, loading, handleSaveHoliday } = useDataStore();
    const { getPermission } = useAuth();
    const pagePermission = getPermission('holidays');
    const { toast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [selectedYear, setSelectedYear] = React.useState<string>(String(getYear(new Date())));
    const [selectedMonth, setSelectedMonth] = React.useState<string>('all');

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

    const filteredHolidays = React.useMemo(() => {
        return holidays.filter(holiday => {
            const date = new Date(holiday.date);
            const yearMatch = selectedYear === 'all' || getYear(date) === parseInt(selectedYear);
            const monthMatch = selectedMonth === 'all' || getMonth(date) === parseInt(selectedMonth);
            return yearMatch && monthMatch;
        });
    }, [holidays, selectedYear, selectedMonth]);

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
        </div>
    )
}
