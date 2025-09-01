
'use client';

import * as React from 'react';
import { MoreHorizontal, Edit, Trash2, CheckCircle, XCircle, Hourglass, Briefcase, UserCheck, Send } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Recruit, RecruitmentStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { AddRecruitDialog } from './add-recruit-dialog';

const statusConfig: Record<RecruitmentStatus, { className: string; icon: React.ElementType }> = {
  'Applied': { className: 'bg-blue-100 text-blue-800 border-blue-200', icon: Send },
  'Screening': { className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Hourglass },
  'Interview': { className: 'bg-purple-100 text-purple-800 border-purple-200', icon: Briefcase },
  'Offered': { className: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  'Hired': { className: 'bg-green-200 text-green-900 border-green-300 font-semibold', icon: UserCheck },
  'Rejected': { className: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
};

interface RecruitmentTableProps {
    recruits: Recruit[];
    isAdmin: boolean;
    onSave: (recruit: Recruit) => void;
    onDelete: (id: string) => void;
}

export function RecruitmentTable({ recruits, isAdmin, onSave, onDelete }: RecruitmentTableProps) {
  
  return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Position Applied</TableHead>
              <TableHead>Applied On</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && (
                <TableHead>
                    <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {recruits.length === 0 && (
                <TableRow>
                    <TableCell colSpan={isAdmin ? 6 : 5} className="h-24 text-center">
                        No candidates found.
                    </TableCell>
                </TableRow>
            )}
            {recruits.map((recruit) => {
                const StatusIcon = statusConfig[recruit.status].icon;
               return(
              <TableRow key={recruit.id}>
                 <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={recruit.avatarUrl} alt={recruit.name} data-ai-hint="people" />
                      <AvatarFallback>{recruit.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{recruit.name}</div>
                  </div>
                </TableCell>
                <TableCell>
                    <div className="text-sm text-muted-foreground">{recruit.email}</div>
                    <div className="text-sm text-muted-foreground">{recruit.phone}</div>
                </TableCell>
                <TableCell className="font-medium">{recruit.position}</TableCell>
                <TableCell>{format(new Date(recruit.appliedDate), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn('gap-1.5 w-28 justify-center', statusConfig[recruit.status].className)}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {recruit.status}
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
                            <AddRecruitDialog recruit={recruit} onSave={onSave}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Edit className="mr-2 h-4 w-4"/>
                                    Edit
                                </DropdownMenuItem>
                            </AddRecruitDialog>
                            <DropdownMenuItem onClick={() => onDelete(recruit.id)} className="text-destructive">
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
