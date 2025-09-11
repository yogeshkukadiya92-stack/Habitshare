

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Download, PlusCircle, Upload } from "lucide-react";
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
import { ViewSwitcher } from '@/components/view-switcher';
import { RecruitCard } from '@/components/recruit-card';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useDataStore } from '@/hooks/use-data-store';

export default function RecruitmentPage() {
    const { recruits, loading, handleSaveRecruit } = useDataStore();
    const [statusFilter, setStatusFilter] = React.useState('all');
    const { getPermission } = useAuth();
    const pagePermission = getPermission('recruitment');
    const [view, setView] = React.useState<'list' | 'grid'>('list');
    const { toast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        try {
             const savedView = localStorage.getItem('recruitView');
            if (savedView === 'grid' || savedView === 'list') {
                setView(savedView);
            }
        } catch (error) {
            console.error("Failed to parse data from localStorage", error);
        }
    }, []);

    const handleDeleteRecruit = (recruitId: string) => {
        // This needs to be implemented in the data store
        console.log("Delete recruit action triggered for", recruitId);
    };

    const filteredRecruits = React.useMemo(() => {
        return recruits.filter(recruit => {
            return statusFilter === 'all' || recruit.status === statusFilter;
        });
    }, [recruits, statusFilter]);

    const handleViewChange = (newView: 'list' | 'grid') => {
        setView(newView);
        localStorage.setItem('recruitView', newView);
    };

    const handleExport = () => {
        const dataToExport = recruits.map(r => ({
            'Name': r.name,
            'Email': r.email,
            'Phone': r.phone,
            'Position': r.position,
            'Branch': r.branch,
            'Applied Date': format(new Date(r.appliedDate), 'yyyy-MM-dd'),
            'Status': r.status,
            'Notes': r.notes,
            'Comment': r.comment,
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Recruits');
        XLSX.writeFile(workbook, `RecruitmentData_${format(new Date(), 'yyyyMMdd')}.xlsx`);
        toast({ title: "Export Successful", description: "Recruitment data has been exported." });
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet) as any[];

                const importedRecruits: Recruit[] = json.map((row, index) => {
                     const dateStr = row['Applied Date'];
                     const date = new Date(dateStr);
                     if(isNaN(date.getTime())){
                        throw new Error(`Row ${index + 2}: Invalid date format for "${dateStr}". Use YYYY-MM-DD.`);
                    }

                    return {
                        id: `${row['Name']}-${format(date, 'yyyy-MM-dd')}`, // unique id
                        name: row['Name'],
                        email: row['Email'],
                        phone: row['Phone'],
                        position: row['Position'],
                        branch: row['Branch'],
                        appliedDate: date,
                        status: row['Status'] || 'Applied',
                        notes: row['Notes'],
                        comment: row['Comment'],
                        avatarUrl: `https://placehold.co/32x32.png?text=${row['Name']?.charAt(0) || 'A'}`
                    };
                });

                importedRecruits.forEach(handleSaveRecruit);
                toast({ title: "Import Successful", description: `${json.length} recruits have been imported.` });

            } catch(error: any) {
                toast({ title: "Import Failed", description: error.message, variant: 'destructive' });
            } finally {
                if(fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsArrayBuffer(file);
    };

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
                        <ViewSwitcher view={view} onViewChange={handleViewChange} />
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="Applied">Applied</SelectItem>
                                <SelectItem value="Screening">Screening</SelectItem>
                                <SelectItem value="Interview">Interview</SelectItem>
                                <SelectItem value="Second Round">Second Round</SelectItem>
                                <SelectItem value="Offered">Offered</SelectItem>
                                <SelectItem value="Hired">Hired</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                                <SelectItem value="Comment">Comment</SelectItem>
                            </SelectContent>
                        </Select>
                        {pagePermission === 'download' && (
                            <>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImport}
                                    className="hidden"
                                    accept=".xlsx, .xls"
                                />
                                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Import
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleExport}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Export
                                </Button>
                            </>
                        )}
                        {(pagePermission === 'edit' || pagePermission === 'download') && (
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
                    ) : view === 'list' ? (
                        <RecruitmentTable
                            recruits={filteredRecruits}
                            onSave={handleSaveRecruit}
                            onDelete={handleDeleteRecruit}
                            canEdit={pagePermission === 'edit' || pagePermission === 'download'}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                           {filteredRecruits.map(recruit => (
                                <RecruitCard 
                                    key={recruit.id}
                                    recruit={recruit}
                                    onSave={handleSaveRecruit}
                                    onDelete={handleDeleteRecruit}
                                    canEdit={pagePermission === 'edit' || pagePermission === 'download'}
                                />
                           ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
