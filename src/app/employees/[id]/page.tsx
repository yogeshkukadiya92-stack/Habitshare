
'use client';

import * as React from 'react';
import { KraTable } from '@/components/kra-table';
import { mockKras } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Employee, KRA } from '@/lib/types';
import { AddKraDialog } from '@/components/add-kra-dialog';


export default function EmployeeKraPage({ params }: { params: { id: string } }) {
  const [kras, setKras] = React.useState<KRA[]>(mockKras);

  const handleSaveKra = (kraToSave: KRA) => {
    setKras((prevKras) => {
      const exists = prevKras.some(k => k.id === kraToSave.id);
      if (exists) {
        return prevKras.map((kra) => (kra.id === kraToSave.id ? kraToSave : kra));
      }
      return [...prevKras, kraToSave];
    });
  };

  const handleDeleteKra = (kraId: string) => {
    setKras((prevKras) => prevKras.filter((kra) => kra.id !== kraId));
  };
  
  const employees: Employee[] = Array.from(new Map(kras.map(kra => [kra.employee.id, kra.employee])).values());
  const employeeKras = kras.filter((kra) => kra.employee.id === params.id);
  const employee = employees.find(e => e.id === params.id);

  return (
    <div className="flex flex-col gap-4">
        <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <Button variant="outline" size="sm" className='gap-2'>
                <ArrowLeft className="h-4 w-4" />
                Back to Employees
            </Button>
        </Link>
        {employee && (
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={employee.avatarUrl} alt={employee.name} data-ai-hint="people" />
                          <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle>{employee.name}</CardTitle>
                            <CardDescription>
                                Key Result Areas
                            </CardDescription>
                        </div>
                    </div>
                     <AddKraDialog onSave={handleSaveKra} employees={employees}>
                        <Button>Add KRA</Button>
                    </AddKraDialog>
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
        )}
        {!employee && (
             <Card>
                <CardHeader>
                    <CardTitle>Employee Not Found</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>The requested employee could not be found.</p>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
