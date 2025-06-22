"use client";

import {
    Avatar,
    AvatarFallback,
    AvatarImage
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    useEmployee,
    useEmployees,
    useOrganization,
    useResendInvitation,
    useUpdateEmployee
} from "@/hooks";
import {
    ArrowLeft,
    Building,
    Edit,
    Loader2,
    Mail,
    Save,
    User,
    X
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import queryKeys from "@/constants/QueryKeys";

// Helper type for the edited employee form
interface EditedEmployeeForm {
    name?: string;
    email?: string;
    role?: string;
    department?: string;
    assignedReviewees?: string[];
}

export default function EmployeeProfilePage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const id = params.id as string;

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const {
        data: employee,
        isLoading: isLoadingEmployee,
        error: employeeError
    } = useEmployee(id);

    const {
        data: employees = [],
        isLoading: isLoadingEmployees
    } = useEmployees();

    const {
        data: organization,
        isLoading: isLoadingOrganization
    } = useOrganization();

    const { mutate: updateEmployee, isPending: isUpdating } = useUpdateEmployee();
    const { mutate: resendInvitation, isPending: isResending } = useResendInvitation();

    const [editedEmployee, setEditedEmployee] = useState<EditedEmployeeForm>({
        name: "",
        email: "",
        role: "",
        department: "",
        assignedReviewees: []
    });

    // Initialize edit form when employee data is loaded
    useEffect(() => {
        if (employee) {
            const revieweeIds: string[] = [];

            // Safely extract reviewee IDs
            if (employee.assignedReviewees && Array.isArray(employee.assignedReviewees)) {
                employee.assignedReviewees.forEach(reviewee => {
                    if (typeof reviewee === 'string') {
                        revieweeIds.push(reviewee);
                    } else if (typeof reviewee === 'object' && reviewee._id) {
                        revieweeIds.push(reviewee._id);
                    }
                });
            }

            setEditedEmployee({
                name: employee.name,
                email: employee.email,
                role: employee.role,
                department: employee.department,
                assignedReviewees: revieweeIds
            });
        }
    }, [employee]);

    const handleOpenEditDialog = () => {
        if (employee) {
            const revieweeIds: string[] = [];

            // Safely extract reviewee IDs
            if (employee.assignedReviewees && Array.isArray(employee.assignedReviewees)) {
                employee.assignedReviewees.forEach(reviewee => {
                    if (typeof reviewee === 'string') {
                        revieweeIds.push(reviewee);
                    } else if (typeof reviewee === 'object' && reviewee._id) {
                        revieweeIds.push(reviewee._id);
                    }
                });
            }

            setEditedEmployee({
                name: employee.name,
                email: employee.email,
                role: employee.role,
                department: employee.department,
                assignedReviewees: revieweeIds
            });

            setIsEditDialogOpen(true);
        }
    };

    const handleSaveEmployee = () => {
        // Basic validation
        if (!editedEmployee.name || !editedEmployee.email || !editedEmployee.role) {
            toast.error("Please fill in all required fields");
            return;
        }

        // Check for email format
        if (editedEmployee.email && !isValidEmail(editedEmployee.email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        updateEmployee({
            id,
            data: editedEmployee
        }, {
            onSuccess: (response) => {
                if (response.emailChanged) {
                    toast.success(
                        "Employee updated successfully. Email address has been changed and login credentials updated for the employee.",
                        { duration: 5000 }
                    );
                } else {
                    toast.success("Employee updated successfully");
                }
                setIsEditDialogOpen(false);
            },
            onError: (error) => {
                toast.error(`Failed to update employee: ${error.message}`);
            }
        });
    };

    const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleResendInvitation = () => {
        resendInvitation(id, {
            onSuccess: (response) => {
                toast.success(response.message || "Invitation resent successfully");
                queryClient.invalidateQueries({ queryKey: queryKeys.employee(id) });
            },
            onError: (error) => {
                toast.error(`Failed to resend invitation: ${error.message}`);
            }
        });
    };

    const departments = organization?.departments || [];
    const isLoading = isLoadingEmployee || isLoadingOrganization;

    if (employeeError) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Employee</h2>
                    <p className="text-gray-600 mb-6">There was a problem fetching the employee data.</p>
                    <Link href="/organization/employees">
                        <Button variant="outline">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Employees
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-gray-500">Loading employee profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="flex items-center gap-1"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
                <h1 className="text-3xl font-bold">Employee Profile</h1>
            </div>

            {employee && (
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle className="text-2xl">{employee.name}</CardTitle>
                            <CardDescription>{employee.role}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            {employee.email && !employee.emailConfirmed && (
                              <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleResendInvitation}
                                  disabled={isResending}
                                  className="flex items-center gap-2"
                                  title="Resend invitation email to employee"
                              >
                                  {isResending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                      <Mail className="h-4 w-4" />
                                  )}
                                  Resend Invitation
                              </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleOpenEditDialog}
                                className="flex items-center gap-2"
                            >
                                <Edit className="h-4 w-4" />
                                Edit Profile
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-shrink-0">
                                <Avatar className="h-32 w-32">
                                    <AvatarImage src={`https://avatar.vercel.sh/${employee._id}`} />
                                    <AvatarFallback className="text-3xl rounded-full bg-primary text-white">{employee.name[0]}</AvatarFallback>
                                </Avatar>
                            </div>

                            <div className="space-y-4 flex-grow">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                                        <p className="text-base font-medium flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-500" />
                                            {employee.name}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
                                        <p className="text-base font-medium flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-gray-500" />
                                            {employee.email}
                                            {employee.email && !employee.emailConfirmed && (
                                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <Mail className="h-3 w-3" />
                                                    Pending Confirmation
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-gray-500">Role</h3>
                                        <p className="text-base font-medium">{employee.role}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-gray-500">Department</h3>
                                        <p className="text-base font-medium flex items-center gap-2">
                                            <Building className="h-4 w-4 text-gray-500" />
                                            {employee.department || "Not assigned"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Assigned Reviewees Section */}
                        <div className="pt-6 border-t">
                            <h3 className="text-lg font-medium mb-4">Assigned Reviewees</h3>

                            {employee.assignedReviewees && Array.isArray(employee.assignedReviewees) && employee.assignedReviewees.length > 0 ? (
                                <div className="grid gap-3 md:grid-cols-3">
                                    {employee.assignedReviewees.map((reviewee) => {
                                        // Handle both string IDs and Employee objects
                                        const revieweeObj = typeof reviewee === 'string'
                                            ? employees.find(e => e._id === reviewee)
                                            : reviewee;

                                        if (!revieweeObj) return null;

                                        return (
                                            <div
                                                key={revieweeObj._id}
                                                className="flex items-center gap-3 p-3 border rounded-lg"
                                            >
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={`https://avatar.vercel.sh/${revieweeObj._id}`} />
                                                    <AvatarFallback>{revieweeObj.name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{revieweeObj.name}</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                                                            {revieweeObj.role}
                                                        </span>
                                                        {revieweeObj.department && (
                                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                                                {revieweeObj.department}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-6 border rounded-lg bg-gray-50">
                                    <p className="text-gray-500">No employees assigned for review</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Edit Employee Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px] md:max-w-[830px] lg:max-w-[1020px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Employee</DialogTitle>
                        <DialogDescription>
                            Update employee information and assignments
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-5 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input
                                        id="edit-name"
                                        placeholder="xyz"
                                        className="pl-8"
                                        value={editedEmployee.name || ""}
                                        onChange={(e) => setEditedEmployee({ ...editedEmployee, name: e.target.value })}
                                        disabled={isUpdating}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input
                                        id="edit-email"
                                        type="email"
                                        placeholder="xyz@company.com"
                                        className="pl-8"
                                        value={editedEmployee.email || ""}
                                        onChange={(e) => setEditedEmployee({ ...editedEmployee, email: e.target.value })}
                                        disabled={isUpdating}
                                    />
                                </div>
                                {employee?.email && editedEmployee.email !== employee.email && (
                                    <div className="p-3 border rounded-md bg-blue-50 text-blue-800 text-sm mt-2">
                                        <p>
                                            <strong>Note:</strong> Changing this email will update the employee's login credentials.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-role">Role</Label>
                                <Input
                                    id="edit-role"
                                    placeholder="Software Engineer"
                                    value={editedEmployee.role || ""}
                                    onChange={(e) => setEditedEmployee({ ...editedEmployee, role: e.target.value })}
                                    disabled={isUpdating}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-department">Department</Label>
                                <div className="relative">
                                    <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 z-10" />
                                    {isLoadingOrganization ? (
                                        <div className="h-10 w-full flex items-center pl-10 border rounded-md bg-gray-50">
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Loading departments...
                                        </div>
                                    ) : (
                                        <Select
                                            disabled={isUpdating}
                                            value={editedEmployee.department || ""}
                                            onValueChange={(value) => setEditedEmployee({ ...editedEmployee, department: value })}
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
                                                        No departments available
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="assignedReviewees">Assign Employees to Review</Label>
                                <span className="text-xs text-gray-500">
                                    Select employees this person can review
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
                                        {employees
                                            .map((emp) => {

                                                if (emp._id === id) return null; // Excluded the current employee

                                                return (
                                                    <div key={emp._id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`employee-${emp._id}`}
                                                            checked={editedEmployee.assignedReviewees?.includes(emp._id) || false}
                                                            onCheckedChange={(checked: boolean | 'indeterminate') => {
                                                                if (checked === true) {
                                                                    setEditedEmployee({
                                                                        ...editedEmployee,
                                                                        assignedReviewees: [
                                                                            ...(editedEmployee.assignedReviewees || []),
                                                                            emp._id
                                                                        ]
                                                                    });
                                                                } else {
                                                                    setEditedEmployee({
                                                                        ...editedEmployee,
                                                                        assignedReviewees: (editedEmployee.assignedReviewees || [])
                                                                            .filter(id => id !== emp._id)
                                                                    });
                                                                }
                                                            }}
                                                            disabled={isUpdating}
                                                        />
                                                        <label
                                                            htmlFor={`employee-${emp._id}`}
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                                                        >
                                                            {emp.name}
                                                            {emp.department && (
                                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                                                    {emp.department}
                                                                </span>
                                                            )}
                                                        </label>
                                                    </div>
                                                )
                                            })}
                                    </div>
                                ) : (
                                    <div className="text-center py-2 text-sm text-gray-500">
                                        No employees available to assign
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
                            disabled={isUpdating}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveEmployee}
                            disabled={isUpdating}
                            className="gap-2"
                        >
                            {isUpdating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 