'use client';

import * as React from 'react';
import { MoreHorizontal, Edit, Trash2, CheckCircle, XCircle, Hourglass, Briefcase, UserCheck, Send, MessageSquare, Link as LinkIcon } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import Link from 'next/link';
import { Checkbox } from './ui/checkbox';
import { useDataStore } from '@/hooks/use-data-store';
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


const statusConfig: Record<RecruitmentStatus, { className: string; icon: React.ElementType }> = {
  'Applied': { className: 'bg-blue-100 text-blue-800 border-blue-200', icon: Send },
  'Screening': { className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Hourglass },
  'Interview': { className: 'bg-purple-100 text-purple-800 border-purple-200', icon: Briefcase },
  'Second Round': { className: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Briefcase },
  'Offered': { className: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  'Hired': { className: 'bg-green-200 text-green-900 border-green-300 font-semibold', icon: UserCheck },
  'Rejected': { className: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  'Comment': { className: 'bg-gray-100 text-gray-800 border-gray-200', icon: MessageSquare },
};

interface RecruitmentTableProps {
    recruits: Recruit[];
    canEdit: boolean;
    onSave: (recruit: Recruit) => void;
    onDelete: (id: string) => void;
}

export function RecruitmentTable({ recruits, canEdit, onSave, onDelete }: RecruitmentTableProps) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const { handleDeleteMultipleRecruits } = useDataStore();
  const { toast } = useToast();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(recruits.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleBulkDelete = () => {
    handleDeleteMultipleRecruits(selectedIds);
    setSelectedIds([]);
    toast({ title: "Bulk Delete Successful", description: `${selectedIds.length} candidates removed.` });
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-2 bg-muted rounded-md border border-primary/20">
            <span className="text-sm font-medium">{selectedIds.length} items selected</span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Selected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {selectedIds.length} recruitment records.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={selectedIds.length === recruits.length && recruits.length > 0}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  />
                </TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Position Applied</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Resume</TableHead>
                {canEdit && (
                  <TableHead>
                      <span className="sr-only">Actions</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {recruits.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={canEdit ? 8 : 7} className="h-24 text-center">
                          No candidates found.
                      </TableCell>
                  </TableRow>
              )}
              {recruits.map((recruit) => {
                  const StatusIcon = statusConfig[recruit.status]?.icon || Send;
                 return(
                <TableRow key={recruit.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.includes(recruit.id)}
                      onCheckedChange={(checked) => handleSelectOne(recruit.id, !!checked)}
                    />
                  </TableCell>
                   <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={recruit.avatarUrl} alt={recruit.name} data-ai-hint="people" />
                        <AvatarFallback>{recruit.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                          <div className="font-medium">{recruit.name}</div>
                          <div className="text-xs text-muted-foreground">{recruit.location}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                      <div className="text-sm text-muted-foreground">{recruit.email}</div>
                      <div className="text-sm text-muted-foreground">{recruit.phone}</div>
                  </TableCell>
                  <TableCell>
                      <div className="font-medium">{recruit.position}</div>
                      <div className="text-xs text-muted-foreground">{recruit.branch}</div>
                  </TableCell>
                  <TableCell>
                      <div className="font-medium">{recruit.workExperience}</div>
                      <div className="text-xs text-muted-foreground">{recruit.qualification}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('gap-1.5 w-32 justify-center', statusConfig[recruit.status]?.className)}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {recruit.status}
                    </Badge>
                  </TableCell>
                   <TableCell>
                      {recruit.resumeUrl ? (
                           <Tooltip>
                              <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" asChild>
                                      <Link href={recruit.resumeUrl} target="_blank" rel="noopener noreferrer">
                                          <LinkIcon className="h-4 w-4" />
                                      </Link>
                                  </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                 <p>View Resume</p>
                              </TooltipContent>
                          </Tooltip>
                      ) : (
                          <span className='text-xs text-muted-foreground'>N/A</span>
                      )}
                  </TableCell>
                  {canEdit && (
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
      </div>
    </TooltipProvider>
  );
}
