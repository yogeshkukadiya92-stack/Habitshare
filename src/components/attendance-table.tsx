
'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Employee, Attendance, AttendanceStatus } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from '@/lib/utils';

const statusConfig: Record<AttendanceStatus, { className: string }> = {
  'Present': { 
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  'Absent': {
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  'Half-day': {
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  'On Leave': {
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
};

interface AttendanceTableProps {
    employees: Employee[];
    attendances: Attendance[];
    selectedDate: Date;
    onSave: (attendance: Attendance) => void;
}

export function AttendanceTable({ employees, attendances, selectedDate, onSave }: AttendanceTableProps) {
  
  const getAttendanceForEmployee = (employeeId: string, date: Date): Attendance | undefined => {
    return attendances.find(
      a => a.employee.id === employeeId && format(new Date(a.date), 'yyyy-MM-dd') === format(new Date(date), 'yyyy-MM-dd')
    );
  };

  const handleStatusChange = (employee: Employee, status: AttendanceStatus) => {
    const existingAttendance = getAttendanceForEmployee(employee.id, selectedDate);
    const attendanceToSave: Attendance = {
      id: existingAttendance?.id || uuidv4(),
      employee: employee,
      date: selectedDate,
      status: status,
    };
    onSave(attendanceToSave);
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead className="w-[200px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.length === 0 && (
              <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                      No employees found.
                  </TableCell>
              </TableRow>
          )}
          {employees.map((employee) => {
             const attendance = getAttendanceForEmployee(employee.id, selectedDate);
             const currentStatus = attendance?.status || 'Present';
             const config = statusConfig[currentStatus];

             return(
            <TableRow key={employee.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={employee.avatarUrl} alt={employee.name} data-ai-hint="people" />
                    <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="font-medium">{employee.name}</div>
                </div>
              </TableCell>
              <TableCell>{employee.branch || 'N/A'}</TableCell>
              <TableCell>
                <Select
                  value={currentStatus}
                  onValueChange={(value: AttendanceStatus) => handleStatusChange(employee, value)}
                >
                  <SelectTrigger className={cn("w-[150px]", config?.className)}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Present">Present</SelectItem>
                    <SelectItem value="Absent">Absent</SelectItem>
                    <SelectItem value="Half-day">Half-day</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>
    </div>
  );
}
