
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockKras } from '@/lib/data';
import Link from 'next/link';
import type { Employee } from '@/lib/types';


export default function Dashboard() {
  const employees: Employee[] = Array.from(new Map(mockKras.map(kra => [kra.employee.id, kra.employee])).values());

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Employees</CardTitle>
          <CardDescription>
            Select an employee to view their Key Result Areas.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {employees.map((employee) => (
                <Link href={`/employees/${employee.id}`} key={employee.id}>
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={employee.avatarUrl} alt={employee.name} data-ai-hint="people" />
                                <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle>{employee.name}</CardTitle>
                                <CardDescription>View KRAs</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>
              ))}
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
