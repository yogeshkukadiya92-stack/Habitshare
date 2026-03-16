
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Employee, KRA } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { ShieldCheck, Eye, Fingerprint, Trophy, Sparkles } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Link from 'next/link';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface EmployeeSummary {
    employee: Employee;
    kraCount: number;
    averagePerformance: number;
}

interface EmployeeCardProps {
  summary: EmployeeSummary;
  isWinner?: boolean;
}

export function EmployeeCard({ summary, isWinner }: EmployeeCardProps) {
    const { employee, kraCount, averagePerformance } = summary;
  return (
    <Card className={cn("flex flex-col h-full transition-all duration-300", isWinner && "border-amber-400 shadow-md ring-1 ring-amber-400/50 bg-amber-50/10")}>
      <CardHeader className="p-3">
        <div className="flex items-center gap-3">
            <div className="relative">
                <Avatar className={cn("h-10 w-10 shrink-0", isWinner && "ring-2 ring-amber-400 ring-offset-1")}>
                    <AvatarImage src={employee.avatarUrl} alt={employee.name} data-ai-hint="people" />
                    <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {isWinner && (
                    <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white rounded-full p-0.5 shadow-sm">
                        <Trophy className="h-2.5 w-2.5" />
                    </div>
                )}
            </div>
            <div className='min-w-0'>
                 <div className='flex items-center gap-1.5'>
                    <CardTitle className="text-xs font-bold truncate">{employee.name}</CardTitle>
                    {employee.isManager && (
                        <Tooltip>
                            <TooltipTrigger>
                                <ShieldCheck className="h-3 w-3 text-primary" />
                            </TooltipTrigger>
                            <TooltipContent className="text-[10px]">Branch Manager</TooltipContent>
                        </Tooltip>
                    )}
                 </div>
                <CardDescription className='flex flex-col text-[10px] leading-tight mt-0.5'>
                    <span className="truncate">{employee.branch || 'No dept.'}</span>
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 p-3 pt-0">
         <div>
            <div className="flex justify-between items-center mb-1 text-[10px]">
                <span className="font-medium text-muted-foreground">Score</span>
                <span className={cn("font-bold", averagePerformance >= 80 ? 'text-emerald-600' : averagePerformance >= 50 ? 'text-amber-600' : 'text-rose-600')}>{averagePerformance}%</span>
            </div>
            <Progress value={averagePerformance} className="h-1" />
        </div>
        <div className="flex items-center justify-between">
             <span className="text-[10px] font-medium text-muted-foreground">KRA Count</span>
             <Badge variant="secondary" className='text-[10px] h-4 px-1.5 font-bold'>{kraCount}</Badge>
        </div>
        {isWinner && (
            <div className="flex items-center gap-1 text-amber-600 text-[9px] font-bold uppercase tracking-wider mt-1 bg-amber-100/50 p-1 rounded">
                <Sparkles className="h-2.5 w-2.5" /> Top Performer
            </div>
        )}
      </CardContent>
      <CardFooter className="p-3 pt-0">
        <Link href={`/employees/${employee.id}`} className='w-full'>
            <Button variant="outline" size="sm" className='w-full h-7 text-[10px] font-semibold gap-1.5'>
                <Eye className="h-3 w-3" />
                View Profile
            </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
