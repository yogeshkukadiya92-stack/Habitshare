
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AddKraDialog } from '@/components/add-kra-dialog';
import type { Employee, KRA } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Protected } from '@/components/protected';
import { PlusCircle, ListChecks, ChevronUp, Settings2, Users, ArrowLeft, Search, Fingerprint, Download, Upload, FileSpreadsheet } from 'lucide-react';
import { getYear, getMonth, startOfMonth, endOfMonth, format } from 'date-fns';
import { useDataStore } from '@/hooks/use-data-store';
import { KraTable } from '@/components/kra-table';
import { useAuth } from '@/components/auth-provider';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { v4 as uuidv4 } from 'uuid';
import { ensureDate } from '@/lib/utils';

function KraManagementPage() {
  const { 
    kras, 
    loading, 
    employees, 
    handleSaveKra, 
    handleDeleteKra,
  } = useDataStore();
  
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = React.useState('all');
  
  // Set default filters to 'all' to ensure all KRAs are visible initially
  const [selectedYear, setSelectedYear] = React.useState<string>('all');
  const [selectedMonth, setSelectedMonth] = React.useState<string>('all');
  const [showControls, setShowControls] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const { currentUser, getPermission } = useAuth();
  const pagePermission = getPermission('employees'); 
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { branchOptions, availableYears, availableMonths } = React.useMemo(() => {
        const uniqueBranches = ['all', ...Array.from(new Set(employees.map(e => e.branch).filter(Boolean) as string[]))];
        const yearsSet = new Set<number>([getYear(new Date())]);
        kras.forEach(kra => {
            yearsSet.add(getYear(ensureDate(kra.startDate)));
            yearsSet.add(getYear(ensureDate(kra.endDate)));
        });
        return { 
            branchOptions: uniqueBranches, 
            availableYears: Array.from(yearsSet).sort((a, b) => b - a),
            availableMonths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        };
    }, [kras, employees]);

  const filteredEmployees = React.useMemo(() => {
    return employees.filter(emp => {
        const branchMatch = selectedBranch === 'all' || emp.branch === selectedBranch;
        const searchMatch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.id.toLowerCase().includes(searchTerm.toLowerCase());
        return branchMatch && searchMatch;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, selectedBranch, searchTerm]);

  const selectedEmployeeKras = React.useMemo(() => {
    if (!selectedEmployeeId) return [];
    
    return kras.filter(kra => {
        if (!kra.employee || kra.employee.id !== selectedEmployeeId) return false;
        
        if (selectedYear === 'all' && selectedMonth === 'all') return true;
        
        const year = parseInt(selectedYear);
        const month = parseInt(selectedMonth);
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
  }, [kras, selectedEmployeeId, selectedYear, selectedMonth]);

  const selectedEmployee = React.useMemo(() => 
    employees.find(e => e.id === selectedEmployeeId), 
    [employees, selectedEmployeeId]
  );

  const handleExportAll = () => {
    const dataToExport = kras.map(k => ({
        'Employee ID': k.employee?.id || '',
        'Employee Name': k.employee?.name || '',
        'Task Description': k.taskDescription,
        'Weightage': k.weightage,
        'Target': k.target,
        'Achieved': k.achieved,
        'Marks Achieved': k.marksAchieved,
        'Bonus': k.bonus,
        'Penalty': k.penalty,
        'Start Date': format(ensureDate(k.startDate), 'yyyy-MM-dd'),
        'End Date': format(ensureDate(k.endDate), 'yyyy-MM-dd')
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'KRAs');
    XLSX.writeFile(workbook, `KRA_Data_Full_Export_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    toast({ title: "Export Successful", description: "All KRA data has been exported." });
  };

  const handleDownloadKRATemplate = () => {
    const templateData = [
        {
            'Task Description': 'Increase sales by 10% in the West region.',
            'Weightage': 20,
            'Target': 500000,
            'Start Date': '2024-01-01',
            'End Date': '2024-12-31'
        }
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'KRA_Template');
    XLSX.writeFile(workbook, 'Individual_KRA_Import_Template.xlsx');
  };

  const handleExportIndividualKRAs = () => {
    if (!selectedEmployee) return;
    const dataToExport = selectedEmployeeKras.map(k => ({
        'Task Description': k.taskDescription,
        'Weightage': k.weightage,
        'Target': k.target,
        'Achieved': k.achieved,
        'Marks Achieved': k.marksAchieved,
        'Bonus': k.bonus,
        'Penalty': k.penalty,
        'Start Date': format(ensureDate(k.startDate), 'yyyy-MM-dd'),
        'End Date': format(ensureDate(k.endDate), 'yyyy-MM-dd')
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'MyKRAs');
    XLSX.writeFile(workbook, `KRA_Data_${selectedEmployee.name.replace(/\s/g, '_')}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    toast({ title: "Export Successful", description: `KRA data for ${selectedEmployee.name} exported.` });
  };

  const handleImportKRAs = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedEmployee) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(worksheet) as any[];

            const importedKras: KRA[] = json.map((row, index) => {
                const target = Number(row['Target'] || 0);
                const weightage = Number(row['Weightage'] || 0);
                const startDate = row['Start Date'] ? ensureDate(row['Start Date']) : new Date();
                const endDate = row['End Date'] ? ensureDate(row['End Date']) : new Date();

                return {
                    id: uuidv4(),
                    taskDescription: String(row['Task Description'] || 'Imported Task'),
                    employee: selectedEmployee,
                    progress: 0,
                    status: 'Pending',
                    weightage: weightage,
                    marksAchieved: 0,
                    bonus: 0,
                    penalty: 0,
                    startDate: startDate,
                    endDate: endDate,
                    target: target,
                    achieved: 0,
                    actions: [],
                    activities: [{
                        id: uuidv4(),
                        timestamp: new Date(),
                        actorName: currentUser?.name || 'System',
                        action: 'KRA Imported',
                        details: 'KRA added via bulk import'
                    }]
                };
            });

            importedKras.forEach(handleSaveKra);
            toast({ title: "Import Successful", description: `${json.length} KRAs added to ${selectedEmployee.name}.` });

        } catch (error: any) {
            toast({ title: "Import Failed", description: error.message, variant: 'destructive' });
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
     <TooltipProvider>
        <div className="flex-1 flex flex-col gap-3">
            <Card className='professional-card shadow-sm'>
                <CardHeader className="p-3 flex flex-row items-center justify-between">
                    <div className='flex items-center gap-2'>
                        {selectedEmployeeId ? (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setSelectedEmployeeId(null)}
                                className="h-8 w-8 p-0 rounded-full mr-1"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        ) : (
                            <div className='bg-primary/10 p-1.5 rounded-lg text-primary'>
                                <ListChecks className="h-4 w-4" />
                            </div>
                        )}
                        <div>
                            <CardTitle className='text-base font-bold'>
                                {selectedEmployeeId ? `KRAs: ${selectedEmployee?.name}` : 'KRA Management'}
                            </CardTitle>
                            {selectedEmployeeId && (
                                <CardDescription className='text-[10px] font-medium flex items-center gap-2'>
                                    {selectedEmployee?.branch} • {selectedMonth === 'all' ? 'All Time' : availableMonths[parseInt(selectedMonth)]} {selectedYear === 'all' ? '' : selectedYear}
                                </CardDescription>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {selectedEmployeeId && pagePermission === 'download' && (
                            <div className="flex items-center gap-1.5 mr-4 bg-slate-100 p-1 rounded-lg">
                                <input type="file" ref={fileInputRef} onChange={handleImportKRAs} className="hidden" accept=".xlsx, .xls" />
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" onClick={handleDownloadKRATemplate} className="h-7 text-[9px] gap-1 px-2"><FileSpreadsheet className="h-3 w-3" /> Template</Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs">Download import template</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="h-7 text-[9px] gap-1 px-2"><Upload className="h-3 w-3" /> Import</Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs">Bulk add KRAs from Excel</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" onClick={handleExportIndividualKRAs} className="h-7 text-[9px] gap-1 px-2"><Download className="h-3 w-3" /> Export</Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs">Export these KRAs</TooltipContent>
                                </Tooltip>
                            </div>
                        )}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setShowControls(!showControls)}
                                    className="h-7 w-7 p-0 rounded-full"
                                >
                                    {showControls ? <ChevronUp className="h-3.5 w-3.5" /> : <Settings2 className="h-3.5 w-3.5" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">{showControls ? 'Hide Controls' : 'Show Controls'}</TooltipContent>
                        </Tooltip>
                    </div>
                </CardHeader>

                {showControls && (
                    <CardContent className="p-3 pt-0 border-b bg-slate-50/50">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="w-[90px] h-7 text-[10px] bg-white"><SelectValue placeholder="Year" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-[10px]">All Years</SelectItem>
                                        {availableYears.map(y => <SelectItem key={y} value={String(y)} className="text-[10px]">{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={selectedYear === 'all'}>
                                    <SelectTrigger className="w-[100px] h-7 text-[10px] bg-white"><SelectValue placeholder="Month" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-[10px]">All Months</SelectItem>
                                        {availableMonths.map((month, index) => <SelectItem key={index} value={String(index)} className="text-[10px]">{month}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {!selectedEmployeeId && (
                                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                                        <SelectTrigger className="w-[130px] h-7 text-[10px] bg-white"><SelectValue placeholder="Department" /></SelectTrigger>
                                        <SelectContent>
                                            {branchOptions.map(branch => <SelectItem key={branch} value={branch} className="text-[10px]">{branch === 'all' ? 'All Depts.' : branch}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                                {!selectedEmployeeId && (
                                    <div className="relative">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                        <Input 
                                            placeholder="Search employee..." 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="h-7 w-[150px] pl-7 text-[10px] bg-white"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                                {!selectedEmployeeId && pagePermission === 'download' && (
                                    <Button variant="outline" size="sm" onClick={handleExportAll} className="h-7 text-[9px] gap-1 px-2"><PlusCircle className="h-3 w-3" /> Export All Data</Button>
                                )}
                                {(pagePermission === 'edit' || pagePermission === 'download') && (
                                    <AddKraDialog onSave={handleSaveKra} employees={employees}>
                                        <Button size="sm" className="h-7 text-[9px] gap-1 px-3">
                                            <PlusCircle className="h-3 w-3" /> Add New KRA
                                        </Button>
                                    </AddKraDialog>
                                )}
                            </div>
                        </div>
                    </CardContent>
                )}

                <CardContent className="p-3">
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <Skeleton key={i} className="h-24 w-full rounded-xl" />
                            ))}
                        </div>
                    ) : !selectedEmployeeId ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {filteredEmployees.map((emp) => {
                                // Calculate total KRA count for this employee based on filters
                                const empKrasCount = kras.filter(k => {
                                    if (k.employee?.id !== emp.id) return false;
                                    if (selectedYear === 'all' && selectedMonth === 'all') return true;
                                    const year = parseInt(selectedYear);
                                    const month = parseInt(selectedMonth);
                                    const kraStart = ensureDate(k.startDate);
                                    const kraEnd = ensureDate(k.endDate);
                                    if (selectedYear !== 'all' && selectedMonth === 'all') {
                                        return getYear(kraStart) <= year && getYear(kraEnd) >= year;
                                    }
                                    if (selectedYear !== 'all' && selectedMonth !== 'all') {
                                         const monthStart = startOfMonth(new Date(year, month));
                                         const monthEnd = endOfMonth(new Date(year, month));
                                         return kraStart <= monthEnd && kraEnd >= monthStart;
                                    }
                                    return true;
                                }).length;

                                return (
                                <div 
                                    key={emp.id} 
                                    onClick={() => setSelectedEmployeeId(emp.id)}
                                    className="group cursor-pointer p-3 rounded-xl border border-slate-200 bg-white hover:border-primary/50 hover:shadow-md transition-all duration-200 flex flex-col items-center text-center"
                                >
                                    <div className="relative mb-2">
                                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
                                            <AvatarImage src={emp.avatarUrl} alt={emp.name} />
                                            <AvatarFallback className="bg-primary/5 text-primary font-bold text-sm">
                                                {emp.name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1 bg-green-500 h-3 w-3 rounded-full border-2 border-white shadow-sm" />
                                    </div>
                                    <h3 className="text-[11px] font-bold text-slate-900 leading-tight mb-0.5 group-hover:text-primary transition-colors">{emp.name}</h3>
                                    <p className="text-[9px] text-slate-500 font-medium mb-1">{emp.branch || 'No Department'}</p>
                                    <Badge variant="secondary" className="text-[8px] h-3 px-1 mb-1">{empKrasCount} KRAs</Badge>
                                    <div className='flex items-center gap-1 text-[8px] text-muted-foreground font-mono mt-auto pt-1 border-t w-full justify-center'>
                                        <Fingerprint className='h-2 w-2'/> {emp.id.slice(0,8)}
                                    </div>
                                </div>
                            )})}
                            {filteredEmployees.length === 0 && (
                                <div className="col-span-full py-20 text-center flex flex-col items-center gap-2">
                                    <Users className="h-10 w-10 text-slate-200" />
                                    <p className="text-sm text-slate-400 font-medium">No employees found matching your filters.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                            <div className="mb-3 flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/10">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border border-white">
                                        <AvatarImage src={selectedEmployee?.avatarUrl} alt={selectedEmployee?.name} />
                                        <AvatarFallback>{selectedEmployee?.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-900">{selectedEmployee?.name}</h4>
                                        <p className="text-[10px] text-slate-500">{selectedEmployee?.email}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge variant="secondary" className="text-[9px] font-bold mb-1">{selectedEmployee?.branch}</Badge>
                                    <p className="text-[9px] text-muted-foreground font-mono">ID: {selectedEmployee?.id}</p>
                                </div>
                            </div>
                            <KraTable 
                                kras={selectedEmployeeKras}
                                employees={employees}
                                onSave={handleSaveKra}
                                onDelete={handleDeleteKra}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
     </TooltipProvider>
  );
}

export default function KRAManagement() {
    return (
        <Protected>
            <KraManagementPage />
        </Protected>
    )
}
