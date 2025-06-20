import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Employee } from "@/types";
import { CalendarIcon, Filter, Loader2, Search } from "lucide-react";
import { Dispatch, SetStateAction, MouseEventHandler } from "react";

// Types for the month options
export interface MonthOption {
  value: string;
  label: string;
}

// Types for filters section props
interface FiltersSectionProps {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  departmentFilter: string;
  setDepartmentFilter: Dispatch<SetStateAction<string>>;
  selectedMonth: string;
  setSelectedMonth: Dispatch<SetStateAction<string>>;
  departments: string[];
  employeesLoading: boolean;
  monthOptions: MonthOption[];
}

// Types for employee list props
interface EmployeeListProps {
  filteredEmployees: Employee[];
  employeesLoading: boolean;
  selectedEmployee: Employee | null;
  setSelectedEmployee: Dispatch<SetStateAction<Employee | null>>;
}

// Types for employee list item props
interface EmployeeListItemProps {
  employee: Employee;
  isSelected: boolean;
  onSelect: MouseEventHandler<HTMLDivElement>;
}

// Types for report data
export interface Report {
  _id: string;
  employeeId: string;
  month: string;
  ranking: number;
  qualities: string[];
  improvements: string[];
  summary: string;
  criterias: { [key: string]: number } | null;
}

// Types for employee report details props
interface EmployeeReportDetailsProps {
  selectedEmployee: Employee | null;
  selectedMonthReport: Report | undefined;
  reportsLoading: boolean;
  selectedMonth: string;
  handleGenerateReport: () => void;
  isGenerating: boolean;
  monthOptions: MonthOption[];
}

// Component for the filters section
export const FiltersSection = ({ 
  searchQuery, 
  setSearchQuery, 
  departmentFilter, 
  setDepartmentFilter, 
  selectedMonth, 
  setSelectedMonth, 
  departments, 
  employeesLoading,
  monthOptions 
}: FiltersSectionProps) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search employees..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={employeesLoading}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select
            value={departmentFilter}
            onValueChange={setDepartmentFilter}
            disabled={employeesLoading}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-gray-500" />
          <Select
            value={selectedMonth}
            onValueChange={setSelectedMonth}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent className="z-50">
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Component for individual employee list item
const EmployeeListItem = ({ 
  employee, 
  isSelected, 
  onSelect 
}: EmployeeListItemProps) => (
  <div
    className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 ${
      isSelected
        ? "bg-primary/10 border border-primary/20"
        : "hover:bg-gray-100 border border-transparent"
    }`}
    onClick={onSelect}
  >
    <Avatar>
      <AvatarImage src={`https://avatar.vercel.sh/${employee._id}`} />
      <AvatarFallback>{employee.name[0]}</AvatarFallback>
    </Avatar>

    <div className="flex-1 min-w-0">
      <p className="font-medium truncate">{employee.name}</p>
      <p className="text-sm text-gray-500 truncate">{employee.role}</p>
    </div>
  </div>
);

// Component for the employee list
export const EmployeeList = ({ 
  filteredEmployees, 
  employeesLoading, 
  selectedEmployee, 
  setSelectedEmployee 
}: EmployeeListProps) => (
  <Card className="lg:col-span-1 h-[700px] overflow-hidden flex flex-col">
    <CardHeader className="pb-2">
      <CardTitle>Employees</CardTitle>
      <CardDescription>
        {employeesLoading
          ? "Loading employees..."
          : `${filteredEmployees.length} employees found`}
      </CardDescription>
    </CardHeader>

    <div className="flex-1 overflow-y-auto px-4 pb-4">
      {employeesLoading ? (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEmployees.map((employee) => (
            <EmployeeListItem 
              key={employee._id}
              employee={employee}
              isSelected={selectedEmployee?._id === employee._id}
              onSelect={() => setSelectedEmployee(employee)}
            />
          ))}

          {filteredEmployees.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No employees found
            </div>
          )}
        </div>
      )}
    </div>
  </Card>
);

// Component for the employee report details section
export const EmployeeReportDetails = ({
  selectedEmployee,
  selectedMonthReport,
  reportsLoading,
  selectedMonth,
  handleGenerateReport,
  isGenerating,
  monthOptions
}: EmployeeReportDetailsProps) => {
  if (!selectedEmployee) {
    return (
      <Card className="lg:col-span-2 h-[700px] overflow-hidden flex flex-col">
        <div className="flex items-center justify-center h-full text-gray-500">
          Select an employee to view reports
        </div>
      </Card>
    );
  }
  
  if (reportsLoading) {
    return (
      <Card className="lg:col-span-2 h-[700px] overflow-hidden flex flex-col">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }
  
  if (!selectedMonthReport) {
    return (
      <Card className="lg:col-span-2 h-[700px] overflow-hidden flex flex-col">
        <div className="flex flex-col items-center justify-center h-full p-6">
          <h3 className="text-lg font-medium mb-2">No Report Available</h3>
          <p className="text-gray-500 text-center mb-6">
            No performance report is available for {selectedEmployee.name} for {" "}
            {monthOptions.find(m => m.value === selectedMonth)?.label}.
          </p>
          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              "Generate Report"
            )}
          </Button>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="lg:col-span-2 h-[700px] overflow-hidden flex flex-col">
      <CardHeader className="border-b pb-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={`https://avatar.vercel.sh/${selectedEmployee._id}`} />
            <AvatarFallback>{selectedEmployee.name[0]}</AvatarFallback>
          </Avatar>

          <div>
            <CardTitle className="text-xl">{selectedEmployee.name}</CardTitle>
            <CardDescription>
              {selectedEmployee.role} {selectedEmployee.department ? `• ${selectedEmployee.department}` : ''}
            </CardDescription>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="text-2xl font-bold text-yellow-600">{selectedMonthReport.ranking}</div>
            <div className="text-sm text-gray-500">/ 10</div>
          </div>
        </div>
      </CardHeader>

      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Detailed Report</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedMonthReport.qualities.map((quality, i) => (
                      <li key={i} className="text-sm">
                        {quality}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Areas for Improvement</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedMonthReport.improvements.map((area, i) => (
                      <li key={i} className="text-sm">
                        {area}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

             {selectedMonthReport.criterias && Object.keys(selectedMonthReport.criterias).length > 0 && <Card>
                <CardHeader>
                  <CardTitle>Criterias</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1">
                    {Object.entries(selectedMonthReport.criterias).map(([key, value]) => (
                      <li key={key} className="text-sm">
                        {key}: {value} / 10
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>}
            </div>
          </TabsContent>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Summary</CardTitle>
                <CardDescription>
                  Generated report for {monthOptions.find(m => m.value === selectedMonthReport.month)?.label}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg bg-gray-50">
                    <p className="text-sm">
                      {selectedMonthReport.summary}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}; 