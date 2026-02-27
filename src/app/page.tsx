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
import type { Employee, KRA, UserRole } from '@/lib/types';
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
import { Eye, ShieldCheck, Users, TrendingUp, PlusCircle, Download, Upload, FileSpreadsheet, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { ViewSwitcher } from '@/components/view-switcher';
import { EmployeeCard } from '@/components/employee-card';
import { useAuth } from '@/components/auth-provider';
import { AddEmployeeDialog } from '@/components/add-employee-dialog';
import { getYear, getMonth, startOfMonth, endOfMonth, format } from 'date-fns';
import { useDataStore } from '@/hooks/use-data-store';
import { KraTable } from '@/components/kra-table';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


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
    handleSaveEmployee,
    handleDeleteMultipleEmployees
  } = useDataStore();
  const [selectedBranch, setSelectedBranch] = React.useState('all');
  const [selectedYear, setSelectedYear] = React.useState<string>('all');
  const [selectedMonth, setSelectedMonth] = React.useState<string>('all');
  const [view, setView] = React.useState<'list' | 'grid'>('list');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = React.useState<string[]>([]);
  const { currentUser, getPermission } = useAuth();
  const pagePermission = getPermission('employees');
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const { employeeSummary, branchOptions, performanceData, availableYears, availableMonths, employeeKras } = React.useMemo(() => {
        let krasToProcess = kras;
        let employeeKras: KRA[] = [];

        if (pagePermission === 'employee_only' && currentUser) {
            krasToProcess = kras.filter(k => k.employee.id === currentUser.id);
            employeeKras = krasToProcess;
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
            availableMonths: monthMap,
            employeeKras
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

    const handleSelectAll = (checked: boolean) => {
      if (checked) {
        setSelectedEmployeeIds(filteredEmployeeSummary.map(s => s.employee.id));
      } else {
        setSelectedEmployeeIds([]);
      }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
      if (checked) {
        setSelectedEmployeeIds(prev => [...prev, id]);
      } else {
        setSelectedEmployeeIds(prev => prev.filter(i => i !== id));
      }
    };

    const handleBulkDelete = () => {
      handleDeleteMultipleEmployees(selectedEmployeeIds);
      setSelectedEmployeeIds([]);
      toast({ title: "Bulk Delete Successful", description: `${selectedEmployeeIds.length} employees removed.` });
    };

    const handleExport = () => {
        const dataToExport = employees.map(e => ({
            'ID': e.id,
            'Name': e.name,
            'Email': e.email,
            'Branch': e.branch || 'N/A',
            'Role': e.role || 'Employee',
            'Joining Date': e.joiningDate ? format(new Date(e.joiningDate), 'yyyy-MM-dd') : 'N/A',
            'Birth Date': e.birthDate ? format(new Date(e.birthDate), 'yyyy-MM-dd') : 'N/A',
            'Address': e.address || 'N/A',
            'Family Contact': e.familyMobileNumber || 'N/A'
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
        XLSX.writeFile(workbook, `EmployeesData_${format(new Date(), 'yyyyMMdd')}.xlsx`);
        toast({ title: "Export Successful", description: "Employee data has been exported for Google Sheets." });
    };

    const handleDownloadSample = () => {
        const sampleData = [
            {
                'ID': 'EMP001',
                'Name': 'Rahul Mehta',
                'Email': 'rahul.mehta@example.com',
                'Branch': 'Sales',
                'Role': 'Employee',
                'Joining Date': '2023-01-15',
                'Birth Date': '1995-05-20',
                'Address': '123 Street, Ahmedabad, Gujarat',
                'Family Contact': '9876543210'
            }
        ];
        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample_Employees');
        XLSX.writeFile(workbook, 'Sample_Employees_Template.xlsx');
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

                const importedEmployees: Employee[] = json.map((row, index) => {
                    return {
                        id: String(row['ID'] || `emp-${Date.now()}-${index}`),
                        name: String(row['Name']),
                        email: String(row['Email']),
                        branch: row['Branch'],
                        role: (row['Role'] as UserRole) || 'Employee',
                        joiningDate: row['Joining Date'] ? new Date(row['Joining Date']) : undefined,
                        birthDate: row['Birth Date'] ? new Date(row['Birth Date']) : undefined,
                        address: row['Address'],
                        familyMobileNumber: String(row['Family Contact'] || ''),
                        avatarUrl: `https://placehold.co/32x32.png?text=${String(row['Name']).charAt(0)}`
                    };
                });

                importedEmployees.forEach(handleSaveEmployee);
                toast({ title: "Import Successful", description: `${json.length} employees imported.` });

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

    if (pagePermission === 'employee_only') {
        return (
            <div className="flex-1 flex flex-col gap-4">
                 <h1 className="text-2xl font-semibold">My Dashboard</h1>
                 <Card>
                    <CardHeader>
                        <CardTitle>My Key Result Areas (KRAs)</CardTitle>
                        <CardDescription>View and track your assigned KRAs.</CardDescription>
                    </CardHeader>
                    <CardContent>
                          {loading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : (
                            <KraTable 
                               kras={employeeKras}
                               employees={employees}
                               onSave={handleSaveKra}
                               onDelete={() => {}}
                            />
                        )}
                    </CardContent>
                 </Card>
            </div>
        )
    }

  return (
     <TooltipProvider>
        <div className="flex-1 flex flex-col gap-4">
            <h1 className="text-2xl font-semibold">Employee Dashboard</h1>
            <Card>
                <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <CardTitle>Employees Overview</CardTitle>
                    <CardDescription>
                        View, manage, and evaluate all employees in the system.
                    </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
                    
                    {pagePermission === 'download' && (
                        <div className="flex gap-2">
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
                                <TooltipContent>Download sample Excel template</TooltipContent>
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

                    {(pagePermission === 'edit' || pagePermission === 'download') && (
                        <AddEmployeeDialog onSave={handleSaveEmployee}>
                            <Button size="sm">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Employee
                            </Button>
                        </AddEmployeeDialog>
                    )}
                </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="list" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="list" className='gap-2'><Users className="h-4 w-4" /> Employee Overview</TabsTrigger>
                            <TabsTrigger value="performance" className='gap-2'><TrendingUp className="h-4 w-4" /> Performance Chart</TabsTrigger>
                        </TabsList>
                        <TabsContent value="list" className="mt-4">
                             {selectedEmployeeIds.length > 0 && (
                                <div className="flex items-center justify-between p-3 mb-4 bg-muted border border-primary/20 rounded-md">
                                  <span className="text-sm font-medium">{selectedEmployeeIds.length} employees selected</span>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="sm" className="gap-2">
                                        <Trash2 className="h-4 w-4" />
                                        Delete Selected
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will permanently delete {selectedEmployeeIds.length} employees and all their associated KRAs.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                             )}
                             {view === 'list' || pagePermission === 'employee_only' ? (
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]">
                                                  <Checkbox 
                                                    checked={selectedEmployeeIds.length === filteredEmployeeSummary.length && filteredEmployeeSummary.length > 0}
                                                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                                  />
                                                </TableHead>
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
                                                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
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
                                                          <Checkbox 
                                                            checked={selectedEmployeeIds.includes(employee.id)}
                                                            onCheckedChange={(checked) => handleSelectOne(employee.id, !!checked)}
                                                          />
                                                        </TableCell>
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
                                        <div key={summary.employee.id} className="relative group">
                                          <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Checkbox 
                                              checked={selectedEmployeeIds.includes(summary.employee.id)}
                                              onCheckedChange={(checked) => handleSelectOne(summary.employee.id, !!checked)}
                                              className="bg-background shadow-md"
                                            />
                                          </div>
                                          <EmployeeCard summary={summary} />
                                        </div>
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
                                            <Bar dataKey="performanceScore" name="Performance" radius={4} fill="hsl(var(--primary))" />
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
