"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BadgeCheck, Users, Star, TrendingUp, Flag, Activity, Trophy, FileSpreadsheet, AlertTriangle, UserPlus } from "lucide-react";
import { useBestEmployees, useGenerateMissingReports } from "@/hooks/reports";
import { useEmployees } from "@/hooks";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

export default function Dashboard() {
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    data: employees = [],
    isLoading: isLoadingEmployees
  } = useEmployees();

  const {
    data: bestEmployeeData,
    isLoading: isLoadingBestEmployees,
    error: bestEmployeesError,
    refetch: refetchBestEmployees
  } = useBestEmployees({
    enabled: employees.length > 0 // Only fetch when there are employees
  });

  const generateMissingReportsMutation = useGenerateMissingReports({
    onSuccess: (data) => {
      setIsGenerating(false);
      if (data.success) {
        toast.success("Reports generated successfully", {
          description: `Generated ${data.generatedReports.length} reports for the employee.`,
        });
        refetchBestEmployees();
      } else {
        toast.error("Some reports failed to generate", {
          description: `Generated ${data.generatedReports.length} reports, but ${data.failedMonths.length} failed.`,
        });
      }
    },
    onError: (error) => {
      setIsGenerating(false);
      toast.error("Failed to generate reports", {
        description: error.message,
      });
    }
  });

  // Get all missing reports from all employees
  const getAllMissingReports = () => {
    if (!bestEmployeeData?.employeesWithMissingReports || bestEmployeeData.employeesWithMissingReports.length === 0) {
      return [];
    }

    return bestEmployeeData.employeesWithMissingReports.map(employeeData => ({
      employeeId: employeeData.employee.id,
      employeeName: employeeData.employee.name,
      months: employeeData.missingMonths
    }));
  };

  const missingReports = getAllMissingReports();
  const hasMissingReports = bestEmployeeData?.hasMissingReports || false;

  const handleGenerateAllMissingReports = () => {
    if (missingReports.length === 0) return;

    setIsGenerating(true);

    // Process each employee's missing reports sequentially
    const processNextEmployee = (index = 0) => {
      if (index >= missingReports.length) {
        setIsGenerating(false);
        refetchBestEmployees();
        toast.success("All missing reports generated successfully");
        return;
      }

      const { employeeId, employeeName, months } = missingReports[index];

      toast.info(`Generating reports for ${employeeName}...`, {
        duration: 2000,
      });

      generateMissingReportsMutation.mutate(
        { employeeId, months },
        {
          onSuccess: () => {
            // Process next employee
            processNextEmployee(index + 1);
          },
          onError: (error) => {
            toast.error(`Failed to generate reports for ${employeeName}`, {
              description: error.message,
            });
            // Continue with next employee despite error
            processNextEmployee(index + 1);
          }
        }
      );
    };

    processNextEmployee();
  };

  // Get the top employees
  const topEmployees = bestEmployeeData?.bestEmployees || [];

  // Format month for display
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return `${date.toLocaleString('default', { month: 'short' })} ${year}`;
  };

  // Early return for no employees case
  if (!isLoadingEmployees && employees.length === 0) {
    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Employees</p>
                <div className="text-3xl font-bold">0</div>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <Users className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* No Employees State */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-400" />
              Welcome to Your Dashboard
            </CardTitle>
            <CardDescription>
              Get started by adding your first employee to begin tracking performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="h-10 w-10 text-gray-400" />
                </div>
                <div className="max-w-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Employees Yet</h3>
                  <p className="text-gray-600 mb-6">
                    Your organization doesn't have any employees yet. Add employees to start tracking their performance and generating reports.
                  </p>
                  <Button asChild>
                    <Link href="/organization/employees">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Your First Employee
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Employees</p>
              <div className="text-3xl font-bold">
                {isLoadingEmployees ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  employees.length
                )}
              </div>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Missing Reports Section */}
      {hasMissingReports ? (
        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <CardTitle>Missing Performance Reports</CardTitle>
              </div>
              <Button
                variant="default"
                size="sm"
                className="bg-amber-600 hover:bg-amber-700"
                disabled={isGenerating}
                onClick={handleGenerateAllMissingReports}
              >
                {isGenerating ? "Generating..." : "Generate All Missing Reports"}
              </Button>
            </div>
            <CardDescription>
              All reports must be generated to determine the best employee
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-amber-50 border-amber-200 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-amber-800">Missing Reports Found</AlertTitle>
              <AlertDescription className="text-amber-700">
                There {missingReports.length === 1 ? 'is' : 'are'} {missingReports.length} {missingReports.length === 1 ? 'employee' : 'employees'} with missing reports for the past three completed months.
                Generate all missing reports to see who is the best performing employee in your organization.
              </AlertDescription>
            </Alert>

            <div className="mt-4 space-y-3">
              {missingReports.map((employee) => (
                <div key={employee.employeeId} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://avatar.vercel.sh/${employee.employeeId}`} />
                    <AvatarFallback>{employee.employeeName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{employee.employeeName}</p>
                    <p className="text-sm text-gray-600">
                      Missing reports: {employee.months.map(m => formatMonth(m)).join(', ')}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {employee.months.length} {employee.months.length === 1 ? 'report' : 'reports'} missing
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Best Employee Card - Only shown when there are no missing reports */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Best Performing Employee
                  </CardTitle>
                  <CardDescription>
                    Based on past three completed months performance ratings
                    {bestEmployeeData?.months && (
                      <span className="block text-xs mt-1">
                        Months considered: {bestEmployeeData.months.map(m => formatMonth(m)).join(', ')}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchBestEmployees()}
                >
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {bestEmployeesError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load best employee data. Please try again.
                  </AlertDescription>
                </Alert>
              ) : isLoadingBestEmployees ? (
                <div className="flex items-center gap-4 p-3 rounded-lg border">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-10 w-20 rounded-full" />
                </div>
              ) : topEmployees.length > 0 ? (
                <div className="space-y-4">
                  {topEmployees.length > 1 && (
                    <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                      <Trophy className="h-4 w-4" />
                      <AlertTitle className="text-blue-800">Multiple Top Performers!</AlertTitle>
                      <AlertDescription className="text-blue-700">
                        {topEmployees.length} employees have same highest rating of {topEmployees[0].avgRating.toFixed(2)}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-1 gap-4">
                    {topEmployees.map((employee, index) => (
                      <div key={index} className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200">
                        {/* <div className="relative"> */}
                          <Avatar className="h-20 w-20 border-4 border-yellow-500 shadow-lg">
                            <AvatarImage src={`https://avatar.vercel.sh/${employee.employee.id}`} />
                            <AvatarFallback>{employee.employee.name[0]}</AvatarFallback>
                          </Avatar>

                        <div className="flex-1 text-center md:text-left">
                          <h3 className="text-xl font-bold">{employee.employee.name}</h3>
                          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 text-gray-600 mt-1">
                            <span>{employee.employee.role}</span>
                            <span className="hidden md:inline">•</span>
                            <span>{employee.employee.department}</span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-2">
                            <Badge className="bg-yellow-500 hover:bg-yellow-600">Top Performer</Badge>
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center justify-center h-20 w-20 bg-yellow-100 text-yellow-800 rounded-full">
                            <div className="text-center">
                              <Star className="h-5 w-5 mx-auto mb-1" />
                              <span className="text-xl font-bold">{employee.avgRating.toFixed(2)}</span>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">Average Rating</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No employee data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Best Employees By Department Section */}
          {bestEmployeeData?.bestEmployeesByDepartment && bestEmployeeData.bestEmployeesByDepartment.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-blue-500" />
                  Best Performers by Department
                </CardTitle>
                <CardDescription>
                  Top performers in each department based on the past three months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bestEmployeeData.bestEmployeesByDepartment.map((deptData, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <Users className="h-4 w-4" />
                          </div>
                          <h3 className="font-semibold text-lg">{deptData.department.name}</h3>
                        </div>

                      <div className="space-y-3">
                        {deptData.bestEmployees.map((empData, empIndex) => (
                          <div key={empIndex} className="flex items-center gap-3 p-2 rounded-md bg-blue-50/50">
                            <Avatar className="h-12 w-12 border-2 border-blue-400">
                              <AvatarImage src={`https://avatar.vercel.sh/${empData.employee.id}`} />
                              <AvatarFallback>{empData.employee.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{empData.employee.name}</p>
                              <p className="text-sm text-gray-600">{empData.employee.role}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm font-semibold">{empData.avgRating.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

    </div>
  );
} 