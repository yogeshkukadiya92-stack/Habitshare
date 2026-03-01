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
import { Eye, ShieldCheck, Users, TrendingUp, PlusCircle, Download, Upload, FileSpreadsheet, Trash2, Mail, Home, Calendar as CalendarIcon, Cake, Phone, Edit, ChevronDown, Fingerprint, Filter, Database, UserPlus, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { ViewSwitcher } from '@/components/view-switcher';
import { EmployeeCard } from '@/components/employee-card';
import { useAuth } from '@/components/auth-provider';
import { AddEmployeeDialog } from '@/components/add-employee-dialog';
import { getYear, getMonth, startOfMonth, endOfMonth, format } from 'date-fns';
import { useDataStore } from '@/hooks/use-data-store';
import { KraTable } from '@/components/kra-table';
import { AddKraDialog } from '@/components/add-kra-dialog';
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
import { EditEmployeeDialog } from '@/components/edit-employee-dialog';
import { cn } from '@/lib/utils';


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
  const [showProfileDetails, setShowProfileDetails] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);
  const [showTools, setShowTools] = React.useState(false);
  
  const { user, currentUser, getPermission } = useAuth();
  const pagePermission = getPermission('employees');
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const currentEmployeeData = React.useMemo(() => {
    return employees.find(e => e.email === user?.email) || currentUser;
  }, [employees, user?.email, currentUser]);

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

        if (pagePermission === 'employee_only' && user) {
            krasToProcess = kras.filter(k => k.employee.email === user.email);
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

    }, [kras, branches, pagePermission, user, selectedYear, selectedMonth]);

 
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

    if (pagePermission === 'employee_only' && currentEmployeeData) {
        return (
            <div className="flex-1 flex flex-col gap-8">
                 <div className='flex items-center justify-between'>
                    <div>
                        <h1 className="text-3xl font-black text-primary">Welcome, {currentEmployeeData.name.split(' ')[0]}!</h1>
                        <p className='text-muted-foreground font-medium'>Here's an overview of your current performance.</p>
                    </div>
                    <EditEmployeeDialog employee={currentEmployeeData} onSave={handleSaveEmployee}>
                        <Button variant="outline" size="sm" className='gap-2 rounded-xl border-primary/20 bg-white/50 backdrop-blur-sm'>
                            <Edit className='h-4 w-4'/> Edit Profile
                        </Button>
                    </EditEmployeeDialog>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card 
                        className='lg:col-span-1 h-fit cursor-pointer transition-all duration-500 overflow-hidden' 
                        onClick={() => setShowProfileDetails(!showProfileDetails)}
                    >
                        <CardHeader className='flex-row items-center justify-between pb-4 bg-gradient-to-br from-primary/10 to-transparent'>
                            <div className='flex items-center gap-4'>
                                <Avatar className='h-16 w-16 border-2 border-white shadow-lg'>
                                    <AvatarImage src={currentEmployeeData.avatarUrl} alt={currentEmployeeData.name} />
                                    <AvatarFallback className='text-xl'>{currentEmployeeData.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className='text-xl'>{currentEmployeeData.name}</CardTitle>
                                    <CardDescription className='font-bold text-primary/70 uppercase tracking-tighter'>{currentEmployeeData.branch || 'No Branch'} Branch</CardDescription>
                                    <div className='flex items-center gap-1 mt-1'>
                                        <Fingerprint className='h-3 w-3 text-muted-foreground' />
                                        <span className='text-[10px] text-muted-foreground font-mono font-bold'>{currentEmployeeData.id}</span>
                                    </div>
                                </div>
                            </div>
                            <div className='bg-primary/10 p-1.5 rounded-full'>
                                <ChevronDown className={cn("h-5 w-5 text-primary transition-transform duration-500", showProfileDetails && "rotate-180")} />
                            </div>
                        </CardHeader>
                        {showProfileDetails && (
                            <CardContent className='text-sm space-y-5 pt-6 border-t mt-0 animate-in fade-in slide-in-from-top-4 duration-500'>
                                <div className='flex items-center gap-4 group'>
                                    <div className='p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors'>
                                        <Mail className="h-4 w-4" />
                                    </div>
                                    <div className='flex flex-col'>
                                        <span className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>Email Address</span>
                                        <span className='font-semibold'>{currentEmployeeData.email || 'Not provided'}</span>
                                    </div>
                                </div>
                                <div className='flex items-start gap-4 group'>
                                    <div className='p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors mt-1'>
                                        <Home className="h-4 w-4" />
                                    </div>
                                    <div className='flex flex-col'>
                                        <span className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>Residence</span>
                                        <span className='font-semibold leading-tight'>{currentEmployeeData.address || 'Not provided'}</span>
                                    </div>
                                </div>
                                <div className='flex items-center gap-4 group'>
                                    <div className='p-2 rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors'>
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <div className='flex flex-col'>
                                        <span className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>Family Emergency Contact</span>
                                        <span className='font-semibold'>{currentEmployeeData.familyMobileNumber || 'Not provided'}</span>
                                    </div>
                                </div>
                                <div className='flex items-center gap-4 group'>
                                    <div className='p-2 rounded-xl bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors'>
                                        <CalendarIcon className="h-4 w-4" />
                                    </div>
                                    <div className='flex flex-col'>
                                        <span className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>Employment Start</span>
                                        <span className='font-semibold'>{currentEmployeeData.joiningDate ? format(new Date(currentEmployeeData.joiningDate), "MMMM d, yyyy") : 'Not provided'}</span>
                                    </div>
                                </div>
                                <div className='flex items-center gap-4 group'>
                                    <div className='p-2 rounded-xl bg-pink-50 text-pink-600 group-hover:bg-pink-600 group-hover:text-white transition-colors'>
                                        <Cake className="h-4 w-4" />
                                    </div>
                                    <div className='flex flex-col'>
                                        <span className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider'>Birth Date</span>
                                        <span className='font-semibold'>{currentEmployeeData.birthDate ? format(new Date(currentEmployeeData.birthDate), "MMMM d, yyyy") : 'Not provided'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    <Card className='lg:col-span-2 shadow-xl border-primary/10'>
                        <CardHeader className='pb-2'>
                            <div className='flex items-center gap-3'>
                                <div className='p-2 rounded-xl bg-primary/10 text-primary'>
                                    <Sparkles className='h-5 w-5'/>
                                </div>
                                <div>
                                    <CardTitle className='text-xl'>My Performance Goals (KRAs)</CardTitle>
                                    <CardDescription>Track and log your weekly achievements here.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className='pt-4'>
                            {loading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-12 w-full rounded-xl" />
                                    <Skeleton className="h-12 w-full rounded-xl" />
                                    <Skeleton className="h-12 w-full rounded-xl" />
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
            </div>
        )
    }

  return (
     <TooltipProvider>
        <div className="flex-1 flex flex-col gap-8">
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-primary">Enterprise Dashboard</h1>
                    <p className='text-muted-foreground font-medium'>Comprehensive organizational oversight and management.</p>
                </div>
                <div className='flex items-center gap-3 bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-primary/10 shadow-lg'>
                    {pagePermission !== 'employee_only' && <ViewSwitcher view={view} onViewChange={handleViewChange} />}
                    <div className='w-px h-6 bg-slate-200 mx-1'/>
                    <Button 
                        variant={showFilters ? "secondary" : "ghost"} 
                        size="sm" 
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn("gap-2 rounded-xl font-bold", showFilters && "bg-primary text-primary-foreground")}
                    >
                        <Filter className="h-4 w-4" /> Filter
                    </Button>
                    <Button 
                        variant={showTools ? "secondary" : "ghost"} 
                        size="sm" 
                        onClick={() => setShowTools(!showTools)}
                        className={cn("gap-2 rounded-xl font-bold", showTools && "bg-slate-800 text-white")}
                    >
                        <Database className="h-4 w-4" /> Data Tools
                    </Button>
                </div>
            </div>

            <Card className='border-none shadow-2xl overflow-visible'>
                <CardHeader className="space-y-6 pb-0">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className='flex items-center gap-4'>
                        <div className='bg-primary/10 p-3 rounded-2xl text-primary shadow-inner'>
                            <Users className='h-8 w-8'/>
                        </div>
                        <div>
                            <CardTitle className='text-2xl'>Resource Management</CardTitle>
                            <CardDescription>
                                Total {filteredEmployeeSummary.length} employees active across all branches.
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {(pagePermission === 'edit' || pagePermission === 'download') && (
                            <AddKraDialog onSave={handleSaveKra} employees={employees}>
                                <Button variant="outline" className="gap-2 rounded-xl border-primary/20 font-bold hover:bg-primary hover:text-white transition-all duration-300">
                                    <PlusCircle className="h-4 w-4" /> Assign KRA
                                </Button>
                            </AddKraDialog>
                        )}

                        {(pagePermission === 'edit' || pagePermission === 'download') && (
                            <AddEmployeeDialog onSave={handleSaveEmployee}>
                                <Button className="gap-2 rounded-xl font-bold shadow-lg shadow-primary/25 hover:scale-105 transition-all">
                                    <UserPlus className="h-4 w-4" /> Add Personnel
                                </Button>
                            </AddEmployeeDialog>
                        )}
                    </div>
                </div>

                {showFilters && (
                    <div className="flex flex-wrap items-center gap-4 p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl border border-white shadow-inner animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className='space-y-1.5'>
                            <label className='text-[10px] font-black text-blue-600 uppercase ml-1'>Report Year</label>
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-[140px] rounded-xl border-none shadow-sm bg-white">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent className='rounded-xl border-none shadow-xl'>
                                    <SelectItem value="all">All Years</SelectItem>
                                    {availableYears.map(year => (
                                        <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='space-y-1.5'>
                            <label className='text-[10px] font-black text-purple-600 uppercase ml-1'>Month</label>
                            <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={selectedYear === 'all'}>
                                <SelectTrigger className="w-[160px] rounded-xl border-none shadow-sm bg-white">
                                    <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent className='rounded-xl border-none shadow-xl'>
                                    <SelectItem value="all">All Months</SelectItem>
                                    {availableMonths.map((month, index) => (
                                        <SelectItem key={index} value={String(index)}>{month}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='space-y-1.5'>
                            <label className='text-[10px] font-black text-indigo-600 uppercase ml-1'>Department</label>
                            {pagePermission !== 'employee_only' && (
                                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                                    <SelectTrigger className="w-[200px] rounded-xl border-none shadow-sm bg-white">
                                        <SelectValue placeholder="Filter by Branch" />
                                    </SelectTrigger>
                                    <SelectContent className='rounded-xl border-none shadow-xl'>
                                        {branchOptions.map(branch => (
                                        <SelectItem key={branch} value={branch}>
                                            {branch === 'all' ? 'All Departments' : `${branch} Dept.`}
                                        </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>
                )}

                {showTools && pagePermission === 'download' && (
                    <div className="flex flex-wrap items-center gap-4 p-5 bg-slate-900 rounded-3xl border-none shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImport}
                            className="hidden"
                            accept=".xlsx, .xls"
                        />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" onClick={handleDownloadSample} className="gap-2 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white hover:text-slate-900 font-bold border-2">
                                    <FileSpreadsheet className="h-4 w-4" /> Download Template
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className='rounded-lg font-bold'>Download Excel Template</TooltipContent>
                        </Tooltip>
                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white hover:text-slate-900 font-bold border-2">
                            <Upload className="h-4 w-4" /> Import Excel
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white hover:text-slate-900 font-bold border-2">
                            <Download className="h-4 w-4" /> Export All Data
                        </Button>
                    </div>
                )}
                </CardHeader>
                <CardContent className='pt-8'>
                    <Tabs defaultValue="list" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 p-1 bg-primary/5 rounded-2xl h-12 mb-8">
                            <TabsTrigger value="list" className='gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg font-bold transition-all duration-500'><Users className="h-4 w-4" /> Employee Directory</TabsTrigger>
                            <TabsTrigger value="performance" className='gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg font-bold transition-all duration-500'><TrendingUp className="h-4 w-4" /> Analytics Visualizer</TabsTrigger>
                        </TabsList>
                        <TabsContent value="list" className="mt-0 focus-visible:outline-none">
                             {selectedEmployeeIds.length > 0 && (
                                <div className="flex items-center justify-between p-4 mb-6 bg-rose-50 border-2 border-rose-100 rounded-2xl animate-in zoom-in-95 duration-300 shadow-lg shadow-rose-100/50">
                                  <span className="text-sm font-black text-rose-700">{selectedEmployeeIds.length} personnel selected for management</span>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="sm" className="gap-2 rounded-xl font-black shadow-xl shadow-rose-200 transition-all hover:scale-105 active:scale-95">
                                        <Trash2 className="h-4 w-4" />
                                        Terminate Selected
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className='rounded-3xl border-none shadow-2xl'>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className='text-2xl font-black text-slate-900'>Confirm Termination?</AlertDialogTitle>
                                        <AlertDialogDescription className='text-base font-medium'>
                                          This will permanently remove {selectedEmployeeIds.length} records and all historical KRA data from the system. This action is irreversible.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter className='mt-6'>
                                        <AlertDialogCancel className='rounded-xl font-bold'>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleBulkDelete} className="bg-rose-600 hover:bg-rose-700 rounded-xl font-black px-8">Confirm Deletion</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                             )}
                             {view === 'list' || pagePermission === 'employee_only' ? (
                                <div className="border border-primary/10 rounded-2xl overflow-hidden bg-white/30 backdrop-blur-sm">
                                    <Table>
                                        <TableHeader className='bg-primary/5'>
                                            <TableRow className='hover:bg-transparent border-primary/10'>
                                                <TableHead className="w-[60px] pl-6">
                                                  <Checkbox 
                                                    checked={selectedEmployeeIds.length === filteredEmployeeSummary.length && filteredEmployeeSummary.length > 0}
                                                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                                    className='rounded-md border-2 border-primary/20 data-[state=checked]:bg-primary'
                                                  />
                                                </TableHead>
                                                <TableHead className='font-black uppercase text-[10px] tracking-widest text-primary/60'>Employee ID</TableHead>
                                                <TableHead className='font-black uppercase text-[10px] tracking-widest text-primary/60'>Identity</TableHead>
                                                <TableHead className='font-black uppercase text-[10px] tracking-widest text-primary/60'>Department</TableHead>
                                                <TableHead className='font-black uppercase text-[10px] tracking-widest text-primary/60 text-center'>KRAs</TableHead>
                                                <TableHead className="w-[250px] font-black uppercase text-[10px] tracking-widest text-primary/60">Performance Metric</TableHead>
                                                <TableHead className='pr-6'><span className="sr-only">Actions</span></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                Array.from({ length: 5 }).map((_, i) => (
                                                <TableRow key={i} className='border-primary/5'>
                                                    <TableCell className='pl-6'><Skeleton className="h-5 w-5 rounded-md" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Skeleton className="h-10 w-10 rounded-full" />
                                                            <Skeleton className="h-4 w-32" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Skeleton className="h-2.5 w-full rounded-full" />
                                                            <Skeleton className="h-4 w-8" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <Skeleton className="h-9 w-24 rounded-xl ml-auto" />
                                                    </TableCell>
                                                </TableRow>
                                                ))
                                            ) : (
                                                filteredEmployeeSummary.map(({ employee, kraCount, averagePerformance }) => (
                                                    <TableRow key={employee.id} className='group hover:bg-primary/5 transition-all border-primary/5'>
                                                        <TableCell className='pl-6'>
                                                          <Checkbox 
                                                            checked={selectedEmployeeIds.includes(employee.id)}
                                                            onCheckedChange={(checked) => handleSelectOne(employee.id, !!checked)}
                                                            className='rounded-md border-2 border-primary/20 data-[state=checked]:bg-primary transition-all group-hover:scale-110'
                                                          />
                                                        </TableCell>
                                                        <TableCell className='font-mono text-xs font-black text-muted-foreground/60'>{employee.id}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-4">
                                                                <Avatar className="h-11 w-11 ring-2 ring-white shadow-md group-hover:ring-primary/20 transition-all">
                                                                <AvatarImage src={employee.avatarUrl} alt={employee.name} data-ai-hint="people" />
                                                                <AvatarFallback className='font-bold bg-slate-100'>{employee.name.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <div className="font-black text-slate-900 group-hover:text-primary transition-colors">{employee.name}</div>
                                                                    {employee.isManager && (
                                                                        <Badge variant="secondary" className="gap-1 px-2 py-0 h-5 mt-1 bg-blue-50 text-blue-700 border-blue-100 rounded-lg">
                                                                            <ShieldCheck className="h-3 w-3" />
                                                                            <span className='text-[9px] font-black uppercase tracking-tighter'>Manager</span>
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className='font-bold text-slate-600'>{employee.branch || 'N/A'}</TableCell>
                                                        <TableCell className='text-center'>
                                                            <div className='bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-slate-600 mx-auto'>
                                                                {kraCount}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <div className='flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden'>
                                                                    <div 
                                                                        className={cn('h-full transition-all duration-1000', 
                                                                            averagePerformance >= 80 ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
                                                                            averagePerformance >= 50 ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                                                                            'bg-gradient-to-r from-rose-400 to-pink-500'
                                                                        )}
                                                                        style={{ width: `${averagePerformance}%` }}
                                                                    />
                                                                </div>
                                                                <span className={cn("text-xs font-black w-10 text-right", 
                                                                    averagePerformance >= 80 ? 'text-green-600' :
                                                                    averagePerformance >= 50 ? 'text-orange-600' :
                                                                    'text-rose-600'
                                                                )}>{averagePerformance}%</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right pr-6">
                                                            <Link href={`/employees/${employee.id}`}>
                                                                <Button variant="outline" size="sm" className='rounded-xl border-primary/20 hover:bg-primary hover:text-white transition-all font-bold'>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    Profile
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
                                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {filteredEmployeeSummary.map((summary) => (
                                        <div key={summary.employee.id} className="relative group perspective-1000">
                                          <div className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                                            <Checkbox 
                                              checked={selectedEmployeeIds.includes(summary.employee.id)}
                                              onCheckedChange={(checked) => handleSelectOne(summary.employee.id, !!checked)}
                                              className="bg-white shadow-xl rounded-lg border-2 border-primary/20 data-[state=checked]:bg-primary h-6 w-6"
                                            />
                                          </div>
                                          <EmployeeCard summary={summary} />
                                        </div>
                                    ))}
                                 </div>
                             )}
                        </TabsContent>
                         <TabsContent value="performance" className="mt-0 focus-visible:outline-none">
                             <Card className='p-8 rounded-3xl border-none shadow-xl bg-white/50 backdrop-blur-md'>
                                <div className="h-[500px]">
                                    {loading ? (
                                        <Skeleton className="h-full w-full rounded-3xl" />
                                    ) : (
                                        <ChartContainer config={{
                                            performance: { label: 'Performance', color: 'hsl(var(--primary))' },
                                        }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={performanceData} layout="vertical" margin={{ left: 40, right: 40, top: 20, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                                                <XAxis type="number" domain={[0, 100]} tickSuffix="%" tick={{fontWeight: 'bold'}} axisLine={false} />
                                                <YAxis dataKey="employee.name" type="category" width={120} tick={{ fontSize: 12, fontWeight: 'black', fill: '#475569' }} axisLine={false} />
                                                <Tooltip
                                                    cursor={{fill: 'rgba(0,0,0,0.03)', radius: 10}}
                                                    content={<ChartTooltipContent 
                                                        formatter={(value) => <span className='font-black text-primary'>{value}%</span>}
                                                        indicator="line" 
                                                    />}
                                                />
                                                <Bar dataKey="performanceScore" name="Performance Score" radius={[0, 10, 10, 0]} barSize={24}>
                                                    {performanceData.map((entry, index) => (
                                                        <Cell 
                                                            key={`cell-${index}`} 
                                                            fill={entry.performanceScore >= 80 ? 'url(#greenGradient)' : entry.performanceScore >= 50 ? 'url(#orangeGradient)' : 'url(#roseGradient)'} 
                                                        />
                                                    ))}
                                                </Bar>
                                                <defs>
                                                    <linearGradient id="greenGradient" x1="0" y1="0" x2="1" y2="0">
                                                        <stop offset="0%" stopColor="#10b981" />
                                                        <stop offset="100%" stopColor="#059669" />
                                                    </linearGradient>
                                                    <linearGradient id="orangeGradient" x1="0" y1="0" x2="1" y2="0">
                                                        <stop offset="0%" stopColor="#f59e0b" />
                                                        <stop offset="100%" stopColor="#d97706" />
                                                    </linearGradient>
                                                    <linearGradient id="roseGradient" x1="0" y1="0" x2="1" y2="0">
                                                        <stop offset="0%" stopColor="#f43f5e" />
                                                        <stop offset="100%" stopColor="#e11d48" />
                                                    </linearGradient>
                                                </defs>
                                            </BarChart>
                                        </ResponsiveContainer>
                                        </ChartContainer>
                                    )}
                                </div>
                             </Card>
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