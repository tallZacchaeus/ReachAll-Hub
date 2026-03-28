import MainLayout from "@/layouts/MainLayout";
import { router, useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Search, Edit, Trash2, CheckCircle, XCircle, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface StaffMember {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  role: string;
  position: string;
  enrollmentDate: string;
  status: "Active" | "Inactive" | "Pending";
}

interface StaffEnrollmentPageProps {
  staffMembers: StaffMember[];
  departments: string[];
  positions: string[];
  roles: string[];
}

type StaffFormData = {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  department: string;
  role: string;
  position: string;
};

const initialFormData: StaffFormData = {
  employeeId: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  department: "",
  role: "Staff",
  position: "",
};

export default function StaffEnrollmentPage({
  staffMembers,
  departments,
  positions,
  roles,
}: StaffEnrollmentPageProps) {
  const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("All Departments");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const { data: formData, setData, post, put, processing, errors, reset, clearErrors } = useForm<StaffFormData>(initialFormData);

  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }

    if (flash?.error) {
      toast.error(flash.error);
    }
  }, [flash?.error, flash?.success]);

  const handleInputChange = (field: keyof StaffFormData, value: string) => {
    setData(field, value);
  };

  const resetForm = () => {
    reset();
    clearErrors();
    setEditingStaff(null);
  };

  const closeDialog = () => {
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();

    post("/staff-enrollment", {
      preserveScroll: true,
      onSuccess: () => {
        closeDialog();
      },
    });
  };

  const handleEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    setData({
      employeeId: staff.employeeId,
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      password: "",
      department: staff.department,
      role: staff.role,
      position: staff.position,
    });
    setIsAddDialogOpen(true);
  };

  const handleUpdateStaff = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingStaff) return;

    put(`/staff-enrollment/${editingStaff.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        closeDialog();
      },
    });
  };

  const handleDeleteStaff = (id: string) => {
    if (!window.confirm("Remove this staff member from the platform?")) {
      return;
    }

    router.delete(`/staff-enrollment/${id}`, {
      preserveScroll: true,
    });
  };

  const handleToggleStatus = (id: string) => {
    router.patch(`/staff-enrollment/${id}/status`, {}, {
      preserveScroll: true,
    });
  };

  const handleBulkUpload = () => {
    toast.info("Bulk upload feature coming soon!");
  };

  const handleDownloadTemplate = () => {
    const templateRows = [
      ["employeeId", "firstName", "lastName", "email", "department", "position", "role"],
      ["EMP001", "Jane", "Doe", "jane.doe@company.com", departments[0] ?? "", positions[0] ?? "", "Staff"],
    ];

    const csvContent = templateRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "staff-enrollment-template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV template downloaded successfully!");
  };

  const filteredStaff = staffMembers.filter((staff) => {
    const matchesSearch =
      staff.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment =
      filterDepartment === "All Departments" || staff.department === filterDepartment;

    const matchesStatus =
      filterStatus === "All Status" || staff.status === filterStatus;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-2 flex items-center gap-3">
            <UserPlus className="w-10 h-10 text-[#1F6E4A]" />
            Staff Enrollment
          </h1>
          <p className="text-muted-foreground">
            Manage and enroll staff members in the Tech Staff Evaluation Platform
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="border-[#1F6E4A] text-[#1F6E4A] hover:bg-[#1F6E4A]/5"
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV Template
          </Button>
          <Button
            variant="outline"
            onClick={handleBulkUpload}
            className="border-[#1F6E4A] text-[#1F6E4A] hover:bg-[#1F6E4A]/5"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              setIsAddDialogOpen(open);

              if (!open) {
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                className="bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Enroll New Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingStaff ? "Edit Staff Information" : "Enroll New Staff Member"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {editingStaff
                    ? "Update the staff member's information below"
                    : "Fill in the details to enroll a new staff member"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={editingStaff ? handleUpdateStaff : handleAddStaff} className="space-y-6 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeId" className="text-foreground">
                      Employee ID <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="employeeId"
                      placeholder="e.g., EMP001"
                      value={formData.employeeId}
                      onChange={(e) => handleInputChange("employeeId", e.target.value)}
                      required
                    />
                    {errors.employeeId && <p className="text-sm text-red-500">{errors.employeeId}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="staff@company.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                    />
                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-foreground">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="Enter first name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      required
                    />
                    {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-foreground">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Enter last name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      required
                    />
                    {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
                  </div>
                </div>

                {!editingStaff && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter default password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      required
                    />
                    {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                    <p className="text-xs text-muted-foreground">
                      Staff can change this password after first login
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-foreground">
                      Department <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => handleInputChange("department", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.department && <p className="text-sm text-red-500">{errors.department}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position" className="text-foreground">
                      Position <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.position}
                      onValueChange={(value) => handleInputChange("position", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map((pos) => (
                          <SelectItem key={pos} value={pos}>
                            {pos}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.position && <p className="text-sm text-red-500">{errors.position}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-foreground">
                    Platform Role <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange("role", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
                  <p className="text-xs text-muted-foreground">
                    This determines the staff member's access level in the platform
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={processing}
                    onClick={() => {
                      closeDialog();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={processing}
                    className="bg-[#1F6E4A] hover:bg-[#1a5a3d] text-white"
                  >
                    {processing ? "Saving..." : editingStaff ? "Update Staff" : "Enroll Staff"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-2xl border-2 border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Staff</p>
                <p className="text-3xl text-foreground">{staffMembers.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#1F6E4A]/10 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-[#1F6E4A]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2 border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active</p>
                <p className="text-3xl text-foreground">
                  {staffMembers.filter((s) => s.status === "Active").length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2 border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Inactive</p>
                <p className="text-3xl text-foreground">
                  {staffMembers.filter((s) => s.status === "Inactive").length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2 border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending</p>
                <p className="text-3xl text-foreground">
                  {staffMembers.filter((s) => s.status === "Pending").length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="rounded-2xl border-2 border-border">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Search Staff</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Filter by Department</Label>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Departments">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Status">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card className="rounded-2xl border-2 border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Enrolled Staff Members</CardTitle>
          <CardDescription className="text-muted-foreground">
            Showing {filteredStaff.length} of {staffMembers.length} staff members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead className="text-foreground">Staff Member</TableHead>
                  <TableHead className="text-foreground">Employee ID</TableHead>
                  <TableHead className="text-foreground">Department</TableHead>
                  <TableHead className="text-foreground">Position</TableHead>
                  <TableHead className="text-foreground">Role</TableHead>
                  <TableHead className="text-foreground">Enrollment Date</TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                  <TableHead className="text-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No staff members found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((staff) => (
                    <TableRow key={staff.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border-2 border-border">
                            <AvatarFallback className="bg-[#1F6E4A] text-white text-sm">
                              {getInitials(staff.firstName, staff.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-foreground">
                              {staff.firstName} {staff.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{staff.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">{staff.employeeId}</TableCell>
                      <TableCell className="text-muted-foreground">{staff.department}</TableCell>
                      <TableCell className="text-muted-foreground">{staff.position}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            staff.role === "Management"
                              ? "border-[#1F6E4A] text-[#1F6E4A] bg-[#1F6E4A]/5"
                              : staff.role === "HR"
                              ? "border-blue-500 text-blue-500 bg-blue-50"
                              : "border-gray-400 text-gray-600 bg-gray-50"
                          }
                        >
                          {staff.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{staff.enrollmentDate}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            staff.status === "Active"
                              ? "bg-green-100 text-green-700 border-0"
                              : staff.status === "Inactive"
                              ? "bg-red-100 text-red-700 border-0"
                              : "bg-yellow-100 text-yellow-700 border-0"
                          }
                        >
                          {staff.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditStaff(staff)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleStatus(staff.id)}
                            className="h-8 w-8 p-0"
                          >
                            {staff.status === "Active" ? (
                              <XCircle className="w-4 h-4 text-orange-600" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteStaff(staff.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

StaffEnrollmentPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
