import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function IncrementsPage() {
  return (
    <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Increment Management</h1>
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle>Evaluations & Increments</CardTitle>
                    <CardDescription>
                        Review employee performance based on KRA scores and manage salary increments.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-12 border-2 border-dashed rounded-lg">
                    <p className="text-lg font-medium">This feature is under development.</p>
                    <p className="mt-2 max-w-md">
                        The full increment management module will be available soon, allowing you to generate reports and process increments based on KRA performance data.
                    </p>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}
