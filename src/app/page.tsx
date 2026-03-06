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
import { Eye, ShieldCheck, Users, TrendingUp, PlusCircle, Download, Upload, FileSpreadsheet, Trash2, Mail, Home, Calendar as CalendarIcon, Cake, Phone, Edit, ChevronDown, Fingerprint, Filter, Database, UserPlus, Sparkles, CalendarDays } from 'lucide-react';
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
  const [selectedBranch, setSelectedBranch] = React.useState('all');
  const [selectedYear, setSelectedYear] = React.useState<string>(String(getYear(new Date())));
  const [selectedMonth, setSelectedMonth] = React.useState<string>(String(getMonth(new Date())));
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
    const savedView = localStorage.getItem('employeeView');
    if (savedView === 'grid' || savedView === 'list') setView(savedView);
  }, []);

  const { employeeSummary, branchOptions, performanceData, availableYears, availableMonths, filteredKrasForEmployee } = React.useMemo(() => {
        let krasToProcess = kras;

        if (pagePermission === 'employee_only' && user) {
            krasToProcess = kras.filter(k => k.employee.email === user.email);
        }

        const filteredKrasByDate = krasToProcess.filter(kra => {
            if (selectedYear === 'all' && selectedMonth === 'all') return true;
            const year = parseInt(selectedYear);
            const month = parseInt(selectedMonth);
            const kraStart = new Date(kra.startDate);
            const kraEnd = new Date(kra.endDate);
            if (selectedYear !== 'all' && selectedMonth === 'all') return getYear(kraStart) <= year && getYear(kraEnd) >= year;
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
            if (employeeMap.has(kra.employee.id)) employeeMap.get(kra.employee.id)!.kras.push(kra);
        });
        
        const summaryData: EmployeeSummary[] = [];
        const perfData: EmployeePerformance[] = [];

        employeeMap.forEach(({ employee, kras }) => {
            const displayKras = kras.filter(k => !k.id.startsWith('KRA-placeholder-'));
            const relevantKras = displayKras.filter(k => k.marksAchieved !== null && k.weightage !== null && k.weightage > 0);
            const totalWeightage = relevantKras.reduce((sum, kra) => sum + (kra.weightage || 0), 0);
            const totalMarksAchieved = relevantKras.reduce((sum, kra) => sum + (kra.marksAchieved || 0) + (kra.bonus || 0) - (kra.penalty || 0), 0);
            const averagePerformance = totalWeightage > 0 ? Math.round((totalMarksAchieved / totalWeightage) * 100) : 0;
            
            summaryData.push({ employee, kraCount: displayKras.length, averagePerformance });
            perfData.push({ employee, totalWeightage, totalMarksAchieved, performanceScore: averagePerformance });
        });

        const uniqueBranches = ['all', ...Array.from(new Set(employees.map(e => e.branch).filter(Boolean) as string[]))];
        const yearsSet = new Set<number>([getYear(new Date())]);
        kras.forEach(k => { yearsSet.add(getYear(new Date(k.startDate))); yearsSet.add(getYear(new Date(k.endDate))); });

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

    if (pagePermission === 'employee_only' && currentEmployeeData) {
        return (
            <div className="flex flex-col gap-8">
                 <div className='flex items-center justify-between'>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome, {currentEmployeeData.name?.split(' ')[0]}!</h1>
                        <p className='text-slate-500 font-medium'>Performance overview and active KRAs.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-[110px] h-8 text-xs border-none shadow-none focus:ring-0">
                                    <CalendarDays className="h-3 w-3 mr-1 text-slate-400" />
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Separator orientation="vertical" className="h-4" />
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-[120px] h-8 text-xs border-none shadow-none focus:ring-0">
                                    <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableMonths.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <EditEmployeeDialog employee={currentEmployeeData} onSave={handleSaveEmployee}>
                            <Button variant="outline" size="sm" className='gap-2 rounded-lg border-slate-200'>
                                <Edit className='h-4 w-4'/> Edit Profile
                            </Button>
                        </EditEmployeeDialog>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className='lg:col-span-1 h-fit transition-all duration-300'>
                        <CardHeader className='flex-row items-center justify-between pb-4 bg-slate-50/50'>
                            <div className='flex items-center gap-4'>
                                <Avatar className='h-14 w-14 border border-slate-200'>
                                    <AvatarImage src={currentEmployeeData.avatarUrl} alt={currentEmployeeData.name} />
                                    <AvatarFallback>{currentEmployeeData.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className='text-lg'>{currentEmployeeData.name}</CardTitle>
                                    <CardDescription className='font-semibold text-primary'>{currentEmployeeData.branch || 'General'} Dept.</CardDescription>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowProfileDetails(!showProfileDetails)}>
                                <ChevronDown className={cn("h-5 w-5 transition-transform", showProfileDetails && "rotate-180")} />
                            </Button>
                        </CardHeader>
                        {showProfileDetails && (
                            <CardContent className='text-sm space-y-4 pt-6 border-t animate-in fade-in slide-in-from-top-2'>
                                <div className='flex items-center gap-3'>
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    <span className='font-medium'>{currentEmployeeData.email}</span>
                                </div>
                                <div className='flex items-start gap-3'>
                                    <Home className="h-4 w-4 text-slate-400 mt-0.5" />
                                    <span className='font-medium leading-tight'>{currentEmployeeData.address || 'No address'}</span>
                                </div>
                                <div className='flex items-center gap-3'>
                                    <CalendarIcon className="h-4 w-4 text-slate-400" />
                                    <span className='font-medium'>Joined: {currentEmployeeData.joiningDate ? format(new Date(currentEmployeeData.joiningDate), "MMM d, yyyy") : 'N/A'}</span>
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    <Card className='lg:col-span-2 professional-card'>
                        <CardHeader>
                            <CardTitle className='text-xl'>My Performance Goals (KRAs)</CardTitle>
                            <CardDescription>Active weekly goals for {availableMonths[parseInt(selectedMonth)]} {selectedYear}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? <Skeleton className="h-40 w-full" /> : <KraTable kras={filteredKrasForEmployee} employees={employees} onSave={handleSaveKra} onDelete={() => {}} />}
                        </CardContent>
                    </Card>
                 </div>
            </div>
        )
    }

  return (
     <TooltipProvider>
        <div className="flex flex-col gap-8">
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Organizational Dashboard</h1>
                    <p className='text-slate-500 font-medium'>Professional resource and performance oversight.</p>
                </div>
                <div className='flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm'>
                    {pagePermission !== 'employee_only' && <ViewSwitcher view={view} onViewChange={handleViewChange} />}
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button variant={showFilters ? "secondary" : "ghost"} size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
                        <Filter className="h-4 w-4" /> Filter
                    </Button>
                    <Button variant={showTools ? "secondary" : "ghost"} size="sm" onClick={() => setShowTools(!showTools)} className="gap-2">
                        <Database className="h-4 w-4" /> Tools
                    </Button>
                </div>
            </div>

            <Card className='professional-card'>
                <CardHeader className="space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className='flex items-center gap-4'>
                        <div className='bg-primary/10 p-2.5 rounded-lg text-primary'>
                            <Users className='h-6 w-6'/>
                        </div>
                        <div>
                            <CardTitle className='text-xl'>Personnel Directory</CardTitle>
                            <CardDescription>Total {filteredEmployeeSummary.length} employees active.</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {(pagePermission === 'edit' || pagePermission === 'download') && (
                            <>
                                <AddKraDialog onSave={handleSaveKra} employees={employees}>
                                    <Button variant="outline" className="gap-2">
                                        <PlusCircle className="h-4 w-4" /> Assign KRA
                                    </Button>
                                </AddKraDialog>
                                <AddEmployeeDialog onSave={handleSaveEmployee}>
                                    <Button className="gap-2">
                                        <UserPlus className="h-4 w-4" /> Add Employee
                                    </Button>
                                </AddEmployeeDialog>
                            </>
                        )}
                    </div>
                </div>

                {showFilters && (
                    <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-2">
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-[140px] bg-white"><SelectValue placeholder="Year" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Years</SelectItem>
                                {availableYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={selectedYear === 'all'}>
                            <SelectTrigger className="w-[160px] bg-white"><SelectValue placeholder="Month" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Months</SelectItem>
                                {availableMonths.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                            <SelectTrigger className="w-[200px] bg-white"><SelectValue placeholder="Department" /></SelectTrigger>
                            <SelectContent>
                                {branchOptions.map(b => <SelectItem key={b} value={b}>{b === 'all' ? 'All Depts.' : b}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {showTools && pagePermission === 'download' && (
                    <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-900 rounded-lg text-white animate-in fade-in slide-in-from-top-2">
                        <input type="file" ref={fileInputRef} onChange={() => {}} className="hidden" accept=".xlsx, .xls" />
                        <Button variant="outline" size="sm" className="bg-transparent border-slate-700 text-white hover:bg-slate-800"><FileSpreadsheet className="h-4 w-4 mr-2" /> Template</Button>
                        <Button variant="outline" size="sm" className="bg-transparent border-slate-700 text-white hover:bg-slate-800"><Upload className="h-4 w-4 mr-2" /> Import</Button>
                        <Button variant="outline" size="sm" className="bg-transparent border-slate-700 text-white hover:bg-slate-800"><Download className="h-4 w-4 mr-2" /> Export All</Button>
                    </div>
                )}
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="list">
                        <TabsList className="bg-slate-100 p-1 mb-6">
                            <TabsTrigger value="list" className='gap-2'><Users className="h-4 w-4" /> Directory</TabsTrigger>
                            <TabsTrigger value="performance" className='gap-2'><TrendingUp className="h-4 w-4" /> Analytics</TabsTrigger>
                        </TabsList>
                        <TabsContent value="list">
                             {selectedEmployeeIds.length > 0 && (
                                <div className="flex items-center justify-between p-3 mb-4 bg-rose-50 border border-rose-100 rounded-lg">
                                  <span className="text-sm font-semibold text-rose-700">{selectedEmployeeIds.length} selected</span>
                                  <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2"><Trash2 className="h-4 w-4" /> Delete</Button>
                                </div>
                             )}
                             {view === 'list' ? (
                                <div className="border rounded-lg overflow-hidden bg-white">
                                    <Table>
                                        <TableHeader className='bg-slate-50'>
                                            <TableRow>
                                                <TableHead className="w-[50px]"><Checkbox checked={selectedEmployeeIds.length === filteredEmployeeSummary.length} onCheckedChange={handleSelectAll} /></TableHead>
                                                <TableHead className='text-[10px] font-bold uppercase tracking-wider text-slate-500'>Identity</TableHead>
                                                <TableHead className='text-[10px] font-bold uppercase tracking-wider text-slate-500'>Department</TableHead>
                                                <TableHead className='text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center'>KRAs</TableHead>
                                                <TableHead className='text-[10px] font-bold uppercase tracking-wider text-slate-500'>Performance Score</TableHead>
                                                <TableHead className='text-right'>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-12 w-full" /></TableCell></TableRow>) :
                                                filteredEmployeeSummary.map(({ employee, kraCount, averagePerformance }) => (
                                                    <TableRow key={employee.id} className='group hover:bg-slate-50'>
                                                        <TableCell><Checkbox checked={selectedEmployeeIds.includes(employee.id)} onCheckedChange={(c) => handleSelectOne(employee.id, !!c)} /></TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-10 w-10 border border-slate-200"><AvatarImage src={employee.avatarUrl} alt={employee.name} /><AvatarFallback>{employee.name?.charAt(0)}</AvatarFallback></Avatar>
                                                                <div>
                                                                    <div className="font-semibold text-slate-900">{employee.name}</div>
                                                                    <div className='text-[10px] text-slate-400 font-mono'>{employee.id}</div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className='font-medium text-slate-600'>{employee.branch || 'N/A'}</TableCell>
                                                        <TableCell className='text-center'><Badge variant="secondary">{kraCount}</Badge></TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3 w-[200px]">
                                                                <div className='flex-1 bg-slate-100 h-2 rounded-full'><div className={cn('h-full rounded-full transition-all duration-500', averagePerformance >= 80 ? 'bg-emerald-500' : averagePerformance >= 50 ? 'bg-amber-500' : 'bg-rose-500')} style={{ width: `${averagePerformance}%` }} /></div>
                                                                <span className="text-xs font-bold w-10 text-right">{averagePerformance}%</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Link href={`/employees/${employee.id}`}><Button variant="outline" size="sm">Profile</Button></Link>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            }
                                        </TableBody>
                                    </Table>
                                </div>
                             ) : (
                                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {filteredEmployeeSummary.map((summary) => (
                                        <div key={summary.employee.id} className="relative group">
                                          <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Checkbox checked={selectedEmployeeIds.includes(summary.employee.id)} onCheckedChange={(c) => handleSelectOne(summary.employee.id, !!c)} className="bg-white border-slate-300" />
                                          </div>
                                          <EmployeeCard summary={summary} />
                                        </div>
                                    ))}
                                 </div>
                             )}
                        </TabsContent>
                        <TabsContent value="performance">
                             <div className="h-[450px] pt-4">
                                {loading ? <Skeleton className="h-full w-full" /> : 
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={performanceData} layout="vertical" margin={{ left: 40, right: 40 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                            <XAxis type="number" domain={[0, 100]} hide />
                                            <YAxis dataKey="employee.name" type="category" width={120} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} axisLine={false} />
                                            <Bar dataKey="performanceScore" radius={[0, 4, 4, 0]} barSize={20}>
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
