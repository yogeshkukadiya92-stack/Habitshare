
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { KraTable } from '@/components/kra-table';
import { mockKras } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Trash2, Edit, Mail, Home, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Employee, KRA, Branch } from '@/lib/types';
import { AddKraDialog } from '@/components/add-kra-dialog';
import { KraProgressChart } from '@/components/kra-progress-chart';
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
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { EditEmployeeDialog } from '@/components/edit-employee-dialog';


export default function EmployeeKraPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;
  
  const [kras, setKras] = React.useState<KRA[]>([]);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    try {
      const savedKras = sessionStorage.getItem('kraData');
      if (savedKras) {
        setKras(JSON.parse(savedKras, (key, value) => {
          if (['startDate', 'endDate', 'dueDate', 'joiningDate'].includes(key) && value) {
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

  const handleSaveEmployee = (employeeToSave: Employee) => {
    setKras(prevKras => {
        return prevKras.map(kra => {
            if (kra.employee.id === employeeToSave.id) {
                return { ...kra, employee: employeeToSave };
            }
            return kra;
        });
    });
  };

  const handleDeleteKra = (kraId: string) => {
    setKras((prevKras) => prevKras.filter((kra) => kra.id !== kraId));
  };

  const handleDeleteEmployee = () => {
    const updatedKras = kras.filter(kra => kra.employee.id !== id);
    setKras(updatedKras);
    
    toast({
        title: "Employee Deleted",
        description: "The employee and all their associated KRAs have been removed.",
    });

    router.push('/employees');
  };
  
  const employees: Employee[] = Array.from(new Map(kras.map(kra => [kra.employee.id, kra.employee])).values());
  const employeeKras = kras.filter((kra) => kra.employee.id === id);
  const employee = employees.find(e => e.id === id);

  const isManager = React.useMemo(() => {
    return branches.some(b => b.managerId === id);
  }, [branches, id]);

  if (loading) {
    return (
        <div className="flex flex-col gap-4">
            <Skeleton className="h-9 w-36" />
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-md">
                         <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div>
                                    <Skeleton className="h-6 w-32 mb-2" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                             <div className="flex items-center gap-2">
                                <Skeleton className="h-10 w-24" />
                                <Skeleton className="h-10 w-10" />
                            </div>
                        </CardHeader>
                        <CardContent>
                             <div className="space-y-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                             </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card className="shadow-md">
                        <CardHeader>
                           <Skeleton className="h-6 w-48 mb-2" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                        </CardContent>
                    </Card>
                    <Card className="shadow-md">
                        <CardHeader>
                           <Skeleton className="h-6 w-48 mb-2" />
                           <Skeleton className="h-4 w-64" />
                        </CardHeader>
                        <CardContent className="flex items-center justify-center h-[250px]">
                             <Skeleton className="h-48 w-48 rounded-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
  }

  return (
    <TooltipProvider>
    <div className="flex flex-col gap-4">
        <Link href="/employees" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <Button variant="outline" size="sm" className='gap-2'>
                <ArrowLeft className="h-4 w-4" />
                Back to Employees
            </Button>
        </Link>
        {employee ? (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12">
                                <AvatarImage src={employee.avatarUrl} alt={employee.name} data-ai-hint="people" />
                                <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className='flex items-center gap-2'>
                                     <CardTitle>{employee.name}</CardTitle>
                                       {isManager && (
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
                                    <CardDescription>
                                        {employee.branch ? `${employee.branch} Branch` : 'No branch assigned'}
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <AddKraDialog onSave={handleSaveKra} employees={employees}>
                                    <Button>Add KRA</Button>
                                </AddKraDialog>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon">
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete Employee</span>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the
                                            employee and all of their associated KRAs.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteEmployee} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <KraTable 
                                kras={employeeKras}
                                employees={employees}
                                onSave={handleSaveKra}
                                onDelete={handleDeleteKra}
                            />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                     <Card>
                        <CardHeader className='flex-row items-center justify-between pb-2'>
                            <CardTitle className='text-base'>
                                Employee Information
                            </CardTitle>
                             <EditEmployeeDialog employee={employee} onSave={handleSaveEmployee}>
                                <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </EditEmployeeDialog>
                        </CardHeader>
                        <CardContent className='text-sm space-y-3 pt-4'>
                            <div className='flex items-center gap-3'>
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{employee.email || 'Not provided'}</span>
                            </div>
                            <div className='flex items-start gap-3'>
                                <Home className="h-4 w-4 text-muted-foreground mt-1" />
                                <span>{employee.address || 'Not provided'}</span>
                            </div>
                            <div className='flex items-center gap-3'>
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span>Joined on {employee.joiningDate ? format(new Date(employee.joiningDate), "MMM d, yyyy") : 'Not provided'}</span>
                            </div>
                        </CardContent>
                    </Card>
                    <KraProgressChart kras={employeeKras} />
                </div>
            </div>
        ) : (
             <Card>
                <CardHeader>
                    <CardTitle>Employee Not Found</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>The requested employee could not be found. They may have been deleted.</p>
                </CardContent>
            </Card>
        )}
    </div>
    </TooltipProvider>
  );
}
