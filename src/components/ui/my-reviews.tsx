"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, RefreshCw } from "lucide-react";
import { useMyReviews } from "@/hooks/reviews";

interface Employee {
  id: string;
  name: string;
  role: string;
  department?: string;
}

interface Review {
  id: string;
  content: string;
  timestamp: Date;
  targetEmployee: Employee;
}

export function MyReviews() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);
  
  // Use the updated hook with debounced search query
  const { data, isLoading, isError, refetch } = useMyReviews(debouncedQuery);
  
  // Get reviews from the response or default to empty array
  const userReviews = data?.reviews || [];

  const getEmployeeName = (employee: any): string => {
    if (!employee) return "Unknown";
    if (typeof employee === "string") return "Employee " + employee.substring(0, 5);
    return employee.name || "Unnamed";
  };

  const getEmployeeRole = (employee: any): string => {
    if (!employee) return "";
    if (typeof employee === "string") return "Employee";
    return employee.role || "";
  };

  const getEmployeeId = (employee: any): string => {
    if (!employee) return "unknown";
    if (typeof employee === "string") return employee;
    return employee.id || "unknown";
  };

  const getEmployeeDepartment = (employee: any): string | undefined => {
    if (!employee || typeof employee === "string") return undefined;
    return employee.department;
  };

  const filteredReviews = userReviews;

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <Card className="border shadow-none flex-1 flex flex-col min-h-0">
        <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between">
          <CardTitle className="text-xl">My Reviews</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            disabled={isLoading}
            className="h-8 px-2"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center flex-shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Reviews List with ScrollArea */}
          <div className="flex-1 flex flex-col min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500" />
              </div>
            ) : isError ? (
              <div className="text-center py-8 border rounded-lg bg-gray-50">
                <p className="text-red-500">Error loading reviews</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => refetch()}
                >
                  Try Again
                </Button>
              </div>
            ) : userReviews.length > 0 ? (
              <>
                {filteredReviews.length > 0 ? (
                  <ScrollArea className="flex-1 min-h-0">
                    <div className="space-y-4 pr-4">
                      {filteredReviews.map((review: Review) => (
                        <Card key={review.id} className="border hover:shadow-md transition-shadow">
                          <CardHeader className="flex flex-row items-center gap-4 pb-2">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={`https://avatar.vercel.sh/${getEmployeeId(review.targetEmployee)}`} />
                              <AvatarFallback>{getEmployeeName(review.targetEmployee)[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <CardTitle className="text-lg">{getEmployeeName(review.targetEmployee)}</CardTitle>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 gap-1 sm:gap-2">
                                <p>{getEmployeeRole(review.targetEmployee)}</p>
                                {getEmployeeDepartment(review.targetEmployee) && (
                                  <>
                                    <span className="hidden sm:inline">•</span>
                                    <p>{getEmployeeDepartment(review.targetEmployee)}</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="rounded-lg p-3 bg-gray-50">
                              <p className="text-sm">{review.content}</p>
                              <div className="flex justify-between items-center mt-3">
                                <p className="text-xs text-gray-500">
                                  {formatDate(review.timestamp)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 border rounded-lg bg-gray-50">
                    <p className="text-gray-500">No reviews found matching your search</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 border rounded-lg bg-gray-50">
                <p className="text-gray-500">You haven't given any reviews yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Select an employee from the sidebar to provide your first review
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
