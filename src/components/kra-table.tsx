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
import { format } from 'date-fns';
import { AddKraDialog } from './add-kra-dialog';

const statusStyles: Record<KRAStatus, string> = {
  'On Track': 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800',
  'At Risk': 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800',
  Completed: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
  Pending: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700',
};

export function KraTable() {
  const [kras, setKras] = React.useState<KRA[]>(mockKras);

  const handleUpdateKra = (updatedKra: KRA) => {
    setKras((prevKras) =>
      prevKras.map((kra) => (kra.id === updatedKra.id ? updatedKra : kra))
    );
  };
  
  const handleAddKra = (newKra: KRA) => {
    setKras((prevKras) => [...prevKras, newKra]);
  };


  const handleDeleteKra = (kraId: string) => {
    setKras((prevKras) => prevKras.filter((kra) => kra.id !== kraId));
  };


  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead className="hidden md:table-cell">Task</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden md:table-cell w-[20%]">Progress</TableHead>
          <TableHead className="hidden md:table-cell">Score</TableHead>
          <TableHead className="hidden md:table-cell">End Date</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {kras.map((kra) => (
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
            <TableCell className="hidden md:table-cell max-w-sm">
                <p className="truncate font-medium">{kra.taskDescription}</p>
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
                {kra.score !== null ? (
                    <span className="font-medium">{kra.score}</span>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {format(kra.endDate, 'MMM d, yyyy')}
            </TableCell>
            <TableCell>
              <AddKraDialog kra={kra} onSave={handleUpdateKra}>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteKra(kra.id)} className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              </AddKraDialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
