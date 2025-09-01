
'use client';

import * as React from 'react';
import { MoreHorizontal, Trash2, Edit } from 'lucide-react';
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
import type { Holiday } from '@/lib/types';
import { format } from 'date-fns';
import { AddHolidayDialog } from './add-holiday-dialog';

interface HolidaysTableProps {
    holidays: Holiday[];
    isAdmin: boolean;
    onSave: (holiday: Holiday) => void;
    onDelete: (id: string) => void;
}

export function HolidaysTable({ holidays, isAdmin, onSave, onDelete }: HolidaysTableProps) {
  
  const sortedHolidays = [...holidays].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Holiday Name</TableHead>
              <TableHead>Type</TableHead>
              {isAdmin && (
                <TableHead>
                    <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedHolidays.length === 0 && (
                <TableRow>
                    <TableCell colSpan={isAdmin ? 5 : 4} className="h-24 text-center">
                        No holidays found for this year.
                    </TableCell>
                </TableRow>
            )}
            {sortedHolidays.map((holiday) => {
               return(
              <TableRow key={holiday.id}>
                <TableCell className="font-medium">{format(new Date(holiday.date), 'MMMM d, yyyy')}</TableCell>
                <TableCell>{format(new Date(holiday.date), 'EEEE')}</TableCell>
                <TableCell>{holiday.name}</TableCell>
                <TableCell>
                  <Badge variant={holiday.type === 'Half Day' ? 'secondary' : 'outline'}>
                    {holiday.type}
                  </Badge>
                </TableCell>
                {isAdmin && (
                    <TableCell className="text-right">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <AddHolidayDialog holiday={holiday} onSave={onSave}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Edit className="mr-2 h-4 w-4"/>
                                    Edit
                                </DropdownMenuItem>
                            </AddHolidayDialog>
                            <DropdownMenuItem onClick={() => onDelete(holiday.id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                )}
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </div>
  );
}

