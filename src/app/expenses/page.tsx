
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReceiptText, PlusCircle, TrendingUp, Download, Upload, FileSpreadsheet } from "lucide-react";
import type { Employee, Expense, KRA, ExpenseType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ExpenseClaimsTable } from '@/components/expense-claims-table';
import { AddExpenseClaimDialog } from '@/components/add-expense-claim-dialog';
import { format, getMonth, getYear } from 'date-fns';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ViewSwitcher } from '@/components/view-switcher';
import { ExpenseCard } from '@/components/expense-card';
import { useDataStore } from '@/hooks/use-data-store';
import * as XLSX from 'xlsx';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


interface MonthlyExpenseStat {
    employee: Employee;
    name: string;
    totalAmount: number;
}

interface ExpenseTypeStat {
    type: ExpenseType;
    totalAmount: number;
    fill: string;
}

const TYPE_COLORS: Record<ExpenseType, string> = {
    'Travel': 'hsl(var(--chart-1))',
    'Food': 'hsl(var(--chart-2))',
    'Accommodation': 'hsl(var(--chart-3))',
}

export default function ExpenseManagementPage() {
    const { employees, expenses, loading, handleSaveExpense, handleDeleteExpense } = useDataStore();
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [yearFilter, setYearFilter] = React.useState<string>(String(getYear(new Date())));
    const [monthFilter, setMonthFilter] = React.useState<string>(String(getMonth(new Date())));
    const [view, setView] = React.useState<'list' | 'grid'>('list');
    const { getPermission } = useAuth();
    const pagePermission = getPermission('expenses');
    const { toast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        try {
            const savedView = localStorage.getItem('expenseView');
            if (savedView === 'grid' || savedView === 'list') {
                setView(savedView);
            }
        } catch (error) {
            console.error("Failed to parse data from localStorage", error);
        }
    }, []);

    const { availableYears, availableMonths } = React.useMemo(() => {
        const years = new Set<number>();
        expenses.forEach(exp => {
            years.add(getYear(new Date(exp.date)));
        });
        const monthMap = [
            'January', 'February', 'March', 'April', 'May', 'June', 
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return {
            availableYears: Array.from(years).sort((a,b) => b - a),
            availableMonths: monthMap
        };
    }, [expenses]);

    const filteredExpenses = React.useMemo(() => {
        return expenses.filter(expense => {
            const statusMatch = statusFilter === 'all' || expense.status === statusFilter;
            const yearMatch = yearFilter === 'all' || getYear(new Date(expense.date)) === parseInt(yearFilter);
            const monthMatch = monthFilter === 'all' || getMonth(new Date(expense.date)) === parseInt(monthFilter);
            return statusMatch && yearMatch && monthMatch;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, statusFilter, yearFilter, monthFilter]);

    const { monthlyEmployeeStats, monthlyTypeStats, topSpenders } = React.useMemo(() => {
        const monthExpenses = expenses.filter(e => {
            const year = parseInt(yearFilter);
            const month = parseInt(monthFilter);
            if(isNaN(year) || isNaN(month)) return false;
            return getYear(e.date) === year && getMonth(e.date) === month;
        });

        const employeeStatsMap = new Map<string, MonthlyExpenseStat>();
        employees.forEach(emp => {
            employeeStatsMap.set(emp.id, { employee: emp, name: emp.name, totalAmount: 0 });
        });

        const typeStatsMap = new Map<ExpenseType, number>([
            ['Travel', 0], ['Food', 0], ['Accommodation', 0]
        ]);

        monthExpenses.forEach(e => {
            if(employeeStatsMap.has(e.employee.id)) {
                employeeStatsMap.get(e.employee.id)!.totalAmount += e.totalAmount;
            }
            if(typeStatsMap.has(e.expenseType)) {
                typeStatsMap.set(e.expenseType, typeStatsMap.get(e.expenseType)! + e.totalAmount);
            }
        });

        const monthlyEmployeeStats = Array.from(employeeStatsMap.values()).filter(s => s.totalAmount > 0);

        const monthlyTypeStats: ExpenseTypeStat[] = Array.from(typeStatsMap.entries()).map(([type, totalAmount]) => ({
            type,
            totalAmount,
            fill: TYPE_COLORS[type]
        })).filter(s => s.totalAmount > 0);
        
        const topSpenders = [...monthlyEmployeeStats].sort((a,b) => b.totalAmount - a.totalAmount).slice(0, 5);
        
        return { monthlyEmployeeStats, monthlyTypeStats, topSpenders };

    }, [expenses, employees, yearFilter, monthFilter]);

     const handleViewChange = (newView: 'list' | 'grid') => {
        setView(newView);
        localStorage.setItem('expenseView', newView);
    };

    const handleExport = () => {
        const dataToExport = expenses.map(e => ({
            'Employee ID': e.employee.id,
            'Employee Name': e.employee.name,
            'Date': format(new Date(e.date), 'yyyy-MM-dd'),
            'Type': e.expenseType,
            'Description': e.description,
            'Total Amount': e.totalAmount,
            'Status': e.status
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');
        XLSX.writeFile(workbook, `ExpensesData_${format(new Date(), 'yyyyMMdd')}.xlsx`);
        toast({ title: "Export Successful", description: "Expense data has been exported." });
    };

    const handleDownloadSample = () => {
        const sampleData = [
            {
                'Employee ID': 'EMP001',
                'Employee Name': 'Rahul Mehta',
                'Date': '2024-03-05',
                'Type': 'Travel',
                'Description': 'Client meeting in Vadodara',
                'Total Amount': 1200,
                'Status': 'Pending'
            }
        ];
        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample_Expenses');
        XLSX.writeFile(workbook, 'Sample_Expenses_Template.xlsx');
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

                const importedExpenses: Expense[] = json.map((row, index) => {
                    const employeeId = row['Employee ID'];
                    const employee = employees.find(emp => emp.id === String(employeeId));
                    if (!employee) {
                        throw new Error(`Row ${index + 2}: Employee with ID "${employeeId}" not found.`);
                    }

                    return {
                        id: `exp-imported-${index}-${Date.now()}`,
                        employee: employee,
                        date: new Date(row['Date']),
                        expenseType: row['Type'] as ExpenseType,
                        description: row['Description'],
                        totalAmount: Number(row['Total Amount']),
                        status: row['Status'] || 'Pending'
                    };
                });

                importedExpenses.forEach(handleSaveExpense);
                toast({ title: "Import Successful", description: `${json.length} expenses imported.` });

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
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold">Expense Management</h1>
            <Card>
                <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className='flex items-center gap-4'>
                        <ReceiptText className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>Expense Claims</CardTitle>
                            <CardDescription>
                                Review and manage all employee expense claims.
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
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Approved">Approved</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                                <SelectItem value="Paid">Paid</SelectItem>
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
                                    <TooltipContent>Download sample expenses template</TooltipContent>
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

                        <AddExpenseClaimDialog employees={employees} onSave={handleSaveExpense}>
                            <Button size="sm">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Claim
                            </Button>
                        </AddExpenseClaimDialog>
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
                        <ExpenseClaimsTable
                            expenses={filteredExpenses} 
                            onSave={handleSaveExpense}
                            onDelete={handleDeleteExpense}
                            employees={employees}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                           {filteredExpenses.map(expense => (
                                <ExpenseCard 
                                    key={expense.id}
                                    expense={expense}
                                    onSave={handleSaveExpense}
                                    onDelete={handleDeleteExpense}
                                    employees={employees}
                                />
                           ))}
                        </div>
                    )}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                            <TrendingUp className="h-8 w-8 text-primary" />
                             <div>
                                <CardTitle>Monthly Expense Dashboard</CardTitle>
                                <CardDescription>
                                     An overview of expenses for {!isNaN(parseInt(monthFilter)) ? `${availableMonths[parseInt(monthFilter)]} ${yearFilter}` : yearFilter}.
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                     {loading ? (
                         <Skeleton className="h-96 w-full" />
                    ) : (
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                        <div className='md:col-span-2'>
                           <ChartContainer config={{}} className="h-[400px] w-full">
                                <ResponsiveContainer>
                                    <BarChart data={monthlyEmployeeStats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tickFormatter={(value) => `₹${(value as number / 1000)}k`}/>
                                    <RechartsTooltip
                                        cursor={{fill: 'hsl(var(--muted))'}}
                                        content={<ChartTooltipContent indicator="dot" formatter={(value) => `₹${(value as number).toLocaleString('en-IN')}`} />}
                                    />
                                    <Bar dataKey="totalAmount" name="Total Expenses" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>
                        <div className='md:col-span-1 space-y-4'>
                             <div>
                                <h3 className='font-semibold mb-2'>Top 5 Spenders</h3>
                                <div className='space-y-2'>
                                    {topSpenders.map(p => (
                                        <div key={p.employee.id} className='flex items-center justify-between p-2 rounded-md bg-muted/50'>
                                            <div className='flex items-center gap-2'>
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={p.employee.avatarUrl} alt={p.employee.name} />
                                                    <AvatarFallback>{p.employee.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className='text-sm font-medium'>{p.employee.name}</span>
                                            </div>
                                            <Badge variant="secondary">₹{p.totalAmount.toLocaleString('en-IN')}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className='font-semibold mb-2'>Expenses by Type</h3>
                                <div className='space-y-2'>
                                    {monthlyTypeStats.map(s => (
                                        <div key={s.type} className='flex items-center justify-between p-2 rounded-md bg-muted/50'>
                                            <div className='flex items-center gap-2'>
                                                <div className='w-2 h-2 rounded-full' style={{ backgroundColor: s.fill }} />
                                                <span className='text-sm font-medium'>{s.type}</span>
                                            </div>
                                            <Badge variant="secondary">₹{s.totalAmount.toLocaleString('en-IN')}</Badge>
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
     </TooltipProvider>
    )
}
