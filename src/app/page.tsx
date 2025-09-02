
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
import { mockKras } from '@/lib/data';
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
import { Eye, ShieldCheck, Users, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { ViewSwitcher } from '@/components/view-switcher';
import { EmployeeCard } from '@/components/employee-card';


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
  const [kras, setKras] = React.useState<KRA[]>([]);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedBranch, setSelectedBranch] = React.useState('all');
  const [view, setView] = React.useState<'list' | 'grid'>('list');

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
         const savedBranches = sessionStorage.getItem('branchData');
        if (savedBranches) {
            setBranches(JSON.parse(savedBranches));
        }

        const savedView = localStorage.getItem('employeeView');
        if (savedView === 'grid' || savedView === 'list') {
            setView(savedView);
        }
    } catch (error) {
        console.error("Failed to parse data from sessionStorage", error);
        setKras(mockKras);
    } finally {
        setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!loading) {
        sessionStorage.setItem('kraData', JSON.stringify(kras));
    }
  }, [kras, loading]);


  const handleSaveKra = (kraToSave: KRA) => {
    setKras((prevKras) => {
      const exists = prevKras.some(k => k.id === kraToSave.id);
      if (exists) {
        return prevKras.map((kra) => (kra.id === kraToSave.id ? kraToSave : kra));
      }
      return [...prevKras, kraToSave];
    });
  };

  const { employeeSummary, branchOptions, performanceData } = React.useMemo(() => {
        const employeeMap = new Map<string, { employee: Employee; kras: KRA[] }>();
        const managerIds = new Set(branches.map(b => b.managerId));

        kras.forEach(kra => {
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
            const relevantKras = kras.filter(k => k.marksAchieved !== null && k.weightage !== null && k.weightage > 0);
            const totalWeightage = relevantKras.reduce((sum, kra) => sum + (kra.weightage || 0), 0);
            const totalMarksAchieved = relevantKras.reduce((sum, kra) => sum + (kra.marksAchieved || 0) + (kra.bonus || 0) - (kra.penalty || 0), 0);
            const averagePerformance = totalWeightage > 0 ? Math.round((totalMarksAchieved / totalWeightage) * 100) : 0;
            
            summaryData.push({
                employee,
                kraCount: kras.length,
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

        const allEmployees: Employee[] = Array.from(employeeMap.values()).map(e => e.employee);
        const uniqueBranches = ['all', ...Array.from(new Set(allEmployees.map(e => e.branch).filter(Boolean)))];

        return { employeeSummary: sortedSummary, branchOptions: uniqueBranches, performanceData: sortedPerfData };

    }, [kras, branches]);


  const employees: Employee[] = Array.from(new Map(kras.map(kra => [kra.employee.id, kra.employee])).values());
 
  const filteredEmployeeSummary = selectedBranch === 'all'
        ? employeeSummary
        : employeeSummary.filter(summary => summary.employee.branch === selectedBranch);

  const filteredPerformanceData = selectedBranch === 'all'
        ? performanceData
        : performanceData.filter(data => data.employee.branch === selectedBranch);
    
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
                    <ViewSwitcher view={view} onViewChange={handleViewChange} />
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
                    <AddKraDialog onSave={handleSaveKra} employees={employees}>
                    <Button>Add KRA</Button>
                    </AddKraDialog>
                </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="list" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="list" className='gap-2'><Users /> Employee Overview</TabsTrigger>
                            <TabsTrigger value="performance" className='gap-2'><TrendingUp /> Performance Chart</TabsTrigger>
                        </TabsList>
                        <TabsContent value="list" className="mt-4">
                             {view === 'list' ? (
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
