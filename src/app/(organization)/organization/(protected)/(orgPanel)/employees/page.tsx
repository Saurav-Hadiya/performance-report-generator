"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateEmployee, useDeleteEmployee, useEmployees, useInviteEmployee, useResendInvitation, useOrganization } from "@/hooks";
import { Building, CheckCircle2, Loader2, Mail, Search, Table, Trash2, User, UserPlus, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { useQueryClient } from "@tanstack/react-query";
import queryKeys from "@/constants/QueryKeys";

export default function EmployeesPage() {
  const queryClient = useQueryClient();

  // Search state with debouncing
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search query to avoid excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Use server-side filtering
  const {
    data: employees = [],
    isLoading: isLoadingEmployees,
    error
  } = useEmployees({
    search: debouncedSearch
  });

  const {
    data: organization,
    isLoading: isLoadingOrganization
  } = useOrganization();

  const { mutate: createEmployee, isPending: isCreating } = useCreateEmployee();
  const { mutate: deleteEmployee, isPending: isDeleting } = useDeleteEmployee();
  const { mutate: inviteEmployee, isPending: isInviting } = useInviteEmployee();
  const { mutate: resendInvitation, isPending: isResending } = useResendInvitation();

  const [activeTab, setActiveTab] = useState("directory");
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null);
  const [resendingEmployeeId, setResendingEmployeeId] = useState<string | null>(null);

  // New employee form state
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    assignedReviewees: [] as string[],
  });

  const handleRemoveEmployee = (id: string) => {
    if (confirm("Are you sure you want to remove this employee?")) {
      setDeletingEmployeeId(id);
      deleteEmployee(id, {
        onSuccess: () => {
          toast.success("Employee deleted successfully");
          setDeletingEmployeeId(null);
        },
        onError: (error) => {
          toast.error(`Failed to delete employee: ${error.message}`);
          setDeletingEmployeeId(null);
        }
      });
    }
  };

  const handleResendInvitation = (id: string) => {
    setResendingEmployeeId(id);
    resendInvitation(id, {
      onSuccess: (response) => {
        toast.success(response.message || "Invitation resent successfully");
        queryClient.invalidateQueries({ queryKey: [queryKeys.employees] });
        setResendingEmployeeId(null);
      },
      onError: (error) => {
        toast.error(`Failed to resend invitation: ${error.message}`);
        setResendingEmployeeId(null);
      }
    });
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isLoading = isLoadingEmployees || isLoadingOrganization;
  const departments = organization?.departments || [];

  if (error) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Data</h2>
          <p className="text-gray-600">There was a problem fetching the employee data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">Employee Management</h1>
        <div className="text-sm text-gray-500 flex items-center">
          {isLoadingEmployees ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </span>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
              <span className="h-3 w-3 bg-green-500 rounded-full"></span>
              <span>{employees.length} employees total</span>
            </div>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b">
          <TabsList className="w-full md:w-auto h-auto p-0 bg-transparent gap-4">
            <TabsTrigger
              value="directory"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none py-3 px-2 data-[state=active]:text-primary data-[state=active]:font-semibold"
            >
              <Table className="h-4 w-4 mr-2" />
              Employee Directory
            </TabsTrigger>
            <TabsTrigger
              value="add"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none py-3 px-2 data-[state=active]:text-primary data-[state=active]:font-semibold"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Employee
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Directory Tab */}
        <TabsContent value="directory">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Employee Directory</CardTitle>
                  <CardDescription className="mt-1">
                    View and manage all employees in your organization
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search employees..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isLoadingEmployees}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingEmployees ? (
                <div className="flex justify-center items-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-gray-500">Loading employees...</p>
                  </div>
                </div>
              ) : (
                <>
                  {employees.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-2">
                      {employees.map((employee) => (
                        <div
                          key={employee._id}
                          className="group relative border rounded-lg p-4 hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={`https://avatar.vercel.sh/${employee._id}`} />
                              <AvatarFallback>{employee.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">
                                <Link
                                  href={`/organization/employees/${employee._id}`}
                                  className="hover:text-primary hover:underline"
                                >
                                  {employee.name}
                                </Link>
                              </h3>
                              <p className="text-sm text-gray-500">{employee.email}</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                                  {employee.role}
                                </span>
                                {employee.department && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                    {employee.department}
                                  </span>
                                )}
                                {employee.email && !employee.emailConfirmed && (
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    Pending
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {employee.email && !employee.emailConfirmed && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleResendInvitation(employee._id);
                                }}
                                disabled={resendingEmployeeId === employee._id}
                                title="Resend invitation email"
                              >
                                {resendingEmployeeId === employee._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Mail className="h-4 w-4 text-blue-600" />
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.preventDefault();
                                handleRemoveEmployee(employee._id);
                              }}
                              disabled={deletingEmployeeId === employee._id}
                              title="Remove employee"
                            >
                              {deletingEmployeeId === employee._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-red-600" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border rounded-lg bg-gray-50">
                      {searchQuery ? (
                        <div className="space-y-2">
                          <Users className="h-12 w-12 mx-auto text-gray-400" />
                          <p className="text-lg font-medium">No matching employees found</p>
                          <p className="text-sm text-gray-500">
                            Try adjusting your search query
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Users className="h-12 w-12 mx-auto text-gray-400" />
                          <p className="text-lg font-medium">No employees yet</p>
                          <p className="text-sm text-gray-500">
                            Add employees to your organization to get started
                          </p>
                          <Button
                            onClick={() => setActiveTab("add")}
                            className="mt-4"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Employee
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Employee Tab */}
        <TabsContent value="add">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Add New Employee</CardTitle>
              <CardDescription>
                Invite a new employee to join your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {/* Basic Info Section */}
                <div>
                  <h3 className="text-base font-medium mb-4">Basic Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 z-10" />
                        <Input
                          id="name"
                          placeholder="John Doe"
                          disabled={isCreating || isInviting}
                          className="pl-8"
                          value={newEmployee.name}
                          onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 z-10" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          disabled={isCreating || isInviting}
                          className="pl-8"
                          value={newEmployee.email}
                          onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        placeholder="Software Engineer"
                        disabled={isCreating || isInviting}
                        value={newEmployee.role}
                        onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <div className="relative">
                        <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 z-10" />
                        {isLoadingOrganization ? (
                          <div className="h-10 w-full flex items-center pl-10 border rounded-md bg-gray-50">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading departments...
                          </div>
                        ) : (
                          <Select
                            disabled={isCreating || isInviting}
                            value={newEmployee.department}
                            onValueChange={(value) => setNewEmployee({ ...newEmployee, department: value })}
                          >
                            <SelectTrigger className="pl-8">
                              <SelectValue placeholder="Select a department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.length > 0 ? (
                                departments.map((dept) => (
                                  <SelectItem key={dept} value={dept}>
                                    {dept}
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="p-2 text-center text-sm text-gray-500">
                                  No departments available. Please add departments in Organization Settings.
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assign Reviewees Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-medium">Assign Employees to Review</h3>
                    <span className="text-xs text-gray-500">
                      {newEmployee.assignedReviewees.length} Selected
                    </span>
                  </div>

                  <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                    {isLoadingEmployees ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading employees...
                      </div>
                    ) : employees.length > 0 ? (
                      <div className="space-y-2">
                        {employees.map((employee) => (
                          <div key={employee._id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`employee-${employee._id}`}
                              checked={newEmployee.assignedReviewees.includes(employee._id)}
                              onCheckedChange={(checked: boolean | 'indeterminate') => {
                                if (checked === true) {
                                  setNewEmployee({
                                    ...newEmployee,
                                    assignedReviewees: [...newEmployee.assignedReviewees, employee._id]
                                  });
                                } else {
                                  setNewEmployee({
                                    ...newEmployee,
                                    assignedReviewees: newEmployee.assignedReviewees.filter(id => id !== employee._id)
                                  });
                                }
                              }}
                              disabled={isCreating || isInviting}
                            />
                            <label
                              htmlFor={`employee-${employee._id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                            >
                              {employee.name}
                              {employee.department && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                  {employee.department}
                                </span>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-sm text-gray-500">
                        No employees available to assign
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
              <Button variant="outline" onClick={() => setActiveTab("directory")}>Cancel</Button>
              <Button
                onClick={() => {
                  // Validate required fields
                  if (!newEmployee.name || !newEmployee.email || !newEmployee.role) {
                    toast.error("Name, email, and role are required fields");
                    return;
                  }

                  // Validate email format
                  if (!isValidEmail(newEmployee.email)) {
                    toast.error("Please enter a valid email address");
                    return;
                  }

                  // Send invitation
                  inviteEmployee({
                    name: newEmployee.name,
                    email: newEmployee.email,
                    role: newEmployee.role,
                    department_id: newEmployee.department || undefined
                  }, {
                    onSuccess: () => {
                      toast.success("Invitation sent successfully", {
                        description: `An invitation email has been sent to ${newEmployee.email}`
                      });

                      // Reset form
                      setNewEmployee({
                        name: "",
                        email: "",
                        role: "",
                        department: "",
                        assignedReviewees: []
                      });

                      // Switch to directory tab
                      setActiveTab("directory");

                      // Refetch employees to show the new one
                      queryClient.invalidateQueries({ queryKey: [queryKeys.employees] });
                    },
                    onError: (error) => {
                      toast.error(`Failed to send invitation: ${error.message}`);
                    }
                  });
                }}
                disabled={isCreating || isInviting || !newEmployee.name || !newEmployee.email || !newEmployee.role}
                className="min-w-[140px]"
              >
                {isInviting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 