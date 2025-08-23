import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function EmployeesPage() {
  return (
    <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Employee Management</h1>
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <Users className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle>Employees</CardTitle>
                    <CardDescription>
                        View and manage employee information.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-12 border-2 border-dashed rounded-lg">
                    <p className="text-lg font-medium">This feature is under development.</p>
                    <p className="mt-2 max-w-md">
                        The full employee management module will be available soon, allowing you to add, edit, and view employee details and their assigned KRAs.
                    </p>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}
