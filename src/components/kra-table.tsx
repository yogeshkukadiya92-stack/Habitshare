'use client';

import * as React from 'react';
import { MoreHorizontal } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockKras } from '@/lib/data';
import type { KRA, KRAStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format, getMonth, getYear } from 'date-fns';
import { AddKraDialog } from './add-kra-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const statusStyles: Record<KRAStatus, string> = {
  'On Track': 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800',
  'At Risk': 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800',
  Completed: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
  Pending: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700',
};

interface KraTableProps {
    employeeId?: string;
}

const calculateMonthlyScore = (kra: KRA): number | null => {
    if (kra.target && kra.achieved) {
        return Math.round((kra.achieved / kra.target) * 100);
    }

    if (kra.weeklyScores && kra.weeklyScores.length > 0) {
        const now = new Date();
        const currentMonthScores = kra.weeklyScores
            .filter(ws => getYear(new Date(ws.date)) === getYear(now) && getMonth(new Date(ws.date)) === getMonth(now))
            .map(ws => ws.score);

        if (currentMonthScores.length > 0) {
            const avgScore = currentMonthScores.reduce((sum, score) => sum + score, 0) / currentMonthScores.length;
            return Math.round(avgScore);
        }
    }

    return kra.score;
}

export function KraTable({ employeeId }: KraTableProps) {
  const [kras, setKras] = React.useState<KRA[]>(() => {
    if (employeeId) {
        return mockKras.filter(kra => kra.employee.id === employeeId);
    }
    return mockKras;
  });

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


  return (
     <TooltipProvider>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Task</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden md:table-cell">Progress</TableHead>
          <TableHead className="hidden md:table-cell">Sales</TableHead>
          <TableHead>Weekly Scores</TableHead>
          <TableHead>Monthly Score</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {kras.map((kra) => {
          const monthlyScore = calculateMonthlyScore(kra);
          const weeklyScores = kra.weeklyScores || [];
          return (
          <TableRow key={kra.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={kra.employee.avatarUrl} alt={kra.employee.name} data-ai-hint="people" />
                  <AvatarFallback>{kra.employee.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="font-medium">{kra.employee.name}</div>
              </div>
            </TableCell>
            <TableCell className="max-w-sm">
                <p className="truncate font-medium">{kra.taskDescription}</p>
                 <p className="text-xs text-muted-foreground">Due: {format(kra.endDate, 'MMM d, yyyy')}</p>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className={cn(statusStyles[kra.status])}>
                {kra.status}
              </Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <div className="flex items-center gap-2">
                <Progress value={kra.progress} aria-label={`${kra.progress}% complete`} className="h-2" />
                <span className="text-xs text-muted-foreground">{kra.progress}%</span>
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {kra.target ? (
                <div>
                  <span className="font-medium">{kra.achieved ?? 0}</span>
                  <span className="text-xs text-muted-foreground"> / {kra.target}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell>
                 {weeklyScores.length > 0 ? (
                    <div className="flex items-center gap-1">
                      {weeklyScores.slice(-4).map((ws, index) => (
                        <Tooltip key={index}>
                          <TooltipTrigger asChild>
                            <Badge variant="secondary">{ws.score}</Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{format(new Date(ws.date), 'MMM d, yyyy')}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
            </TableCell>
            <TableCell>
                {monthlyScore !== null ? (
                    <span className="font-medium">{monthlyScore}</span>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )}
            </TableCell>
            <TableCell>
               <AddKraDialog kra={kra} onSave={handleSaveKra}>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                       <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteKra(kra.id)} className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </AddKraDialog>
            </TableCell>
          </TableRow>
          );
        })}
      </TableBody>
    </Table>
     <div className="hidden">
        {/* This is a hack to allow adding new KRAs. The AddKraDialog for adding is not rendered visibly.
            The button in the header will trigger this dialog. */}
        <AddKraDialog onSave={handleSaveKra}>
            <button id="add-kra-dialog-trigger-hack"></button>
        </AddKraDialog>
    </div>
    </TooltipProvider>
  );
}
