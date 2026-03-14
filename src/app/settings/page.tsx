'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import type { Branch, Employee, UserRole, EmployeePermissions, PermissionLevel } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, ChevronsUpDown, Edit, PlusCircle, Trash2, KeySquare, Share2, Download, Upload, Fingerprint } from 'lucide-react';
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/auth-provider';
import { EditEmployeeDialog } from '@/components/edit-employee-dialog';
import { useDataStore } from '@/hooks/use-data-store';


const navItems = [
    { id: 'employees', label: 'Employees' },
    { id: 'kras', label: 'KRA Management' },
    { id: 'routine_tasks', label: 'Routine Tasks' },
    { id: 'leaves', label: 'Leave Account' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'expenses', label: 'Expense Claims' },
    { id: 'habit_tracker', label: 'Habit Tracker' },
    { id: 'holidays', label: 'Holidays' },
    { id: 'recruitment', label: 'Recruitment' },
    { id: 'hr_calendar', label: 'HR Calendar' },
    { id: 'settings', label: 'Settings' },
] as const;

const permissionLevels: {value: PermissionLevel, label: string}[] = [
    { value: 'none', label: 'No Access'},
    { value: 'employee_only', label: 'Employee Only'},
    { value: 'view', label: 'View Only'},
    { value: 'edit', label: 'Edit'},
    { value: 'download', label: 'Download (Google Sheets Sync)'},
]

