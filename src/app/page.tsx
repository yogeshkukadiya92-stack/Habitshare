
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
import Link from 'next/link';
import type { Employee, KRA } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AppSidebar } from '@/components/app-sidebar';
import { Protected } from '@/components/protected';


function DashboardContent() {
  const [kras, setKras] = React.useState<KRA[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedBranch, setSelectedBranch] = React.useState('all');

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
    } catch (error) {
        console.error("Failed to parse KRA data from sessionStorage", error);
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

  const employees: Employee[] = Array.from(new Map(kras.map(kra => [kra.employee.id, kra.employee])).values());
  const branches = ['all', ...Array.from(new Set(employees.map(e => e.branch).filter(Boolean)))];

  const filteredEmployees = selectedBranch === 'all' 
    ? employees 
    : employees.filter(e => e.branch === selectedBranch);

  return (
    <div className="flex gap-4">
        <AppSidebar />
        <div className="flex-1 flex flex-col gap-4">
            <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Employees</CardTitle>
                    <CardDescription>
                    Select an employee to view their Key Result Areas.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by Branch" />
                    </SelectTrigger>
                    <SelectContent>
                        {branches.map(branch => (
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
                    {loading ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-[150px]" />
                                        <Skeleton className="h-4 w-[100px]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredEmployees.map((employee) => (
                            <Link href={`/employees/${employee.id}`} key={employee.id}>
                                <Card className="hover:bg-muted/50 transition-all transform hover:-translate-y-1 shadow-sm hover:shadow-lg">
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={employee.avatarUrl} alt={employee.name} data-ai-hint="people" />
                                            <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-lg">{employee.name}</CardTitle>
                                            <CardDescription>{employee.branch || 'No Branch'}</CardDescription>
                                        </div>
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))}
                    </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

export default function Dashboard() {
    return (
        <Protected>
            <DashboardContent />
        </Protected>
    )
}
