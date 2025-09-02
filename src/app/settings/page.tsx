
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import type { Branch, Employee, KRA, UserRole, EmployeePermissions } from '@/lib/types';
import { mockKras } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, ChevronsUpDown, Edit, PlusCircle, Trash2, UserCog, KeySquare } from 'lucide-react';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/auth-provider';
import { Checkbox } from '@/components/ui/checkbox';


const navItems = [
    { id: 'employees', label: 'Employees' },
    { id: 'routine_tasks', label: 'Routine Tasks' },
    { id: 'leaves', label: 'Leave Management' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'expenses', label: 'Expense Claims' },
    { id: 'habit_tracker', label: 'Habit Tracker' },
    { id: 'holidays', label: 'Holidays' },
    { id: 'recruitment', label: 'Recruitment' },
    { id: 'hr_calendar', label: 'HR Calendar' },
    { id: 'settings', label: 'Settings' },
] as const;

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
            employees: true, routine_tasks: true, leaves: true, attendance: true, 
            expenses: true, habit_tracker: true, holidays: true, recruitment: true, hr_calendar: true, settings: false
        }
    );

    React.useEffect(() => {
        if(open) {
             setPermissions(employee.permissions || {
                employees: true, routine_tasks: true, leaves: true, attendance: true, 
                expenses: true, habit_tracker: true, holidays: true, recruitment: true, hr_calendar: true, settings: false
            });
        }
    }, [open, employee.permissions]);

    const handleSave = () => {
        onSave(employee.id, permissions);
        setOpen(false);
    }
    
    const handleCheckedChange = (permissionKey: keyof EmployeePermissions, checked: boolean) => {
        setPermissions(prev => ({ ...prev, [permissionKey]: checked }));
    };
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Permissions for {employee.name}</DialogTitle>
                    <DialogDescription>
                        Select the pages this employee can access.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 grid-cols-2">
                    {navItems.map(item => (
                        <div key={item.id} className="flex items-center space-x-2">
                            <Checkbox 
                                id={item.id} 
                                checked={permissions[item.id]}
                                onCheckedChange={(checked) => handleCheckedChange(item.id, !!checked)}
                            />
                            <Label htmlFor={item.id} className="font-normal">{item.label}</Label>
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
    const [branches, setBranches] = React.useState<Branch[]>([]);
    const [kras, setKras] = React.useState<KRA[]>([]);
    const [loading, setLoading] = React.useState(true);
    const { toast } = useToast();
    const { currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'Admin';


    const employees: Employee[] = React.useMemo(() => {
        const employeeMap = new Map<string, Employee>();
         kras.forEach(kra => {
            if (!employeeMap.has(kra.employee.id)) {
                employeeMap.set(kra.employee.id, kra.employee);
            }
        });
        
        const allEmployees = Array.from(employeeMap.values());
        
        const managerIds = new Set(branches.map(b => b.managerId));

        return allEmployees.map(emp => ({
            ...emp,
            isManager: managerIds.has(emp.id)
        })).sort((a,b) => a.name.localeCompare(b.name));

    }, [kras, branches]);

    React.useEffect(() => {
        try {
            const savedBranches = sessionStorage.getItem('branchData');
            if (savedBranches) {
                setBranches(JSON.parse(savedBranches));
            }
             const savedKras = sessionStorage.getItem('kraData');
            if (savedKras) {
                setKras(JSON.parse(savedKras, (key, value) => {
                    if (['startDate', 'endDate', 'dueDate', 'joiningDate', 'birthDate'].includes(key) && value) {
                        return new Date(value);
                    }
                    return value;
                }));
            } else {
                setKras(mockKras);
            }

        } catch (error) {
            console.error("Failed to parse data from sessionStorage", error);
             setKras(mockKras);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        if (!loading) {
            sessionStorage.setItem('branchData', JSON.stringify(branches));
            sessionStorage.setItem('kraData', JSON.stringify(kras));
        }
    }, [branches, kras, loading]);

    const handleSaveBranch = (branchToSave: Branch) => {
        const isEditing = branches.some(b => b.id === branchToSave.id);
        
        if (!isEditing && branches.some(b => b.name.toLowerCase() === branchToSave.name.toLowerCase())) {
            toast({ title: "Error", description: "This branch already exists.", variant: "destructive" });
            return;
        }
        
        setBranches(prevBranches => {
            const updatedBranches = isEditing 
                ? prevBranches.map(b => b.id === branchToSave.id ? branchToSave : b)
                : [...prevBranches, branchToSave];
            
            const managerIds = new Set(updatedBranches.map(b => b.managerId));
            const updatedKras = kras.map(kra => ({
                ...kra,
                employee: {
                    ...kra.employee,
                    isManager: managerIds.has(kra.employee.id)
                }
            }));
            setKras(updatedKras);

            return updatedBranches;
        });

        toast({
            title: isEditing ? "Branch Updated" : "Branch Added",
            description: `Branch "${branchToSave.name}" has been saved.`,
        });
    };


    const handleDeleteBranch = (branchId: string) => {
        setBranches(prevBranches => prevBranches.filter(branch => branch.id !== branchId));
        toast({
            title: "Branch Deleted",
            description: "The branch has been successfully deleted.",
        });
    };

    const handleRoleChange = (employeeId: string, role: UserRole) => {
        const updatedKras = kras.map(kra => {
            if (kra.employee.id === employeeId) {
                return {
                    ...kra,
                    employee: { ...kra.employee, role: role }
                };
            }
            return kra;
        });
        setKras(updatedKras);
        toast({
            title: "Role Updated",
            description: `Role has been changed to ${role}.`
        })
    };

    const handlePermissionChange = (employeeId: string, permissions: EmployeePermissions) => {
         const updatedKras = kras.map(kra => {
            if (kra.employee.id === employeeId) {
                return {
                    ...kra,
                    employee: { ...kra.employee, permissions: permissions }
                };
            }
            return kra;
        });
        setKras(updatedKras);
        toast({
            title: "Permissions Updated",
            description: `Permissions have been updated for the user.`
        })
    };

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold">Settings</h1>
            <Card>
                <CardHeader className='flex-row items-center justify-between'>
                    <div>
                        <CardTitle>Branch Management</CardTitle>
                        <CardDescription>
                            Add, view, or manage branches and assign managers.
                        </CardDescription>
                    </div>
                    {isAdmin && (
                        <BranchDialog onSave={handleSaveBranch} employees={employees}>
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
                                    {isAdmin && <TableHead className="text-right w-[100px]">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center">Loading branches...</TableCell>
                                    </TableRow>
                                ) : branches.length > 0 ? (
                                    branches.map((branch) => {
                                        const manager = employees.find(e => e.id === branch.managerId);
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
                                            {isAdmin && (
                                            <TableCell className="text-right">
                                                 <div className="flex items-center justify-end gap-2">
                                                     <BranchDialog branch={branch} onSave={handleSaveBranch} employees={employees}>
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
                                                            <AlertDialogAction onClick={() => handleDeleteBranch(branch.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
                                        <TableCell colSpan={isAdmin ? 3 : 2} className="text-center">No branches found. Add one to get started.</TableCell>
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
                        Assign roles and page access to users.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="w-[200px]">Role</TableHead>
                                    <TableHead className="w-[150px]">Permissions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={4} className="text-center">Loading users...</TableCell></TableRow>
                                ) : employees.map(employee => (
                                    <TableRow key={employee.id}>
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
                                                disabled={!isAdmin || employee.email === 'connect@luvfitnessworld.com'}
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
                                                 <Button variant="outline" size="sm" disabled={!isAdmin || employee.email === 'connect@luvfitnessworld.com'}>
                                                    <KeySquare className="mr-2 h-4 w-4" />
                                                    Edit Permissions
                                                </Button>
                                            </PermissionDialog>
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
