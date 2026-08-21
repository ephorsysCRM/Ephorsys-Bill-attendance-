'use client';

import { useEffect, useState } from 'react';
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
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Plus, Calendar as CalendarIcon, Check, X, Clock, User, Save, Loader2, Edit, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Employee {
  _id: string;
  name: string;
  empId: string;
  designation: string;
  empType: string;
}

interface AttendanceRecord {
  employeeId: string;
  status: 'full-day' | 'half-day' | 'absent' | 'leave' | 'wfh';
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
      const res = await fetch(`/api/attendance?date=${selectedDate.toISOString()}`);
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

  const handleStatusChange = (employeeId: string, status: 'full-day' | 'half-day' | 'absent' | 'leave' | 'wfh') => {
    setAttendance((prev) => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        employeeId,
        status,
      },
    }));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const records = Object.values(attendance);
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: date.toISOString(),
          records,
        }),
      });

      if (res.ok) {
        toast.success('Attendance saved successfully');
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
    setIsDialogOpen(true);
    fetchMonthlyAttendance(emp._id, currentMonth);
  };

  const fetchMonthlyAttendance = async (empId: string, month: Date) => {
    setLoadingMonthly(true);
    try {
      const startDate = startOfMonth(month);
      const endDate = endOfMonth(month);
      
      const res = await fetch(`/api/attendance?employeeId=${empId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      if (res.ok) {
        const data = await res.json();
        setMonthlyAttendance(data.attendance);
      }
    } catch (error) {
      console.error('Failed to fetch monthly attendance:', error);
      toast.error('Failed to load monthly summary');
    } finally {
      setLoadingMonthly(false);
    }
  };

  const calculateCounts = () => {
    let present = 0;
    let wfh = 0;
    let absent = 0;
    let leave = 0;
    let halfDay = 0;

    monthlyAttendance.forEach((rec) => {
      if (rec.status === 'full-day') present++;
      else if (rec.status === 'wfh') wfh++;
      else if (rec.status === 'half-day') halfDay++;
      else if (rec.status === 'absent') absent++;
      else if (rec.status === 'leave') leave++;
    });

    return {
      present: present + halfDay * 0.5,
      wfh,
      absent,
      leave,
      halfDay,
      total: monthlyAttendance.length,
    };
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
      default:
        return <Badge variant="outline">Not Marked</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Attendance Module</h1>
        <p className="text-muted-foreground">Manage employees and track daily attendance.</p>
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
              <div className="flex items-center gap-3">
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
              </div>

              <Button onClick={handleSaveAttendance} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Attendance
              </Button>
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
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant={currentStatus === 'full-day' ? 'default' : 'outline'}
                                className={cn(currentStatus === 'full-day' && 'bg-emerald-500 hover:bg-emerald-600 text-white')}
                                onClick={() => handleStatusChange(emp._id, 'full-day')}
                              >
                                Full
                              </Button>
                              <Button
                                size="sm"
                                variant={currentStatus === 'half-day' ? 'default' : 'outline'}
                                className={cn(currentStatus === 'half-day' && 'bg-amber-500 hover:bg-amber-600 text-white')}
                                onClick={() => handleStatusChange(emp._id, 'half-day')}
                              >
                                Half
                              </Button>
                              <Button
                                size="sm"
                                variant={currentStatus === 'wfh' ? 'default' : 'outline'}
                                className={cn(currentStatus === 'wfh' && 'bg-purple-500 hover:bg-purple-600 text-white')}
                                onClick={() => handleStatusChange(emp._id, 'wfh')}
                              >
                                WFH
                              </Button>
                              <Button
                                size="sm"
                                variant={currentStatus === 'leave' ? 'default' : 'outline'}
                                className={cn(currentStatus === 'leave' && 'bg-blue-500 hover:bg-blue-600 text-white')}
                                onClick={() => handleStatusChange(emp._id, 'leave')}
                              >
                                Leave
                              </Button>
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
        <DialogContent className="max-w-3xl bg-background/95 backdrop-blur-md border border-sidebar-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <User className="w-6 h-6 text-primary" />
              {selectedEmployee?.name} Summary
            </DialogTitle>
            <DialogDescription>
              Monthly attendance overview for {selectedEmployee?.empId}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Month Selector */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newMonth = new Date(currentMonth);
                    newMonth.setMonth(newMonth.getMonth() - 1);
                    setCurrentMonth(newMonth);
                    if (selectedEmployee) fetchMonthlyAttendance(selectedEmployee._id, newMonth);
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newMonth = new Date(currentMonth);
                    newMonth.setMonth(newMonth.getMonth() + 1);
                    setCurrentMonth(newMonth);
                    if (selectedEmployee) fetchMonthlyAttendance(selectedEmployee._id, newMonth);
                  }}
                >
                  Next
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Side: Calendar */}
              <div className="glass-card p-4 flex justify-center items-center bg-background/50">
                {loadingMonthly ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <Calendar
                    mode="default"
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    modifiers={{
                      present: monthlyAttendance.filter(r => r.status === 'full-day').map(r => new Date(r.date)),
                      halfDay: monthlyAttendance.filter(r => r.status === 'half-day').map(r => new Date(r.date)),
                      wfh: monthlyAttendance.filter(r => r.status === 'wfh').map(r => new Date(r.date)),
                      absent: monthlyAttendance.filter(r => r.status === 'absent').map(r => new Date(r.date)),
                      leave: monthlyAttendance.filter(r => r.status === 'leave').map(r => new Date(r.date)),
                    }}
                    modifiersStyles={{
                      present: { backgroundColor: '#10b981', color: 'white', borderRadius: '50%' },
                      halfDay: { backgroundColor: '#f59e0b', color: 'white', borderRadius: '50%' },
                      wfh: { backgroundColor: '#a855f7', color: 'white', borderRadius: '50%' },
                      absent: { backgroundColor: '#ef4444', color: 'white', borderRadius: '50%' },
                      leave: { backgroundColor: '#3b82f6', color: 'white', borderRadius: '50%' },
                    }}
                    className="border-0"
                  />
                )}
              </div>

              {/* Right Side: Stats & Info */}
              <div className="space-y-6">
                {/* Stats Cards */}
                {loadingMonthly ? (
                  <div className="flex justify-center items-center h-20">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {(() => {
                      const counts = calculateCounts();
                      return (
                        <>
                          <Card className="p-3 bg-background/50 border-emerald-500/20">
                            <div className="text-xs text-muted-foreground">Present</div>
                            <div className="text-xl font-bold text-emerald-500">{counts.present}</div>
                            <div className="text-[10px] text-muted-foreground">{counts.halfDay} half days</div>
                          </Card>
                          <Card className="p-3 bg-background/50 border-purple-500/20">
                            <div className="text-xs text-muted-foreground">WFH</div>
                            <div className="text-xl font-bold text-purple-500">{counts.wfh}</div>
                            <div className="text-[10px] text-muted-foreground">Work From Home</div>
                          </Card>
                          <Card className="p-3 bg-background/50 border-red-500/20">
                            <div className="text-xs text-muted-foreground">Absent</div>
                            <div className="text-xl font-bold text-red-500">{counts.absent}</div>
                          </Card>
                          <Card className="p-3 bg-background/50 border-blue-500/20">
                            <div className="text-xs text-muted-foreground">Leave</div>
                            <div className="text-xl font-bold text-blue-500">{counts.leave}</div>
                          </Card>
                          <Card className="p-3 bg-background/50 border-sidebar-border col-span-2">
                            <div className="text-xs text-muted-foreground">Total Marked</div>
                            <div className="text-xl font-bold text-foreground">{counts.total}</div>
                          </Card>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Legend */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Legend</h4>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                      <span>Full Day</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                      <span>Half Day</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                      <span>WFH</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                      <span>Absent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                      <span>Leave</span>
                    </div>
                  </div>
                </div>

                {/* Recent Notes or Info */}
                <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  <p>ℹ Dates are highlighted based on attendance status. This calendar is read-only.</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
