"use client";

import { useState, useEffect } from "react";
import { useAssignedEmployees, useReviewsByReviewer } from "@/hooks";
import { Sidebar } from "@/components/ui/sidebar";
import { EmployeeFeedback } from "@/components/ui/employee-feedback";
import { MyReviews } from "@/components/ui/my-reviews";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RefreshCw, LogOut } from "lucide-react";
import { Employee, Review } from "@/types";
import { UseQueryOptions } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Home() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [viewMyReviews, setViewMyReviews] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  
  // Search state for employees - lifted up from sidebar
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);
  
  const router = useRouter();
  const supabase = createClient();

  // Use the assigned employees hook with search parameter
  const {
    data: assignedData,
    isLoading: assignedLoading,
    isError: assignedError,
    refetch: refetchAssigned
  } = useAssignedEmployees(debouncedQuery);

  // Extract current employee and assigned reviewees from the response
  const currentEmployee = assignedData?.currentEmployee;
  // employees list for the initial employee selection
  const employees = assignedData?.assignedReviewees || [];

  // Set current user ID from the authenticated employee data
  useEffect(() => {
    if (currentEmployee && !currentUserId) {
      setCurrentUserId(currentEmployee._id);
    }
  }, [currentEmployee, currentUserId]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch (error: any) {
      console.error("Logout error:", error);
      toast.error(error.message ?? "Failed to log out");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Only fetch reviews by the current reviewer when viewing "My Reviews"
  const {
    data: myReviews = [],
    isLoading: reviewsLoading,
    isError: reviewsError,
    refetch: refetchReviews
  } = useReviewsByReviewer(
    currentUserId ?? "", 
    { enabled: false } as UseQueryOptions<Review[]>
  );

  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setViewMyReviews(false);
  };

  const handleViewMyReviews = () => {
    setViewMyReviews(true);
    setSelectedEmployee(null);
  };

  const handleRetry = () => {
    refetchAssigned();
    if (viewMyReviews && currentUserId) {
      refetchReviews();
    }
    setErrorDialogOpen(false);
  };

  // Show error dialog if any fetch fails
  const hasError = assignedError || reviewsError;
  if (hasError && !errorDialogOpen) {
    setErrorDialogOpen(true);
  }

  // loading state
  const isLoading = assignedLoading || (viewMyReviews && reviewsLoading);

  return (
    <main className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b z-10 flex-shrink-0">
        <div className="container mx-auto py-4 px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-red-700">
              Employee Performance Feedback
            </h1>
            <div className="flex items-center gap-2">
              {/* No longer need user selection dropdown as we're using auth */}
              {currentEmployee && (
                <div className="text-sm font-medium">
                  Welcome, {currentEmployee.name}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => {
                  refetchAssigned();
                  if (viewMyReviews && currentUserId) {
                    refetchReviews();
                  }
                }}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              
              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className={`h-4 w-4 ${isLoggingOut ? 'animate-bounce' : ''}`} />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 container mx-auto p-4 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
          {/* Sidebar */}
          <div className="md:col-span-3 lg:col-span-3 bg-white rounded-lg shadow h-full overflow-hidden">
            <Sidebar
              employees={employees}
              isLoading={assignedLoading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSelectEmployee={handleSelectEmployee}
              onViewMyReviews={handleViewMyReviews}
              selectedEmployeeId={selectedEmployee?._id}
              currentUserId={currentUserId}
            />
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-9 lg:col-span-9 bg-white rounded-lg shadow h-full overflow-hidden">
            {!selectedEmployee && !viewMyReviews ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8 max-w-md">
                  <h2 className="text-2xl font-semibold mb-4">Welcome to the Performance Feedback System</h2>
                  <p className="text-gray-600 mb-6">
                    This platform allows you to provide constructive feedback to team members
                    and track your own feedback history.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => handleViewMyReviews()}>
                      View My Reviews
                    </Button>
                    <Button variant="outline" onClick={() => employees.length > 0 && handleSelectEmployee(employees[0])}>
                      Start Giving Feedback
                    </Button>
                  </div>
                </div>
              </div>
            ) : viewMyReviews ? (
              <MyReviews />
            ) : (
              selectedEmployee && (
                <EmployeeFeedback
                  employeeId={selectedEmployee._id}
                  employeeName={selectedEmployee.name}
                  employeeRole={selectedEmployee.role}
                  employeeDepartment={selectedEmployee.department}
                  currentUserId={currentUserId}
                />
              )
            )}
          </div>
        </div>
      </div>

      {/* Error Dialog */}
      <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Connection Error</AlertDialogTitle>
            <AlertDialogDescription>
              There was a problem loading data from the server. Please check your connection and try again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRetry}>Try Again</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
