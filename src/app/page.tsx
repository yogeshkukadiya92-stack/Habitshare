
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
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, ShieldCheck, Users, TrendingUp, PlusCircle, Download, Upload, FileSpreadsheet, Trash2, Mail, Home, Calendar as CalendarIcon, Cake, Phone, Edit, ChevronDown, Fingerprint, Filter, Database, UserPlus, Sparkles, CalendarDays, Settings2 } from 'lucide-react';
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
import { cn, ensureDate } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

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
  
  // Set default filters to 'all' to ensure all KRAs are counted initially
  const [selectedBranch, setSelectedBranch] = React.useState('all');
  const [selectedYear, setSelectedYear] = React.useState<string>('all');
  const [selectedMonth, setSelectedMonth] = React.useState<string>('all');
  const [view, setView] = React.useState<'list' | 'grid'>('list');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = React.useState<string[]>([]);
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
    const savedView = localStorage.getItem('employeeView');
    if (savedView === 'grid' || savedView === 'list') setView(savedView);
  }, []);

  const { employeeSummary, branchOptions, performanceData, availableYears, availableMonths, filteredKrasForEmployee } = React.useMemo(() => {
        let krasToProcess = kras;

        if (pagePermission === 'employee_only' && user) {
            krasToProcess = kras.filter(k => k.employee?.email === user.email);
        }

        const year = parseInt(selectedYear);
        const month = parseInt(selectedMonth);

        const filteredKrasByDate = krasToProcess.filter(kra => {
            if (selectedYear === 'all' && selectedMonth === 'all') return true;
            
            const kraStart = ensureDate(kra.startDate);
            const kraEnd = ensureDate(kra.endDate);
            
            if (selectedYear !== 'all' && selectedMonth === 'all') {
                return getYear(kraStart) <= year && getYear(kraEnd) >= year;
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

        employees.forEach(emp => {
            const isManager = managerIds.has(emp.id);
            employeeMap.set(emp.id, { employee: { ...emp, isManager }, kras: [] });
        });

        filteredKrasByDate.forEach(kra => {
            if (kra.employee?.id && employeeMap.has(kra.employee.id)) {
                employeeMap.get(kra.employee.id)!.kras.push(kra);
            }
        });
        
        const summaryData: EmployeeSummary[] = [];
        const perfData: EmployeePerformance[] = [];

        employeeMap.forEach(({ employee, kras }) => {
            const displayKras = kras.filter(k => k.id && !k.id.startsWith('KRA-placeholder-'));
            const relevantKras = displayKras.filter(k => k.marksAchieved !== null && k.weightage !== null && k.weightage > 0);
            const totalWeightage = relevantKras.reduce((sum, kra) => sum + (kra.weightage || 0), 0);
            const totalMarksAchieved = relevantKras.reduce((sum, kra) => sum + (kra.marksAchieved || 0) + (kra.bonus || 0) - (kra.penalty || 0), 0);
            const averagePerformance = totalWeightage > 0 ? Math.round((totalMarksAchieved / totalWeightage) * 100) : 0;
            
            summaryData.push({ employee, kraCount: displayKras.length, averagePerformance });
            perfData.push({ employee, totalWeightage, totalMarksAchieved, performanceScore: averagePerformance });
        });

        const uniqueBranches = ['all', ...Array.from(new Set(employees.map(e => e.branch).filter(Boolean) as string[]))];
        const yearsSet = new Set<number>([getYear(new Date())]);
        kras.forEach(k => { 
            yearsSet.add(getYear(ensureDate(k.startDate))); 
            yearsSet.add(getYear(ensureDate(k.endDate))); 
        });

        return { 
            employeeSummary: summaryData.sort((a,b) => a.employee.name.localeCompare(b.employee.name)), 
            branchOptions: uniqueBranches, 
            performanceData: perfData.sort((a,b) => b.performanceScore - a.performanceScore),
            availableYears: Array.from(yearsSet).sort((a, b) => b - a),
            availableMonths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            filteredKrasForEmployee: filteredKrasByDate
        };
    }, [kras, branches, employees, pagePermission, user, selectedYear, selectedMonth]);

  const filteredEmployeeSummary = selectedBranch === 'all'
        ? employeeSummary
        : employeeSummary.filter(s => s.employee.branch === selectedBranch);

    const handleViewChange = (newView: 'list' | 'grid') => {
        setView(newView);
        localStorage.setItem('employeeView', newView);
    };

    const handleSelectAll = (checked: boolean) => setSelectedEmployeeIds(checked ? filteredEmployeeSummary.map(s => s.employee.id) : []);
    const handleSelectOne = (id: string, checked: boolean) => setSelectedEmployeeIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
    const handleBulkDelete = () => { handleDeleteMultipleEmployees(selectedEmployeeIds); setSelectedEmployeeIds([]); toast({ title: "Bulk Delete Successful" }); };

    const handleExport = () => {
        const dataToExport = employees.map(e => ({
            'ID': e.id,
            'Name': e.name,
            'Email': e.email,
            'Branch': e.branch,
            'Role': e.role,
            'Address': e.address,
            'Family Contact': e.familyMobileNumber,
            'Joining Date': e.joiningDate ? format(ensureDate(e.joiningDate), 'yyyy-MM-dd') : '',
            'Birth Date': e.birthDate ? format(ensureDate(e.birthDate), 'yyyy-MM-dd') : '',
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
        XLSX.writeFile(workbook, `Employees_Export_${format(new Date(), 'yyyyMMdd')}.xlsx`);
        toast({ title: "Export Successful", description: "Employee data has been exported." });
    };

    const handleDownloadSample = () => {
        const sampleData = [
            {
                'Name': 'Sunil Kumar',
                'Email': 'sunil.k@example.com',
                'Branch': 'Sales',
                'Role': 'Employee',
                'Address': 'Pune, Maharashtra',
                'Family Contact': '9876543210',
                'Joining Date': '2024-01-01',
                'Birth Date': '1990-05-15',
            }
        ];
        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample_Employees');
        XLSX.writeFile(workbook, 'Employee_Import_Template.xlsx');
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
                const importedEmployees: Employee[] = json.map((row, index) => ({
                    id: row['ID'] || `EMP-${Date.now()}-${index}`,
                    name: String(row['Name'] || ''),
                    email: String(row['Email'] || ''),
                    branch: String(row['Branch'] || ''),
                    role: (row['Role'] as UserRole) || 'Employee',
                    address: String(row['Address'] || ''),
                    familyMobileNumber: String(row['Family Contact'] || ''),
                    joiningDate: row['Joining Date'] ? ensureDate(row['Joining Date']) : undefined,
                    birthDate: row['Birth Date'] ? ensureDate(row['Birth Date']) : undefined,
                    avatarUrl: `https://placehold.co/32x32.png?text=${String(row['Name'] || 'A').charAt(0)}`,
                }));
                importedEmployees.forEach(handleSaveEmployee);
                toast({ title: "Import Successful", description: `${json.length} employees imported.` });
            } catch(error: any) {
                toast({ title: "Import Failed", description: error.message, variant: 'destructive' });
            } finally {
                if(fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    };

    if (pagePermission === 'employee_only' && currentEmployeeData) {
        return (
            <div className="flex flex-col gap-3">
                 <div className='flex items-center justify-between'>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Welcome, {currentEmployeeData.name?.split(' ')[0]}!</h1>
                        <p className='text-[10px] text-slate-500 font-medium'>Performance overview for {selectedMonth === 'all' ? 'All Months' : availableMonths[parseInt(selectedMonth)]} {selectedYear === 'all' ? '' : selectedYear}.</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border shadow-sm h-8">
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-[85px] h-6 text-[10px] border-none shadow-none focus:ring-0 px-1.5">
                                    <CalendarDays className="h-2.5 w-2.5 mr-1 text-slate-400" />
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-[10px]">All Years</SelectItem>
                                    {availableYears.map(y => <SelectItem key={y} value={String(y)} className="text-[10px]">{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Separator orientation="vertical" className="h-3" />
                            <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={selectedYear === 'all'}>
                                <SelectTrigger className="w-[95px] h-6 text-[10px] border-none shadow-none focus:ring-0 px-1.5">
                                    <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-[10px]">All Months</SelectItem>
                                    {availableMonths.map((m, i) => <SelectItem key={i} value={String(i)} className="text-[10px]">{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <EditEmployeeDialog employee={currentEmployeeData} onSave={handleSaveEmployee}>
                            <Button variant="outline" size="sm" className='h-8 gap-1.5 rounded-lg border-slate-200 text-[10px]'>
                                <Edit className='h-3 w-3'/> Edit Profile
                            </Button>
                        </EditEmployeeDialog>
                    </div>
                 </div>

                 <div className="w-full">
                    <Card className='w-full professional-card shadow-sm'>
                        <CardHeader className='p-3 border-b'>
                            <CardTitle className='text-base font-bold'>Monthly Performance Goals (KRAs)</CardTitle>
                            <CardDescription className='text-[10px]'>Active targets for {selectedMonth === 'all' ? 'Overall Period' : availableMonths[parseInt(selectedMonth)]} {selectedYear === 'all' ? '' : selectedYear}.</CardDescription>
                        </CardHeader>
                        <CardContent className='p-0 sm:p-2'>
                            {loading ? <Skeleton className="h-32 w-full" /> : <KraTable kras={filteredKrasForEmployee} employees={employees} onSave={handleSaveKra} onDelete={() => {}} />}
                        </CardContent>
                    </Card>
                 </div>
            </div>
        )
    }

  return (
     <TooltipProvider>
        <div className="flex flex-col gap-3">
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-2'>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">Organizational Dashboard</h1>
                    <p className='text-[10px] text-slate-500 font-medium'>Enterprise personnel and performance oversight.</p>
                </div>
                <div className='flex items-center gap-1.5 bg-white p-1 rounded-lg border shadow-sm h-9'>
                    {pagePermission !== 'employee_only' && <ViewSwitcher view={view} onViewChange={handleViewChange} />}
                    <Separator orientation="vertical" className="h-5 mx-0.5" />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant={showFilters ? "secondary" : "ghost"} size="sm" onClick={() => setShowFilters(!showFilters)} className="h-7 w-7 p-0">
                                <Filter className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Filters</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant={showTools ? "secondary" : "ghost"} size="sm" onClick={() => setShowTools(!showTools)} className="h-7 w-7 p-0">
                                <Settings2 className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Import/Export Tools</TooltipContent>
                    </Tooltip>
                </div>
            </div>

            <Card className='professional-card shadow-sm'>
                <CardHeader className="p-3 space-y-3">
                <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className='flex items-center gap-2'>
                        <div className='bg-primary/10 p-1.5 rounded-lg text-primary'>
                            <Users className='h-4 w-4'/>
                        </div>
                        <div>
                            <CardTitle className='text-base font-bold'>Personnel Directory</CardTitle>
                            <CardDescription className='text-[10px]'>Active employees: {filteredEmployeeSummary.length}</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {(pagePermission === 'edit' || pagePermission === 'download') && (
                            <>
                                <AddKraDialog onSave={handleSaveKra} employees={employees}>
                                    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[10px]">
                                        <PlusCircle className="h-3 w-3" /> Assign KRA
                                    </Button>
                                </AddKraDialog>
                                <AddEmployeeDialog onSave={handleSaveEmployee}>
                                    <Button size="sm" className="h-8 gap-1.5 text-[10px]">
                                        <UserPlus className="h-3 w-3" /> Add Employee
                                    </Button>
                                </AddEmployeeDialog>
                            </>
                        )}
                    </div>
                </div>

                {showFilters && (
                    <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-1">
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-[100px] h-7 text-[10px] bg-white"><SelectValue placeholder="Year" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="text-[10px]">All Years</SelectItem>
                                {availableYears.map(y => <SelectItem key={y} value={String(y)} className="text-[10px]">{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={selectedYear === 'all'}>
                            <SelectTrigger className="w-[110px] h-7 text-[10px] bg-white"><SelectValue placeholder="Month" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="text-[10px]">All Months</SelectItem>
                                {availableMonths.map((m, i) => <SelectItem key={i} value={String(i)} className="text-[10px]">{m}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                            <SelectTrigger className="w-[140px] h-7 text-[10px] bg-white"><SelectValue placeholder="Department" /></SelectTrigger>
                            <SelectContent>
                                {branchOptions.map(b => <SelectItem key={b} value={b} className="text-[10px]">{b === 'all' ? 'All Depts.' : b}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {showTools && pagePermission === 'download' && (
                    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-900 rounded-lg text-white animate-in fade-in slide-in-from-top-1">
                        <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".xlsx, .xls" />
                        <Button variant="outline" size="sm" onClick={handleDownloadSample} className="h-7 text-[9px] bg-transparent border-slate-700 text-white hover:bg-slate-800 px-2"><FileSpreadsheet className="h-3 w-3 mr-1" /> Template</Button>
                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-7 text-[9px] bg-transparent border-slate-700 text-white hover:bg-slate-800 px-2"><Upload className="h-3 w-3 mr-1" /> Import</Button>
                        <Button variant="outline" size="sm" onClick={handleExport} className="h-7 text-[9px] bg-transparent border-slate-700 text-white hover:bg-slate-800 px-2"><Download className="h-3 w-3 mr-1" /> Export All</Button>
                    </div>
                )}
                </CardHeader>
                <CardContent className='p-3 pt-0'>
                    <Tabs defaultValue="list">
                        <TabsList className="bg-slate-100 p-1 mb-3 h-8">
                            <TabsTrigger value="list" className='text-[10px] gap-1.5 h-6'><Users className="h-3 w-3" /> Directory</TabsTrigger>
                            <TabsTrigger value="performance" className='text-[10px] gap-1.5 h-6'><TrendingUp className="h-3 w-3" /> Analytics</TabsTrigger>
                        </TabsList>
                        <TabsContent value="list">
                             {selectedEmployeeIds.length > 0 && (
                                <div className="flex items-center justify-between p-1.5 mb-2 bg-rose-50 border border-rose-100 rounded-lg">
                                  <span className="text-[10px] font-bold text-rose-700">{selectedEmployeeIds.length} selected</span>
                                  <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="h-6 text-[9px] gap-1"><Trash2 className="h-2.5 w-2.5" /> Delete</Button>
                                </div>
                             )}
                             {view === 'list' ? (
                                <div className="border rounded-lg overflow-hidden bg-white">
                                    <Table>
                                        <TableHeader className='bg-slate-50'>
                                            <TableRow className='h-8'>
                                                <TableHead className="w-[35px] px-2"><Checkbox checked={selectedEmployeeIds.length === filteredEmployeeSummary.length} onCheckedChange={handleSelectAll} className="h-3 w-3" /></TableHead>
                                                <TableHead className='text-[8px] font-bold uppercase tracking-wider text-slate-500 py-0 h-8'>Identity</TableHead>
                                                <TableHead className='text-[8px] font-bold uppercase tracking-wider text-slate-500 py-0 h-8'>Dept.</TableHead>
                                                <TableHead className='text-[8px] font-bold uppercase tracking-wider text-slate-500 text-center py-0 h-8'>KRAs</TableHead>
                                                <TableHead className='text-[8px] font-bold uppercase tracking-wider text-slate-500 py-0 h-8'>Score</TableHead>
                                                <TableHead className='text-right px-2 py-0 h-8'></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>) :
                                                filteredEmployeeSummary.map(({ employee, kraCount, averagePerformance }) => (
                                                    <TableRow key={employee.id} className='group hover:bg-slate-50 h-10'>
                                                        <TableCell className='px-2 py-1'><Checkbox checked={selectedEmployeeIds.includes(employee.id)} onCheckedChange={(c) => handleSelectOne(employee.id, !!c)} className="h-3 w-3" /></TableCell>
                                                        <TableCell className="py-1">
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-7 w-7 border border-slate-200"><AvatarImage src={employee.avatarUrl} alt={employee.name} /><AvatarFallback className='text-[9px]'>{employee.name?.charAt(0)}</AvatarFallback></Avatar>
                                                                <div>
                                                                    <div className="text-[10px] font-semibold text-slate-900 leading-tight">{employee.name}</div>
                                                                    <div className='text-[8px] text-slate-400 font-mono'>{employee.id.slice(0, 6)}...</div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className='text-[10px] font-medium text-slate-600 py-1'>{employee.branch || 'N/A'}</TableCell>
                                                        <TableCell className='text-center py-1'><Badge variant="secondary" className='text-[9px] h-4 px-1.5'>{kraCount}</Badge></TableCell>
                                                        <TableCell className="py-1">
                                                            <div className="flex items-center gap-1.5 w-[120px]">
                                                                <div className='flex-1 bg-slate-100 h-1 rounded-full'><div className={cn('h-full rounded-full transition-all duration-500', averagePerformance >= 80 ? 'bg-emerald-500' : averagePerformance >= 50 ? 'bg-amber-500' : 'bg-rose-500')} style={{ width: `${averagePerformance}%` }} /></div>
                                                                <span className="text-[9px] font-bold w-7 text-right">{averagePerformance}%</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right px-2 py-1">
                                                            <Link href={`/employees/${employee.id}`}><Button variant="outline" size="sm" className='h-6 text-[9px] px-2'>Profile</Button></Link>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            }
                                        </TableBody>
                                    </Table>
                                </div>
                             ) : (
                                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {filteredEmployeeSummary.map((summary) => (
                                        <div key={summary.employee.id} className="relative group">
                                          <div className="absolute top-1.5 left-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Checkbox checked={selectedEmployeeIds.includes(summary.employee.id)} onCheckedChange={(c) => handleSelectOne(summary.employee.id, !!c)} className="bg-white border-slate-300 h-3 w-3" />
                                          </div>
                                          <EmployeeCard summary={summary} />
                                        </div>
                                    ))}
                                 </div>
                             )}
                        </TabsContent>
                        <TabsContent value="performance">
                             <div className="h-[300px] pt-1">
                                {loading ? <Skeleton className="h-full w-full" /> : 
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={performanceData} layout="vertical" margin={{ left: 10, right: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                            <XAxis type="number" domain={[0, 100]} hide />
                                            <YAxis dataKey="employee.name" type="category" width={80} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 500 }} axisLine={false} />
                                            <Bar dataKey="performanceScore" radius={[0, 2, 2, 0]} barSize={10}>
                                                {performanceData.map((e, i) => <Cell key={i} fill={e.performanceScore >= 80 ? '#10b981' : e.performanceScore >= 50 ? '#f59e0b' : '#f43f5e'} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                }
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
    return <Protected><DashboardContent /></Protected>;
}
