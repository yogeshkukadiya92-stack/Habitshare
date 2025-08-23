
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Eye } from "lucide-react";
import { mockKras } from '@/lib/data';
import type { Employee, KRA } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';


interface EmployeeSummary {
    employee: Employee;
    kraCount: number;
    averagePerformance: number;
}

export default function EmployeesPage() {
    const [kras, setKras] = React.useState<KRA[]>(() => {
        if (typeof window !== 'undefined') {
            const savedKras = sessionStorage.getItem('kraData');
            if (savedKras) {
                return JSON.parse(savedKras, (key, value) => {
                    if (key === 'startDate' || key === 'endDate' || key === 'date') {
                        return new Date(value);
                    }
                    return value;
                });
            }
        }
        return mockKras;
    });

    const employeeSummary = React.useMemo(() => {
        const employeeMap = new Map<string, { employee: Employee; kras: KRA[] }>();

        kras.forEach(kra => {
            if (!employeeMap.has(kra.employee.id)) {
                employeeMap.set(kra.employee.id, { employee: kra.employee, kras: [] });
            }
            employeeMap.get(kra.employee.id)!.kras.push(kra);
        });
        
        const data: EmployeeSummary[] = [];
        employeeMap.forEach(({ employee, kras }) => {
            const totalWeightage = kras.reduce((sum, kra) => sum + (kra.weightage || 0), 0);
            const totalMarksAchieved = kras.reduce((sum, kra) => sum + (kra.marksAchieved || 0), 0);
            const averagePerformance = totalWeightage > 0 ? Math.round((totalMarksAchieved / totalWeightage) * 100) : 0;
            
            data.push({
                employee,
                kraCount: kras.length,
                averagePerformance
            });
        });

        return data.sort((a, b) => a.employee.name.localeCompare(b.employee.name));

    }, [kras]);


  return (
    <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Employee Management</h1>
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <Users className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle>All Employees</CardTitle>
                    <CardDescription>
                        View and manage all employees in the system.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>KRAs Assigned</TableHead>
                                <TableHead className="w-[200px]">Avg. Performance</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employeeSummary.map(({ employee, kraCount, averagePerformance }) => (
                                <TableRow key={employee.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                            <AvatarImage src={employee.avatarUrl} alt={employee.name} data-ai-hint="people" />
                                            <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="font-medium">{employee.name}</div>
                                        </div>
                                    </TableCell>
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
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}
