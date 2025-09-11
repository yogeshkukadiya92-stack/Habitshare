

'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AddKraDialog } from '@/components/add-kra-dialog';
import type { Employee, KRA, Branch } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Protected } from '@/components/protected';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, ShieldCheck, Users, TrendingUp, PlusCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { ViewSwitcher } from '@/components/view-switcher';
import { EmployeeCard } from '@/components/employee-card';
import { useAuth } from '@/components/auth-provider';
import { AddEmployeeDialog } from '@/components/add-employee-dialog';
import { getYear, getMonth, startOfMonth, endOfMonth } from 'date-fns';
import { useDataStore } from '@/hooks/use-data-store';


interface EmployeeSummary {
    employee: Employee;
    kraCount: number;
    averagePerformance: number;
}

interface EmployeePerformance {
    employee: Employee;
    totalWeightage: number;
    totalMarksAchieved: number;
    performanceScore: number;
}


function DashboardContent() {
  const { 
    kras, 
    branches, 
    loading, 
    employees, 
    handleSaveKra, 
    handleSaveEmployee 
  } = useDataStore();
  const [selectedBranch, setSelectedBranch] = React.useState('all');
  const [selectedYear, setSelectedYear] = React.useState<string>('all');
  const [selectedMonth, setSelectedMonth] = React.useState<string>('all');
  const [view, setView] = React.useState<'list' | 'grid'>('list');
  const { currentUser, getPermission } = useAuth();
  const pagePermission = getPermission('employees');

  React.useEffect(() => {
    try {
        const savedView = localStorage.getItem('employeeView');
        if (savedView === 'grid' || savedView === 'list') {
            setView(savedView);
        }
    } catch (error) {
        console.error("Failed to parse data from localStorage", error);
    }
  }, []);

  const { employeeSummary, branchOptions, performanceData, availableYears, availableMonths } = React.useMemo(() => {
        let krasToProcess = kras;

        if (pagePermission === 'employee_only' && currentUser) {
            krasToProcess = kras.filter(k => k.employee.id === currentUser.id);
        }

        const filteredKrasByDate = krasToProcess.filter(kra => {
            if (selectedYear === 'all' && selectedMonth === 'all') return true;
            
            const year = parseInt(selectedYear);
            const month = parseInt(selectedMonth);
            const kraStart = new Date(kra.startDate);
            const kraEnd = new Date(kra.endDate);

            if (selectedYear !== 'all' && selectedMonth === 'all') {
                return getYear(kraStart) === year || getYear(kraEnd) === year || (getYear(kraStart) < year && getYear(kraEnd) > year);
            }
            if (selectedYear !== 'all' && selectedMonth !== 'all') {
                 const monthStart = startOfMonth(new Date(year, month));
                 const monthEnd = endOfMonth(new Date(year, month));
                 return kraStart <= monthEnd && kraEnd >= monthStart;
            }
            return true;
        });

        const employeeMap = new Map<string, { employee: Employee; kras: KRA[] }>();
        const managerIds = new Set(branches.map(b => b.managerId));

        filteredKrasByDate.forEach(kra => {
            const isManager = managerIds.has(kra.employee.id);
            const employeeWithRole = {...kra.employee, isManager };
            if (!employeeMap.has(kra.employee.id)) {
                employeeMap.set(kra.employee.id, { employee: employeeWithRole, kras: [] });
            }
            employeeMap.get(kra.employee.id)!.kras.push(kra);
        });
        
        const summaryData: EmployeeSummary[] = [];
        const perfData: EmployeePerformance[] = [];

        employeeMap.forEach(({ employee, kras }) => {
             const displayKras = kras.filter(k => !k.id.startsWith('KRA-placeholder-'));
            const relevantKras = displayKras.filter(k => k.marksAchieved !== null && k.weightage !== null && k.weightage > 0);
            const totalWeightage = relevantKras.reduce((sum, kra) => sum + (kra.weightage || 0), 0);
            const totalMarksAchieved = relevantKras.reduce((sum, kra) => sum + (kra.marksAchieved || 0) + (kra.bonus || 0) - (kra.penalty || 0), 0);
            const averagePerformance = totalWeightage > 0 ? Math.round((totalMarksAchieved / totalWeightage) * 100) : 0;
            
            summaryData.push({
                employee,
                kraCount: displayKras.length,
                averagePerformance
            });

             perfData.push({
                employee,
                totalWeightage,
                totalMarksAchieved,
                performanceScore: averagePerformance
            });
        });

        const sortedSummary = summaryData.sort((a, b) => a.employee.name.localeCompare(b.name));
        const sortedPerfData = perfData.sort((a, b) => b.performanceScore - a.performanceScore);

        const allEmployees: Employee[] = Array.from(new Map(kras.map(kra => [kra.employee.id, kra.employee])).values());
        const uniqueBranches = ['all', ...Array.from(new Set(allEmployees.map(e => e.branch).filter(Boolean)))];

        const yearsSet = new Set<number>();
        kras.forEach(kra => {
            yearsSet.add(getYear(new Date(kra.startDate)));
            yearsSet.add(getYear(new Date(kra.endDate)));
        });
         if (!yearsSet.has(getYear(new Date()))) {
            yearsSet.add(getYear(new Date()));
        }

        const monthMap = [
            'January', 'February', 'March', 'April', 'May', 'June', 
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        return { 
            employeeSummary: sortedSummary, 
            branchOptions: uniqueBranches, 
            performanceData: sortedPerfData,
            availableYears: Array.from(yearsSet).sort((a, b) => b - a),
            availableMonths: monthMap
        };

    }, [kras, branches, pagePermission, currentUser, selectedYear, selectedMonth]);

 
  const filteredEmployeeSummary = selectedBranch === 'all'
        ? employeeSummary
        : employeeSummary.filter(summary => summary.employee.branch === selectedBranch);

  const filteredPerformanceData = selectedBranch === 'all'
        ? performanceData
        : performanceData.filter(data => data.employee.branch === data.employee.branch);
    
    const handleViewChange = (newView: 'list' | 'grid') => {
        setView(newView);
        localStorage.setItem('employeeView', newView);
    };

  return (
     <TooltipProvider>
        <div className="flex-1 flex flex-col gap-4">
            <h1 className="text-2xl font-semibold">Employee Management</h1>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Employees Overview</CardTitle>
                    <CardDescription>
                        View, manage, and evaluate all employees in the system.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    {pagePermission !== 'employee_only' && <ViewSwitcher view={view} onViewChange={handleViewChange} />}
                     <Select value={selectedYear} onValueChange={setSelectedYear}>
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
                    <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={selectedYear === 'all'}>
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
                    {pagePermission !== 'employee_only' && (
                        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by Branch" />
                            </SelectTrigger>
                            <SelectContent>
                                {branchOptions.map(branch => (
                                <SelectItem key={branch} value={branch}>
                                    {branch === 'all' ? 'All Branches' : branch}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    {pagePermission === 'edit' || pagePermission === 'download' && (
                        <>
                            <AddEmployeeDialog onSave={handleSaveEmployee}>
                                <Button variant="outline">
                                     <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Employee
                                </Button>
                            </AddEmployeeDialog>
                            <AddKraDialog onSave={handleSaveKra} employees={employees}>
                                <Button>Add KRA</Button>
                            </AddKraDialog>
                        </>
                    )}
                </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="list" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="list" className='gap-2'><Users /> Employee Overview</TabsTrigger>
                            <TabsTrigger value="performance" className='gap-2'><TrendingUp /> Performance Chart</TabsTrigger>
                        </TabsList>
                        <TabsContent value="list" className="mt-4">
                             {view === 'list' || pagePermission === 'employee_only' ? (
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Employee</TableHead>
                                                <TableHead>Branch</TableHead>
                                                <TableHead>KRAs Assigned</TableHead>
                                                <TableHead className="w-[200px]">Avg. Performance</TableHead>
                                                <TableHead><span className="sr-only">Actions</span></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                Array.from({ length: 5 }).map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Skeleton className="h-10 w-10 rounded-full" />
                                                            <Skeleton className="h-4 w-32" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Skeleton className="h-2 w-full" />
                                                            <Skeleton className="h-4 w-8" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Skeleton className="h-9 w-20" />
                                                    </TableCell>
                                                </TableRow>
                                                ))
                                            ) : (
                                                filteredEmployeeSummary.map(({ employee, kraCount, averagePerformance }) => (
                                                    <TableRow key={employee.id}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-10 w-10">
                                                                <AvatarImage src={employee.avatarUrl} alt={employee.name} data-ai-hint="people" />
                                                                <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="font-medium">{employee.name}</div>
                                                                {employee.isManager && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger>
                                                                            <Badge variant="secondary" className="gap-1">
                                                                                <ShieldCheck className="h-3.5 w-3.5" />
                                                                                Manager
                                                                            </Badge>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Branch Manager</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{employee.branch || 'N/A'}</TableCell>
                                                        <TableCell>{kraCount}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Progress value={averagePerformance} className="h-2" />
                                                                <span className="text-xs font-semibold text-muted-foreground">{averagePerformance}%</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Link href={`/employees/${employee.id}`}>
                                                                <Button variant="outline" size="sm">
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View
                                                                </Button>
                                                            </Link>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                             ) : (
                                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {filteredEmployeeSummary.map((summary) => (
                                        <EmployeeCard key={summary.employee.id} summary={summary} />
                                    ))}
                                 </div>
                             )}
                        </TabsContent>
                         <TabsContent value="performance" className="mt-4">
                             <div className="h-[500px]">
                                {loading ? (
                                    <Skeleton className="h-full w-full" />
                                ) : (
                                    <ChartContainer config={{
                                        performance: { label: 'Performance', color: 'hsl(var(--primary))' },
                                    }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={filteredPerformanceData} layout="vertical" margin={{ left: 40, right: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" domain={[0, 100]} tickSuffix="%" />
                                            <YAxis dataKey="employee.name" type="category" width={100} tick={{ fontSize: 12 }} />
                                            <Tooltip
                                                cursor={{fill: 'hsl(var(--muted))'}}
                                                content={<ChartTooltipContent 
                                                    formatter={(value) => `${value}%`}
                                                    indicator="dot" 
                                                />}
                                            />
                                            <Bar dataKey="performanceScore" name="Performance" radius={4} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                    </ChartContainer>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
     </TooltipProvider>
  );
}

export default function Dashboard() {
    return (
        <Protected>
            <DashboardContent />
        </Protected>
    )
}