const PermissionDialog = ({
    employee,
    onSave,
    children
}: {
    employee: Employee,
    onSave: (employeeId: string, permissions: EmployeePermissions) => void,
    children: React.ReactNode
}) => {
    const [open, setOpen] = React.useState(false);
    const [permissions, setPermissions] = React.useState<EmployeePermissions>(
        employee.permissions || {
            employees: 'employee_only', kras: 'employee_only', routine_tasks: 'view', leaves: 'employee_only', attendance: 'view', 
            expenses: 'edit', habit_tracker: 'edit', holidays: 'view', recruitment: 'view', hr_calendar: 'view', settings: 'none'
        }
    );

    React.useEffect(() => {
        if(open) {
             setPermissions(employee.permissions || {
                employees: 'employee_only', kras: 'employee_only', routine_tasks: 'view', leaves: 'employee_only', attendance: 'view', 
                expenses: 'edit', habit_tracker: 'edit', holidays: 'view', recruitment: 'view', hr_calendar: 'view', settings: 'none'
            });
        }
    }, [open, employee.permissions]);

    const handleSave = () => {
        onSave(employee.id, permissions);
        setOpen(false);
    }
    
    const handlePermissionChange = (permissionKey: keyof EmployeePermissions, value: PermissionLevel) => {
        setPermissions(prev => ({ ...prev, [permissionKey]: value }));
    };
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Permissions for {employee.name}</DialogTitle>
                    <DialogDescription>
                        Set the access level for each page. 'Download' level enables Google Sheets data sync.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                    {navItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between">
                            <Label htmlFor={item.id} className="font-normal">{item.label}</Label>
                            <Select
                                value={permissions[item.id]}
                                onValueChange={(value: PermissionLevel) => handlePermissionChange(item.id, value)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent>
                                    {permissionLevels.map(level => (
                                        <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>Save Permissions</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


const BranchDialog = ({ 
    branch,
    employees, 
    onSave,
    children
 } : { 
    branch?: Branch,
    employees: Employee[], 
    onSave: (branch: Branch) => void,
    children: React.ReactNode
}) => {
    const [open, setOpen] = React.useState(false);
    const [name, setName] = React.useState('');
    const [managerId, setManagerId] = React.useState<string | undefined>(undefined);
    const [comboboxOpen, setComboboxOpen] = React.useState(false);
    const { toast } = useToast();

    React.useEffect(() => {
        if(open) {
            setName(branch?.name || '');
            setManagerId(branch?.managerId || undefined);
        }
    }, [open, branch]);

    const handleSave = () => {
        if (name.trim() === '') {
            toast({ title: "Error", description: "Branch name cannot be empty.", variant: "destructive" });
            return;
        }
        const branchToSave: Branch = {
            id: branch?.id || uuidv4(),
            name: name.trim(),
            managerId: managerId
        };
        onSave(branchToSave);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{branch ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="manager" className="text-right">Manager</Label>
                        <div className="col-span-3">
                             <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={comboboxOpen}
                                    className="w-full justify-between"
                                >
                                    {managerId
                                    ? employees.find((employee) => employee.id === managerId)?.name
                                    : "Select manager..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search employee..."/>
                                    <CommandList>
                                        <CommandEmpty>No employee found.</CommandEmpty>
                                        <CommandGroup>
                                        {employees.map((employee) => (
                                            <CommandItem
                                            key={employee.id}
                                            value={employee.name}
                                            onSelect={() => {
                                                setManagerId(employee.id)
                                                setComboboxOpen(false);
                                            }}
                                            >
                                            <Check
                                                className={cn(
                                                "mr-2 h-4 w-4",
                                                employee.id === managerId ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {employee.name}
                                            </CommandItem>
                                        ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function SettingsPage() {
    const { employees, branches, loading, handleSaveEmployee, handleSaveBranch, handleDeleteBranch } = useDataStore();
    const { toast } = useToast();
    const { getPermission } = useAuth();
    const pagePermission = getPermission('settings');


    const sortedEmployees = React.useMemo(() => {
         const managerIds = new Set(branches.map(b => b.managerId));
         return employees.map(emp => ({
            ...emp,
            isManager: managerIds.has(emp.id)
        })).sort((a,b) => a.name.localeCompare(b.name));
    }, [employees, branches])


    const onSaveBranchAction = (branchToSave: Branch) => {
        const isEditing = branches.some(b => b.id === branchToSave.id);
        
        if (!isEditing && branches.some(b => b.name.toLowerCase() === branchToSave.name.toLowerCase())) {
            toast({ title: "Error", description: "This branch already exists.", variant: "destructive" });
            return;
        }
        
        handleSaveBranch(branchToSave);

        toast({
            title: isEditing ? "Branch Updated" : "Branch Added",
            description: `Branch "${branchToSave.name}" has been saved.`,
        });
    };


    const onDeleteBranchAction = (branchId: string) => {
        handleDeleteBranch(branchId);
        toast({
            title: "Branch Deleted",
            description: "The branch has been successfully deleted.",
        });
    };

    const handleRoleChange = (employeeId: string, role: UserRole) => {
        const employee = employees.find(e => e.id === employeeId);
        if (employee) {
            handleSaveEmployee({ ...employee, role });
            toast({
                title: "Role Updated",
                description: `Role for ${employee.name} has been changed to ${role}.`
            })
        }
    };
    
    const onSaveEmployeeAction = (employeeToSave: Employee) => {
        handleSaveEmployee(employeeToSave);
    };

    const handlePermissionChange = (employeeId: string, permissions: EmployeePermissions) => {
        const employee = employees.find(e => e.id === employeeId);
        if (employee) {
            handleSaveEmployee({ ...employee, permissions });
            toast({
                title: "Permissions Updated",
                description: `Permissions have been updated for ${employee.name}.`
            })
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold">Settings</h1>
            
            <Card>
                <CardHeader>
                    <div className='flex items-center gap-4'>
                        <Share2 className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>Google Sheets & Excel Integration</CardTitle>
                            <CardDescription>
                                Fully compatible with Google Sheets for advanced reporting and bulk updates.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        You can sync your application data with **Google Sheets** using the **Import/Export** features available on all management pages (Employees, KRA, Tasks, Attendance, etc.).
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg bg-muted/30">
                            <div className='flex items-center gap-2 mb-2'>
                                <Download className="h-4 w-4 text-primary" />
                                <h4 className="font-semibold">Step 1: Export to Sheets</h4>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                1. Go to any page (e.g., Attendance).<br/>
                                2. Click **Export**. An Excel (.xlsx) file will download.<br/>
                                3. Upload this file to **Google Drive** and open it with **Google Sheets**.
                            </p>
                        </div>
                        <div className="p-4 border rounded-lg bg-muted/30">
                            <div className='flex items-center gap-2 mb-2'>
                                <Upload className="h-4 w-4 text-primary" />
                                <h4 className="font-semibold">Step 2: Sync back from Sheets</h4>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                1. In your Google Sheet, go to **File > Download > Microsoft Excel (.xlsx)**.<br/>
                                2. Go back to the application and click **Import**.<br/>
                                3. Select the downloaded file to sync all changes instantly.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className='flex-row items-center justify-between'>
                    <div>
                        <CardTitle>Branch Management</CardTitle>
                        <CardDescription>
                            Add, view, or manage branches and assign managers.
                        </CardDescription>
                    </div>
                    {pagePermission === 'download' && (
                        <BranchDialog onSave={onSaveBranchAction} employees={sortedEmployees}>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Branch
                            </Button>
                        </BranchDialog>
                    )}
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Branch Name</TableHead>
                                    <TableHead>Manager</TableHead>
                                    {pagePermission === 'download' && <TableHead className="text-right w-[100px]">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center">Loading branches...</TableCell>
                                    </TableRow>
                                ) : branches.length > 0 ? (
                                    branches.map((branch) => {
                                        const manager = sortedEmployees.find(e => e.id === branch.managerId);
                                        return (
                                        <TableRow key={branch.id}>
                                            <TableCell className="font-medium">{branch.name}</TableCell>
                                             <TableCell>
                                                {manager ? (
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage src={manager.avatarUrl} alt={manager.name} />
                                                            <AvatarFallback>{manager.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <span>{manager.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">Not Assigned</span>
                                                )}
                                            </TableCell>
                                            {pagePermission === 'download' && (
                                            <TableCell className="text-right">
                                                 <div className="flex items-center justify-end gap-2">
                                                     <BranchDialog branch={branch} onSave={onSaveBranchAction} employees={sortedEmployees}>
                                                        <Button variant="ghost" size="icon">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                     </BranchDialog>
                                                     <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. Deleting this branch might affect employees assigned to it.
                                                            </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => onDeleteBranchAction(branch.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                 </div>
                                            </TableCell>
                                            )}
                                        </TableRow>
                                    )})
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={pagePermission === 'download' ? 3 : 2} className="text-center">No branches found. Add one to get started.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>User & Permission Management</CardTitle>
                    <CardDescription>
                        Assign roles and page access level. 'Download' level enables external spreadsheet sync.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className='w-[100px]'>ID</TableHead>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="w-[200px]">Role</TableHead>
                                    <TableHead className="w-[150px]">Permissions</TableHead>
                                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={6} className="text-center">Loading users...</TableCell></TableRow>
                                ) : sortedEmployees.map(employee => (
                                    <TableRow key={employee.id}>
                                        <TableCell className='font-mono text-xs text-muted-foreground'>{employee.id}</TableCell>
                                        <TableCell>
                                             <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={employee.avatarUrl} alt={employee.name} />
                                                    <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span>{employee.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{employee.email || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Select 
                                                value={employee.role || 'Employee'}
                                                onValueChange={(value: UserRole) => handleRoleChange(employee.id, value)}
                                                disabled={pagePermission !== 'download' || employee.email === 'connect@luvfitnessworld.com'}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Admin">Admin</SelectItem>
                                                    <SelectItem value="Manager">Manager</SelectItem>
                                                    <SelectItem value="Employee">Employee</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                         <TableCell>
                                            <PermissionDialog employee={employee} onSave={handlePermissionChange}>
                                                 <Button variant="outline" size="sm" disabled={pagePermission !== 'download' || employee.email === 'connect@luvfitnessworld.com'}>
                                                    <KeySquare className="mr-2 h-4 w-4" />
                                                    Edit Permissions
                                                </Button>
                                            </PermissionDialog>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <EditEmployeeDialog employee={employee} onSave={onSaveEmployeeAction}>
                                                <Button variant="ghost" size="icon" disabled={pagePermission !== 'download'}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </EditEmployeeDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
