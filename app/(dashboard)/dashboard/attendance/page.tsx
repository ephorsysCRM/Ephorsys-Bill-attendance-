'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, isSameMonth, isSameYear } from 'date-fns';
import { Plus, Calendar as CalendarIcon, Check, X, Clock, User, Save, Loader2, Edit, Trash2, Eye, Sun, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Employee {
  _id: string;
  name: string;
  empId: string;
  designation: string;
  empType: string;
}

export type AttendanceStatus = 'full-day' | 'half-day' | 'absent' | 'leave' | 'wfh' | 'holiday';

interface AttendanceRecord {
  employeeId: string;
  status?: AttendanceStatus;
  notes?: string;
}

export default function AttendancePage() {
  const [date, setDate] = useState<Date>(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    empId: '',
    designation: '',
    empType: 'Full-time',
  });
  
  // State for monthly summary
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [monthlyAttendance, setMonthlyAttendance] = useState<any[]>([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // Interactive day selection in monthly dialog
  const [selectedDialogDate, setSelectedDialogDate] = useState<Date | undefined>(undefined);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (date) {
      fetchAttendance(date);
    }
  }, [date]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (selectedDate: Date) => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const res = await fetch(`/api/attendance?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        const attMap: Record<string, AttendanceRecord> = {};
        data.attendance.forEach((rec: any) => {
          attMap[rec.employeeId] = {
            employeeId: rec.employeeId,
            status: rec.status,
            notes: rec.notes,
          };
        });
        setAttendance(attMap);
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      toast.error('Failed to load attendance');
    }
  };

  const isDayHoliday = employees.length > 0 && employees.every((emp) => attendance[emp._id]?.status === 'holiday');

  const handleToggleDayHoliday = async () => {
    if (employees.length === 0) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    const willBeHoliday = !isDayHoliday;
    setSaving(true);
    try {
      if (willBeHoliday) {
        const res = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: dateStr,
            isHoliday: true,
          }),
        });
        if (res.ok) {
          toast.success(`Marked all employees as Holiday for ${format(date, 'dd MMM yyyy')}`);
          await fetchAttendance(date);
        } else {
          toast.error('Failed to mark holiday');
        }
      } else {
        const res = await fetch(`/api/attendance?date=${dateStr}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          toast.success(`Removed Holiday for ${format(date, 'dd MMM yyyy')}`);
          await fetchAttendance(date);
        } else {
          toast.error('Failed to remove holiday');
        }
      }
    } catch (error) {
      console.error('Holiday toggle error:', error);
      toast.error('Failed to update holiday');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = (employeeId: string, status: AttendanceStatus) => {
    if (status === 'holiday') {
      // Company-wide holiday applies to ALL employees for that date
      const currentIsHoliday = attendance[employeeId]?.status === 'holiday';
      if (currentIsHoliday) {
        // Toggle off
        setAttendance({});
        toast.info(`Cleared holiday for ${format(date, 'dd MMM yyyy')}. Click "Save Attendance" to commit.`);
      } else {
        const allHoliday: Record<string, AttendanceRecord> = {};
        employees.forEach((emp) => {
          allHoliday[emp._id] = {
            employeeId: emp._id,
            status: 'holiday',
          };
        });
        setAttendance(allHoliday);
        toast.info(`Marked all employees as Holiday for ${format(date, 'dd MMM yyyy')}. Click "Save Attendance" to commit.`);
      }
      return;
    }

    setAttendance((prev) => {
      const current = prev[employeeId]?.status;
      // If clicking the active status again, toggle off (clear)
      if (current === status) {
        const updated = { ...prev };
        delete updated[employeeId];
        return updated;
      }
      return {
        ...prev,
        [employeeId]: {
          ...prev[employeeId],
          employeeId,
          status,
        },
      };
    });
  };

  const handleClearEmployeeAttendance = (employeeId: string) => {
    setAttendance((prev) => {
      const updated = { ...prev };
      delete updated[employeeId];
      return updated;
    });
    toast.info('Attendance cleared for this employee. Click "Save Attendance" to commit changes.');
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const records = Object.values(attendance).filter((r) => r.status);
      const dateStr = format(date, 'yyyy-MM-dd');
      const isAllHoliday = employees.length > 0 && employees.every((emp) => attendance[emp._id]?.status === 'holiday');

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          isHoliday: isAllHoliday,
          records,
        }),
      });

      if (res.ok) {
        toast.success('Attendance saved successfully');
        // Instantly refresh from server to ensure state and badges match DB
        await fetchAttendance(date);
      } else {
        toast.error('Failed to save attendance');
      }
    } catch (error) {
      console.error('Save attendance error:', error);
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingEmployee ? 'PUT' : 'POST';
      const body = editingEmployee 
        ? { ...newEmployee, _id: editingEmployee._id }
        : newEmployee;

      const res = await fetch('/api/employees', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingEmployee ? 'Employee updated successfully' : 'Employee added successfully');
        setNewEmployee({ name: '', empId: '', designation: '', empType: 'Full-time' });
        setEditingEmployee(null);
        fetchEmployees();
      } else {
        toast.error(editingEmployee ? 'Failed to update employee' : 'Failed to add employee');
      }
    } catch (error) {
      console.error('Save employee error:', error);
      toast.error('Failed to save employee');
    }
  };

  const handleEditClick = (emp: Employee) => {
    setEditingEmployee(emp);
    setNewEmployee({
      name: emp.name,
      empId: emp.empId,
      designation: emp.designation,
      empType: emp.empType,
    });
  };

  const handleViewEmployeeSummary = async (emp: Employee) => {
    setSelectedEmployee(emp);
    setSelectedDialogDate(undefined);
    setIsDialogOpen(true);
    fetchMonthlyAttendance(emp._id, currentMonth);
  };

  const fetchMonthlyAttendance = async (empId: string, month: Date) => {
    setLoadingMonthly(true);
    try {
      const year = month.getFullYear();
      const monthIndex = month.getMonth();
      const startDate = new Date(year, monthIndex, 1);
      const endDate = new Date(year, monthIndex + 1, 0);
      
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      
      const res = await fetch(`/api/attendance?employeeId=${empId}&startDate=${startDateStr}&endDate=${endDateStr}`);
      if (res.ok) {
        const data = await res.json();
        setMonthlyAttendance(data.attendance || []);
      }
    } catch (error) {
      console.error('Failed to fetch monthly attendance:', error);
      toast.error('Failed to load monthly summary');
    } finally {
      setLoadingMonthly(false);
    }
  };

  // Strictly calculate counts for the respective month ONLY
  const calculateCounts = useMemo(() => {
    let present = 0;
    let wfh = 0;
    let absent = 0;
    let leave = 0;
    let holiday = 0;
    let halfDay = 0;

    const targetYear = currentMonth.getFullYear();
    const targetMonth = currentMonth.getMonth();

    const isolatedRecords = monthlyAttendance.filter((rec) => {
      const d = new Date(rec.date);
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    });

    isolatedRecords.forEach((rec) => {
      if (rec.status === 'full-day') present++;
      else if (rec.status === 'wfh') wfh++;
      else if (rec.status === 'half-day') halfDay++;
      else if (rec.status === 'absent') absent++;
      else if (rec.status === 'leave') leave++;
      else if (rec.status === 'holiday') holiday++;
    });

    return {
      present: present + halfDay * 0.5,
      wfh,
      absent,
      leave,
      holiday,
      halfDay,
      total: isolatedRecords.length,
    };
  }, [monthlyAttendance, currentMonth]);

  // Current month isolated records for calendar rendering
  const currentMonthRecords = useMemo(() => {
    const targetYear = currentMonth.getFullYear();
    const targetMonth = currentMonth.getMonth();
    return monthlyAttendance.filter((rec) => {
      const d = new Date(rec.date);
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    });
  }, [monthlyAttendance, currentMonth]);

  const markedDateStrings = useMemo(() => {
    return new Set(currentMonthRecords.map((r) => format(new Date(r.date), 'yyyy-MM-dd')));
  }, [currentMonthRecords]);

  // Handle setting or removing attendance directly from the dialog
  const handleDialogUpdateStatus = async (status: AttendanceStatus | null) => {
    if (!selectedEmployee || !selectedDialogDate) return;
    setActionLoading(true);
    const dateStr = format(selectedDialogDate, 'yyyy-MM-dd');
    try {
      if (status === null) {
        // Remove attendance
        const res = await fetch(`/api/attendance?employeeId=${selectedEmployee._id}&date=${dateStr}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          toast.success(`Attendance removed for ${format(selectedDialogDate, 'dd MMM yyyy')}`);
          await fetchMonthlyAttendance(selectedEmployee._id, currentMonth);
          if (format(date, 'yyyy-MM-dd') === dateStr) {
            fetchAttendance(date);
          }
        } else {
          toast.error('Failed to remove attendance');
        }
      } else if (status === 'holiday') {
        // A date marked as holiday applies to ALL employees
        const res = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: dateStr,
            isHoliday: true,
          }),
        });
        if (res.ok) {
          toast.success(`Date ${format(selectedDialogDate, 'dd MMM yyyy')} marked as Holiday for all employees`);
          await fetchMonthlyAttendance(selectedEmployee._id, currentMonth);
          if (format(date, 'yyyy-MM-dd') === dateStr) {
            await fetchAttendance(date);
          }
        } else {
          toast.error('Failed to mark holiday');
        }
      } else {
        // Set new status
        const res = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: selectedEmployee._id,
            date: dateStr,
            status,
          }),
        });
        if (res.ok) {
          toast.success(`Marked as ${status} for ${format(selectedDialogDate, 'dd MMM yyyy')}`);
          await fetchMonthlyAttendance(selectedEmployee._id, currentMonth);
          if (format(date, 'yyyy-MM-dd') === dateStr) {
            fetchAttendance(date);
          }
        } else {
          toast.error('Failed to update attendance');
        }
      }
    } catch (error) {
      console.error('Error updating dialog attendance:', error);
      toast.error('Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'full-day':
        return <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">Full Day</Badge>;
      case 'half-day':
        return <Badge className="bg-amber-500 text-white hover:bg-amber-600">Half Day</Badge>;
      case 'wfh':
        return <Badge className="bg-purple-500 text-white hover:bg-purple-600">WFH</Badge>;
      case 'absent':
        return <Badge className="bg-red-500 text-white hover:bg-red-600">Absent</Badge>;
      case 'leave':
        return <Badge className="bg-blue-500 text-white hover:bg-blue-600">Leave</Badge>;
      case 'holiday':
        return <Badge className="bg-cyan-500 text-white hover:bg-cyan-600">Holiday</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground border-border">Not Marked</Badge>;
    }
  };

  // Check dialog date record
  const selectedDialogDateStr = selectedDialogDate ? format(selectedDialogDate, 'yyyy-MM-dd') : '';
  const selectedDialogRecord = currentMonthRecords.find(
    (r) => format(new Date(r.date), 'yyyy-MM-dd') === selectedDialogDateStr
  );
  const isSelectedDialogSunday = selectedDialogDate?.getDay() === 0;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Attendance Module</h1>
        <p className="text-muted-foreground">Manage employees, track daily attendance, and view isolated monthly records.</p>
      </div>

      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList className="bg-background/50 backdrop-blur-sm border p-1 rounded-lg">
          <TabsTrigger value="attendance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Daily Attendance</TabsTrigger>
          <TabsTrigger value="employees" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Manage Employees</TabsTrigger>
        </TabsList>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-6">
          <Card className="glass-card p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3 flex-wrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[240px] justify-start text-left font-normal bg-background/50">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                  </PopoverContent>
                </Popover>
                <div className="text-sm text-muted-foreground">
                  Marking attendance for <span className="font-semibold text-foreground">{format(date, 'dd MMM yyyy')}</span>
                </div>
                {isDayHoliday && (
                  <Badge className="bg-cyan-500 text-white hover:bg-cyan-600 font-semibold px-2.5 py-1">
                    ✨ Company Holiday
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={isDayHoliday ? "default" : "outline"}
                  onClick={handleToggleDayHoliday}
                  disabled={saving}
                  className={cn(
                    "transition-all font-medium",
                    isDayHoliday 
                      ? "bg-cyan-500 hover:bg-cyan-600 text-white font-semibold shadow-sm" 
                      : "border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/60"
                  )}
                >
                  <Sun className="w-4 h-4 mr-2" />
                  {isDayHoliday ? "Holiday (Marked for All)" : "Mark Day as Holiday"}
                </Button>

                <Button onClick={handleSaveAttendance} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Attendance
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No employees found. Please add employees first.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp) => {
                      const currentStatus = attendance[emp._id]?.status;
                      return (
                        <TableRow key={emp._id} className="hover:bg-muted/50">
                          <TableCell>
                            <button
                              onClick={() => handleViewEmployeeSummary(emp)}
                              className="text-left hover:text-primary transition-colors group"
                            >
                              <div className="font-medium text-foreground group-hover:text-primary flex items-center gap-2">
                                {emp.name}
                                <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="text-xs text-muted-foreground">{emp.empId}</div>
                            </button>
                          </TableCell>
                          <TableCell>{emp.designation}</TableCell>
                          <TableCell>{emp.empType}</TableCell>
                          <TableCell>{getStatusBadge(currentStatus)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-1.5 flex-wrap">
                              <Button
                                size="sm"
                                variant={currentStatus === 'full-day' ? 'default' : 'outline'}
                                className={cn(
                                  'h-8 px-2.5 text-xs font-medium',
                                  currentStatus === 'full-day' && 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                )}
                                onClick={() => handleStatusChange(emp._id, 'full-day')}
                              >
                                Full
                              </Button>
                              <Button
                                size="sm"
                                variant={currentStatus === 'half-day' ? 'default' : 'outline'}
                                className={cn(
                                  'h-8 px-2.5 text-xs font-medium',
                                  currentStatus === 'half-day' && 'bg-amber-500 hover:bg-amber-600 text-white'
                                )}
                                onClick={() => handleStatusChange(emp._id, 'half-day')}
                              >
                                Half
                              </Button>
                              <Button
                                size="sm"
                                variant={currentStatus === 'wfh' ? 'default' : 'outline'}
                                className={cn(
                                  'h-8 px-2.5 text-xs font-medium',
                                  currentStatus === 'wfh' && 'bg-purple-500 hover:bg-purple-600 text-white'
                                )}
                                onClick={() => handleStatusChange(emp._id, 'wfh')}
                              >
                                WFH
                              </Button>
                              <Button
                                size="sm"
                                variant={currentStatus === 'leave' ? 'default' : 'outline'}
                                className={cn(
                                  'h-8 px-2.5 text-xs font-medium',
                                  currentStatus === 'leave' && 'bg-blue-500 hover:bg-blue-600 text-white'
                                )}
                                onClick={() => handleStatusChange(emp._id, 'leave')}
                              >
                                Leave
                              </Button>
                              <Button
                                size="sm"
                                variant={currentStatus === 'absent' ? 'default' : 'outline'}
                                className={cn(
                                  'h-8 px-2.5 text-xs font-medium',
                                  currentStatus === 'absent' && 'bg-red-500 hover:bg-red-600 text-white'
                                )}
                                onClick={() => handleStatusChange(emp._id, 'absent')}
                              >
                                Absent
                              </Button>
                              <Button
                                size="sm"
                                variant={currentStatus === 'holiday' ? 'default' : 'outline'}
                                className={cn(
                                  'h-8 px-2.5 text-xs font-medium',
                                  currentStatus === 'holiday' && 'bg-cyan-500 hover:bg-cyan-600 text-white'
                                )}
                                onClick={() => handleStatusChange(emp._id, 'holiday')}
                              >
                                Holiday
                              </Button>
                              {currentStatus && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleClearEmployeeAttendance(emp._id)}
                                  title="Clear attendance"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add Employee Form */}
            <Card className="glass-card p-6 lg:col-span-1 h-fit">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </h2>
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Name</label>
                  <Input
                    placeholder="John Doe"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    required
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Employee ID</label>
                  <Input
                    placeholder="EMP001"
                    value={newEmployee.empId}
                    onChange={(e) => setNewEmployee({ ...newEmployee, empId: e.target.value })}
                    required
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Designation</label>
                  <Input
                    placeholder="Software Engineer"
                    value={newEmployee.designation}
                    onChange={(e) => setNewEmployee({ ...newEmployee, designation: e.target.value })}
                    required
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Employee Type</label>
                  <Select
                    value={newEmployee.empType}
                    onValueChange={(value) => setNewEmployee({ ...newEmployee, empType: value })}
                  >
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Intern">Intern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  {editingEmployee && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setEditingEmployee(null);
                        setNewEmployee({ name: '', empId: '', designation: '', empType: 'Full-time' });
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                    {editingEmployee ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {editingEmployee ? 'Update' : 'Add Employee'}
                  </Button>
                </div>
              </form>
            </Card>

            {/* Employee List */}
            <Card className="glass-card p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-foreground mb-4">Employee Directory</h2>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  No employees found. Add your first employee using the form.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Emp ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((emp) => (
                        <TableRow key={emp._id} className="hover:bg-muted/50">
                          <TableCell className="font-medium text-foreground">{emp.empId}</TableCell>
                          <TableCell>{emp.name}</TableCell>
                          <TableCell>{emp.designation}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{emp.empType}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="text-muted-foreground hover:text-foreground"
                                onClick={() => handleEditClick(emp)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Monthly Summary Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[92vh] overflow-y-auto bg-background/95 backdrop-blur-md border border-sidebar-border p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <User className="w-6 h-6 text-primary" />
              {selectedEmployee?.name} Summary
            </DialogTitle>
            <DialogDescription>
              Monthly attendance overview for {selectedEmployee?.empId} ({selectedEmployee?.designation})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Month Selector */}
            <div className="flex items-center justify-between bg-muted/20 p-3 rounded-lg border border-border/50">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">
                  {format(currentMonth, 'MMMM yyyy')}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newMonth = new Date(currentMonth);
                    newMonth.setMonth(newMonth.getMonth() - 1);
                    setCurrentMonth(newMonth);
                    setSelectedDialogDate(undefined);
                    if (selectedEmployee) fetchMonthlyAttendance(selectedEmployee._id, newMonth);
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    setCurrentMonth(today);
                    setSelectedDialogDate(undefined);
                    if (selectedEmployee) fetchMonthlyAttendance(selectedEmployee._id, today);
                  }}
                >
                  Current
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newMonth = new Date(currentMonth);
                    newMonth.setMonth(newMonth.getMonth() + 1);
                    setCurrentMonth(newMonth);
                    setSelectedDialogDate(undefined);
                    if (selectedEmployee) fetchMonthlyAttendance(selectedEmployee._id, newMonth);
                  }}
                >
                  Next
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Side: Calendar & Quick Action (7 columns) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="glass-card p-5 flex flex-col items-center justify-center bg-background/50 border border-border/50 rounded-xl">
                  {loadingMonthly ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Calendar
                      mode="single"
                      selected={selectedDialogDate}
                      onSelect={setSelectedDialogDate}
                      month={currentMonth}
                      onMonthChange={(m) => {
                        setCurrentMonth(m);
                        setSelectedDialogDate(undefined);
                        if (selectedEmployee) fetchMonthlyAttendance(selectedEmployee._id, m);
                      }}
                      showOutsideDays={false}
                      modifiers={{
                        present: currentMonthRecords.filter((r) => r.status === 'full-day').map((r) => new Date(r.date)),
                        halfDay: currentMonthRecords.filter((r) => r.status === 'half-day').map((r) => new Date(r.date)),
                        wfh: currentMonthRecords.filter((r) => r.status === 'wfh').map((r) => new Date(r.date)),
                        absent: currentMonthRecords.filter((r) => r.status === 'absent').map((r) => new Date(r.date)),
                        leave: currentMonthRecords.filter((r) => r.status === 'leave').map((r) => new Date(r.date)),
                        holiday: currentMonthRecords.filter((r) => r.status === 'holiday').map((r) => new Date(r.date)),
                        sunday: (d: Date) =>
                          d.getDay() === 0 &&
                          d.getFullYear() === currentMonth.getFullYear() &&
                          d.getMonth() === currentMonth.getMonth() &&
                          !markedDateStrings.has(format(d, 'yyyy-MM-dd')),
                      }}
                      modifiersStyles={{
                        present: { backgroundColor: '#10b981', color: 'white', borderRadius: '50%' },
                        halfDay: { backgroundColor: '#f59e0b', color: 'white', borderRadius: '50%' },
                        wfh: { backgroundColor: '#a855f7', color: 'white', borderRadius: '50%' },
                        absent: { backgroundColor: '#ef4444', color: 'white', borderRadius: '50%' },
                        leave: { backgroundColor: '#3b82f6', color: 'white', borderRadius: '50%' },
                        holiday: { backgroundColor: '#06b6d4', color: 'white', borderRadius: '50%' },
                        sunday: { backgroundColor: '#f43f5e', color: 'white', borderRadius: '50%' },
                      }}
                      className="border-0 p-3"
                    />
                  )}
                </div>

                {/* Quick Date Actions Panel */}
                <div className="glass-card p-4 bg-muted/20 border border-border/50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {selectedDialogDate
                        ? `Selected: ${format(selectedDialogDate, 'EEE, dd MMM yyyy')}`
                        : 'Click any date above to edit or remove attendance'}
                    </span>
                    {selectedDialogDate && (
                      <div>
                        {selectedDialogRecord ? (
                          getStatusBadge(selectedDialogRecord.status)
                        ) : isSelectedDialogSunday ? (
                          <Badge className="bg-rose-500 text-white hover:bg-rose-600">Sunday (Auto)</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Unmarked</Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedDialogDate && (
                    <div className="pt-3 border-t border-border/40 space-y-2">
                      <div className="text-xs text-muted-foreground">Select an option to update or remove:</div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading}
                          className={cn(
                            "h-8 px-3 text-xs font-medium transition-all",
                            selectedDialogRecord?.status === 'full-day'
                              ? "bg-emerald-500 text-white border-emerald-500 font-semibold shadow-sm"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-white"
                          )}
                          onClick={() => handleDialogUpdateStatus('full-day')}
                        >
                          Full Day
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading}
                          className={cn(
                            "h-8 px-3 text-xs font-medium transition-all",
                            selectedDialogRecord?.status === 'half-day'
                              ? "bg-amber-500 text-white border-amber-500 font-semibold shadow-sm"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500 hover:text-white"
                          )}
                          onClick={() => handleDialogUpdateStatus('half-day')}
                        >
                          Half Day
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading}
                          className={cn(
                            "h-8 px-3 text-xs font-medium transition-all",
                            selectedDialogRecord?.status === 'wfh'
                              ? "bg-purple-500 text-white border-purple-500 font-semibold shadow-sm"
                              : "bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500 hover:text-white"
                          )}
                          onClick={() => handleDialogUpdateStatus('wfh')}
                        >
                          WFH
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading}
                          className={cn(
                            "h-8 px-3 text-xs font-medium transition-all",
                            selectedDialogRecord?.status === 'leave'
                              ? "bg-blue-500 text-white border-blue-500 font-semibold shadow-sm"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500 hover:text-white"
                          )}
                          onClick={() => handleDialogUpdateStatus('leave')}
                        >
                          Leave
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading}
                          className={cn(
                            "h-8 px-3 text-xs font-medium transition-all",
                            selectedDialogRecord?.status === 'absent'
                              ? "bg-red-500 text-white border-red-500 font-semibold shadow-sm"
                              : "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500 hover:text-white"
                          )}
                          onClick={() => handleDialogUpdateStatus('absent')}
                        >
                          Absent
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading}
                          className={cn(
                            "h-8 px-3 text-xs font-medium transition-all",
                            selectedDialogRecord?.status === 'holiday'
                              ? "bg-cyan-500 text-white border-cyan-500 font-semibold shadow-sm"
                              : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500 hover:text-white"
                          )}
                          onClick={() => handleDialogUpdateStatus('holiday')}
                        >
                          Holiday
                        </Button>

                        {/* Remove attendance option */}
                        {selectedDialogRecord && (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={actionLoading}
                            className="h-8 px-3 text-xs ml-auto font-medium shadow-sm hover:bg-destructive/90"
                            onClick={() => handleDialogUpdateStatus(null)}
                          >
                            {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
                            Remove Attendance
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Isolated Monthly Stats & Legend (5 columns) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Stats Cards (Isolated to currentMonth ONLY) */}
                {loadingMonthly ? (
                  <div className="flex justify-center items-center h-20">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="p-3.5 bg-background/50 border-emerald-500/20">
                      <div className="text-xs text-muted-foreground">Present</div>
                      <div className="text-2xl font-bold text-emerald-500">{calculateCounts.present}</div>
                      <div className="text-[11px] text-muted-foreground">{calculateCounts.halfDay} half days</div>
                    </Card>
                    <Card className="p-3.5 bg-background/50 border-purple-500/20">
                      <div className="text-xs text-muted-foreground">WFH</div>
                      <div className="text-2xl font-bold text-purple-500">{calculateCounts.wfh}</div>
                      <div className="text-[11px] text-muted-foreground">Work From Home</div>
                    </Card>
                    <Card className="p-3.5 bg-background/50 border-red-500/20">
                      <div className="text-xs text-muted-foreground">Absent</div>
                      <div className="text-2xl font-bold text-red-500">{calculateCounts.absent}</div>
                      <div className="text-[11px] text-muted-foreground">Full Day Absent</div>
                    </Card>
                    <Card className="p-3.5 bg-background/50 border-blue-500/20">
                      <div className="text-xs text-muted-foreground">Leave</div>
                      <div className="text-2xl font-bold text-blue-500">{calculateCounts.leave}</div>
                      <div className="text-[11px] text-muted-foreground">Approved Leaves</div>
                    </Card>
                    <Card className="p-3.5 bg-background/50 border-cyan-500/20">
                      <div className="text-xs text-muted-foreground">Holiday</div>
                      <div className="text-2xl font-bold text-cyan-500">{calculateCounts.holiday}</div>
                      <div className="text-[11px] text-muted-foreground">Public / Fest. Holidays</div>
                    </Card>
                    <Card className="p-3.5 bg-background/50 border-sidebar-border">
                      <div className="text-xs text-muted-foreground">Total Marked</div>
                      <div className="text-2xl font-bold text-foreground">{calculateCounts.total}</div>
                      <div className="text-[11px] text-muted-foreground">Days Recorded in Month</div>
                    </Card>
                  </div>
                )}

                {/* Legend */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Legend</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs bg-muted/20 p-3.5 rounded-xl border border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-emerald-500 rounded-full shrink-0"></span>
                      <span>Full Day</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-amber-500 rounded-full shrink-0"></span>
                      <span>Half Day</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-purple-500 rounded-full shrink-0"></span>
                      <span>WFH</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-500 rounded-full shrink-0"></span>
                      <span>Absent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-blue-500 rounded-full shrink-0"></span>
                      <span>Leave</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-cyan-500 rounded-full shrink-0"></span>
                      <span>Holiday</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2 sm:col-span-3 pt-1.5 border-t border-border/40">
                      <span className="w-3 h-3 bg-rose-500 rounded-full shrink-0"></span>
                      <span className="text-rose-400 font-medium">Sunday (Auto Marked / Off)</span>
                    </div>
                  </div>
                </div>

                {/* Information Note */}
                <div className="text-xs text-muted-foreground bg-muted/30 p-3.5 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p>
                    All statistics strictly reflect attendance for <strong>{format(currentMonth, 'MMMM yyyy')}</strong> only. Click any date on the calendar to change its status or remove wrongly clicked attendance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
