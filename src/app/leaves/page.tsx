

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, PlusCircle, Check, ChevronsUpDown, ShieldCheck } from "lucide-react";
import type { Employee, Leave, KRA } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LeaveRequestsTable } from '@/components/leave-requests-table';
import { AddLeaveRequestDialog } from '@/components/add-leave-request-dialog';
import { getMonth, getYear } from 'date-fns';
import { ViewSwitcher } from '@/components/view-switcher';
import { LeaveCard } from '@/components/leave-card';
import { useAuth } from '@/components/auth-provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { useDataStore } from '@/hooks/use-data-store';

interface LeaveBalance {
    employeeId: string;
    totalLeaves: number;
    leavesTaken: number;
    balance: number;
}

export default function LeaveManagementPage() {
    const { employees, leaves, loading, handleSaveLeave, setKras } = useDataStore();
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [yearFilter, setYearFilter] = React.useState<string>('all');
    const [monthFilter, setMonthFilter] = React.useState<string>('all');
    const [view, setView] = React.useState<'list' | 'grid'>('list');
    const { currentUser, getPermission } = useAuth();
    const pagePermission = getPermission('leaves');
    
    const [selectedEmployeeForExtra, setSelectedEmployeeForExtra] = React.useState('');
    const [extraLeaves, setExtraLeaves] = React.useState(0);
    const [comboboxOpen, setComboboxOpen] = React.useState(false);
    const { toast } = useToast();


    React.useEffect(() => {
        try {
            const savedView = localStorage.getItem('leaveView');
            if (savedView === 'grid' || savedView === 'list') {
                setView(savedView);
            }
        } catch (error) {
            console.error("Failed to parse data from localStorage", error);
        }
    }, []);

    const handleDeleteLeave = (leaveId: string) => {
        // This needs to be implemented in the data store
        console.log("Delete leave action triggered for", leaveId);
    };

    const leaveBalances: LeaveBalance[] = React.useMemo(() => {
        return employees.map(emp => {
            const totalLeaves = emp.extraLeaves || 0;

            const leavesTaken = leaves
                .filter(l => l.employee.id === emp.id && l.status === 'Approved')
                .reduce((total, l) => total + (l.duration || 1), 0);

            return {
                employeeId: emp.id,
                totalLeaves,
                leavesTaken,
                balance: totalLeaves - leavesTaken,
            };
        });
    }, [employees, leaves]);

    const handleAddExtraLeaves = () => {
        if (!selectedEmployeeForExtra || extraLeaves <= 0) {
            toast({ title: 'Invalid Input', description: 'Please select an employee and enter a valid number of leaves.', variant: 'destructive'});
            return;
        }

        setKras(prevKras => {
            return prevKras.map(kra => {
                if (kra.employee.id === selectedEmployeeForExtra) {
                    const updatedEmployee = {
                        ...kra.employee,
                        extraLeaves: (kra.employee.extraLeaves || 0) + extraLeaves
                    };
                    return { ...kra, employee: updatedEmployee };
                }
                return kra;
            });
        });
        const employee = employees.find(e => e.id === selectedEmployeeForExtra);
        toast({ title: 'Success', description: `Added ${extraLeaves} extra leaves to ${employee?.name}'s account.` });
        setSelectedEmployeeForExtra('');
        setExtraLeaves(0);
    }

    const { availableYears, availableMonths } = React.useMemo(() => {
        const years = new Set<number>();
        leaves.forEach(leave => {
            years.add(getYear(new Date(leave.startDate)));
        });
        const monthMap = [
            'January', 'February', 'March', 'April', 'May', 'June', 
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return {
            availableYears: Array.from(years).sort((a,b) => b - a),
            availableMonths: monthMap
        };
    }, [leaves]);

    const filteredLeaves = React.useMemo(() => {
        let leavesToFilter = leaves;
        if (pagePermission === 'employee_only' && currentUser) {
            leavesToFilter = leaves.filter(l => l.employee.id === currentUser.id);
        }
        return leavesToFilter.filter(leave => {
            const statusMatch = statusFilter === 'all' || leave.status === statusFilter;
            const yearMatch = yearFilter === 'all' || getYear(new Date(leave.startDate)) === parseInt(yearFilter);
            const monthMatch = monthFilter === 'all' || getMonth(new Date(leave.startDate)) === parseInt(monthFilter);
            return statusMatch && yearMatch && monthMatch;
        }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }, [leaves, statusFilter, yearFilter, monthFilter, pagePermission, currentUser]);
    
    const handleViewChange = (newView: 'list' | 'grid') => {
        setView(newView);
        localStorage.setItem('leaveView', newView);
    };

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold">Leave Account</h1>

            {pagePermission === 'download' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Leave Balance Overview</CardTitle>
                        <CardDescription>View current leave balances for all employees and grant extra leaves.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className='grid grid-cols-3 gap-6'>
                            <div className='col-span-2'>
                                <div className="border rounded-lg max-h-80 overflow-y-auto">
                                    <Table>
                                        <TableHeader className='sticky top-0 bg-background'>
                                            <TableRow>
                                                <TableHead>Employee</TableHead>
                                                <TableHead>Total Leaves</TableHead>
                                                <TableHead>Leaves Taken</TableHead>
                                                <TableHead>Balance</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {employees.map(emp => {
                                                const balance = leaveBalances.find(b => b.employeeId === emp.id);
                                                return (
                                                    <TableRow key={emp.id}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-8 w-8">
                                                                <AvatarImage src={emp.avatarUrl} alt={emp.name} />
                                                                <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                                <span className="font-medium">{emp.name}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{balance?.totalLeaves.toFixed(1)}</TableCell>
                                                        <TableCell>{balance?.leavesTaken.toFixed(1)}</TableCell>
                                                        <TableCell className='font-semibold'>{balance?.balance.toFixed(1)}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                            <div className='col-span-1'>
                                <Card className='bg-muted/50'>
                                    <CardHeader>
                                        <CardTitle className='text-base'>Grant Extra Leaves</CardTitle>
                                    </CardHeader>
                                    <CardContent className='space-y-4'>
                                        <div className='space-y-1.5'>
                                            <Label>Employee</Label>
                                            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                                <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={comboboxOpen}
                                                    className="w-full justify-between bg-background"
                                                >
                                                    {selectedEmployeeForExtra
                                                    ? employees.find((emp) => emp.id === selectedEmployeeForExtra)?.name
                                                    : "Select employee..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search employee..."/>
                                                    <CommandList>
                                                        <CommandEmpty>No employee found.</CommandEmpty>
                                                        <CommandGroup>
                                                        {employees.map((employee) => (
                                                            <CommandItem
                                                            key={employee.id}
                                                            value={employee.name}
                                                            onSelect={() => {
                                                                setSelectedEmployeeForExtra(employee.id)
                                                                setComboboxOpen(false);
                                                            }}
                                                            >
                                                            <Check
                                                                className={cn(
                                                                "mr-2 h-4 w-4",
                                                                employee.id === selectedEmployeeForExtra ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {employee.name}
                                                            </CommandItem>
                                                        ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                         <div className='space-y-1.5'>
                                            <Label>Number of Leaves</Label>
                                            <Input 
                                                type='number'
                                                value={extraLeaves}
                                                onChange={(e) => setExtraLeaves(Number(e.target.value))}
                                                placeholder='e.g., 2'
                                                className='bg-background'
                                            />
                                         </div>
                                         <Button onClick={handleAddExtraLeaves} className='w-full'>Add Leaves</Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <div className='flex items-center gap-4'>
                        <Plane className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>Leave Requests</CardTitle>
                            <CardDescription>
                                Manage and track all employee leave requests.
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {pagePermission !== 'employee_only' && <ViewSwitcher view={view} onViewChange={handleViewChange} />}
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
                            </SelectContent>
                        </Select>
                        <AddLeaveRequestDialog employees={employees} onSave={handleSaveLeave}>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Request
                            </Button>
                        </AddLeaveRequestDialog>
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
                    ) : view === 'list' || pagePermission === 'employee_only' ? (
                        <LeaveRequestsTable 
                            leaves={filteredLeaves} 
                            onSave={handleSaveLeave}
                            onDelete={handleDeleteLeave}
                            employees={employees}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredLeaves.map(leave => (
                                <LeaveCard
                                    key={leave.id}
                                    leave={leave}
                                    onSave={handleSaveLeave}
                                    onDelete={handleDeleteLeave}
                                    employees={employees}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
