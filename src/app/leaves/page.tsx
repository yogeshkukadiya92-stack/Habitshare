
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, PlusCircle } from "lucide-react";
import { mockKras, mockLeaves } from '@/lib/data';
import type { Employee, Leave, KRA } from '@/lib/types';
import { Button } from '@/components/ui/button';
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

export default function LeaveManagementPage() {
    const [kras, setKras] = React.useState<KRA[]>([]);
    const [leaves, setLeaves] = React.useState<Leave[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [statusFilter, setStatusFilter] = React.useState('all');

    const employees: Employee[] = React.useMemo(() => {
        return Array.from(new Map(kras.map(kra => [kra.employee.id, kra.employee])).values());
    }, [kras]);

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

            const savedLeaves = sessionStorage.getItem('leaveData');
            if (savedLeaves) {
                setLeaves(JSON.parse(savedLeaves, (key, value) => {
                    if (['startDate', 'endDate'].includes(key) && value) {
                        return new Date(value);
                    }
                    return value;
                }));
            } else {
                setLeaves(mockLeaves);
            }

        } catch (error) {
            console.error("Failed to parse data from sessionStorage", error);
            setKras(mockKras);
            setLeaves(mockLeaves);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        if (!loading) {
            sessionStorage.setItem('leaveData', JSON.stringify(leaves));
        }
    }, [leaves, loading]);

    const handleSaveLeave = (leaveToSave: Leave) => {
        setLeaves((prevLeaves) => {
            const exists = prevLeaves.some(l => l.id === leaveToSave.id);
            if (exists) {
                return prevLeaves.map((leave) => (leave.id === leaveToSave.id ? leaveToSave : leave));
            }
            return [leaveToSave, ...prevLeaves].sort((a,b) => b.startDate.getTime() - a.startDate.getTime());
        });
    };

    const handleDeleteLeave = (leaveId: string) => {
        setLeaves((prevLeaves) => prevLeaves.filter((leave) => leave.id !== leaveId));
    };

    const filteredLeaves = React.useMemo(() => {
        return leaves.filter(leave => {
            const statusMatch = statusFilter === 'all' || leave.status === statusFilter;
            return statusMatch;
        }).sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
    }, [leaves, statusFilter]);

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold">Leave Management</h1>
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
                    ) : (
                        <LeaveRequestsTable 
                            leaves={filteredLeaves} 
                            onSave={handleSaveLeave}
                            onDelete={handleDeleteLeave}
                            employees={employees}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
