
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, PlusCircle } from "lucide-react";
import { mockRecruits } from '@/lib/data';
import type { Recruit } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RecruitmentTable } from '@/components/recruitment-table';
import { AddRecruitDialog } from '@/components/add-recruit-dialog';
import { useAuth } from '@/components/auth-provider';

export default function RecruitmentPage() {
    const [recruits, setRecruits] = React.useState<Recruit[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [statusFilter, setStatusFilter] = React.useState('all');
    const { currentUserRole } = useAuth();
    const isAdmin = currentUserRole === 'Admin';

    React.useEffect(() => {
        try {
            const savedRecruits = sessionStorage.getItem('recruitmentData');
            if (savedRecruits) {
                setRecruits(JSON.parse(savedRecruits, (key, value) => {
                    if (['appliedDate'].includes(key) && value) {
                        return new Date(value);
                    }
                    return value;
                }));
            } else {
                setRecruits(mockRecruits);
            }

        } catch (error) {
            console.error("Failed to parse data from sessionStorage", error);
            setRecruits(mockRecruits);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        if (!loading) {
            sessionStorage.setItem('recruitmentData', JSON.stringify(recruits));
        }
    }, [recruits, loading]);

    const handleSaveRecruit = (recruitToSave: Recruit) => {
        setRecruits((prevRecruits) => {
            const exists = prevRecruits.some(r => r.id === recruitToSave.id);
            const updatedRecruits = exists 
                ? prevRecruits.map((recruit) => (recruit.id === recruitToSave.id ? recruitToSave : recruit))
                : [...prevRecruits, recruitToSave];
            
            return updatedRecruits.sort((a,b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
        });
    };

    const handleDeleteRecruit = (recruitId: string) => {
        setRecruits((prevRecruits) => prevRecruits.filter((recruit) => recruit.id !== recruitId));
    };

    const filteredRecruits = React.useMemo(() => {
        return recruits.filter(recruit => {
            return statusFilter === 'all' || recruit.status === statusFilter;
        });
    }, [recruits, statusFilter]);

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold">Recruitment Data Bank</h1>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <div className='flex items-center gap-4'>
                        <Briefcase className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>Candidates</CardTitle>
                            <CardDescription>
                                Manage all job applicants and their statuses.
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="Applied">Applied</SelectItem>
                                <SelectItem value="Screening">Screening</SelectItem>
                                <SelectItem value="Interview">Interview</SelectItem>
                                <SelectItem value="Offered">Offered</SelectItem>
                                <SelectItem value="Hired">Hired</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        {isAdmin && (
                            <AddRecruitDialog onSave={handleSaveRecruit}>
                                <Button>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Candidate
                                </Button>
                            </AddRecruitDialog>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                         <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                         </div>
                    ) : (
                        <RecruitmentTable
                            recruits={filteredRecruits}
                            onSave={handleSaveRecruit}
                            onDelete={handleDeleteRecruit}
                            isAdmin={isAdmin}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
