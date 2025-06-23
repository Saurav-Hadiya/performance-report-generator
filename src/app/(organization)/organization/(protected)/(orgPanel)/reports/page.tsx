"use client";

import {
  EmployeeList,
  EmployeeReportDetails,
  FiltersSection,
  MonthOption,
  Report
} from "@/components/organization/ReportsComponents";
import { useEmployees, useGenerateReport, useSpecificReport } from "@/hooks";
import { useDepartments } from "@/hooks";
import { Employee } from "@/types";
import { useState, useEffect } from "react";
import { toast } from "sonner";

// Generate formatted months for the last 12 months
const getMonthOptions = (): MonthOption[] => {
  const options: MonthOption[] = [];
  const currentDate = new Date();

  for (let i = 0; i < 12; i++) {
    const date = new Date(currentDate);
    date.setMonth(currentDate.getMonth() - i);

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const formatted = `${year}-${month}`;

    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    const label = `${monthNames[date.getMonth()]} ${year}`;

    options.push({ value: formatted, label });
  }

  return options;
};

const monthOptions = getMonthOptions();

export default function ReportsPage() {
  // State for search and filters with debouncing
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[0].value);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Fetch all departments for the organization
  const { 
    data: departmentData = [], 
    isLoading: departmentsLoading 
  } = useDepartments();
  
  // Create a list of department names for the filter dropdown
  const allDepartments = departmentData.map(dept => dept.name);

  // Use server-side filtering with the enhanced hook
  const { 
    data: employees = [], 
    isLoading: employeesLoading 
  } = useEmployees(
    {
      search: debouncedSearch,
      department: departmentFilter !== "all" ? departmentFilter : undefined
    }
  );

  // Fetch the specific report for the selected employee and month
  const {
    data: selectedMonthReport,
    isLoading: reportsLoading
  } = useSpecificReport(
    selectedEmployee?._id ?? '',
    selectedMonth,
    {
      enabled: !!selectedEmployee
    }
  );

  // Generate report mutation
  const {
    mutate: generateReport,
    isPending: isGenerating
  } = useGenerateReport({
    onSuccess: (data) => {
      if (data.isRegenerated) {
        toast.success(`Report regenerated for ${selectedEmployee?.name}`, {
          description: data.message || 'Report has been updated with latest data.',
        });
      } else {
        toast.success(`Report generated for ${selectedEmployee?.name}`, {
          description: data.message || 'New report has been created successfully.',
        });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  // Handle generate report
  const handleGenerateReport = () => {
    if (!selectedEmployee) {
      toast.error("Please select an employee");
      return;
    }

    generateReport({
      employeeId: selectedEmployee._id,
      month: selectedMonth
    });
  };

  // Convert PerformanceReport to Report type if it exists
  const reportData: Report | undefined = selectedMonthReport ? {
    _id: selectedMonthReport._id ?? '',
    employeeId: selectedMonthReport.employeeId,
    month: selectedMonthReport.month,
    ranking: selectedMonthReport.ranking,
    qualities: selectedMonthReport.qualities,
    improvements: selectedMonthReport.improvements,
    summary: selectedMonthReport.summary,
    criterias: selectedMonthReport.criterias
  } : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Employee Performance Reports</h1>
      </div>

      {/* Filters */}
      <FiltersSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        departmentFilter={departmentFilter}
        setDepartmentFilter={setDepartmentFilter}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        departments={allDepartments}
        employeesLoading={employeesLoading || departmentsLoading}
        monthOptions={monthOptions}
      />

      {/* Two column layout: employee list and details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee List */}
        <EmployeeList
          filteredEmployees={employees}
          employeesLoading={employeesLoading}
          selectedEmployee={selectedEmployee}
          setSelectedEmployee={setSelectedEmployee}
        />

        {/* Employee Reports */}
        <EmployeeReportDetails
          selectedEmployee={selectedEmployee}
          selectedMonthReport={reportData}
          reportsLoading={reportsLoading}
          selectedMonth={selectedMonth}
          handleGenerateReport={handleGenerateReport}
          isGenerating={isGenerating}
          monthOptions={monthOptions}
        />
      </div>
    </div>
  );
} 