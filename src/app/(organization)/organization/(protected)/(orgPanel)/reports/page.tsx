"use client";

import {
  EmployeeList,
  EmployeeReportDetails,
  FiltersSection,
  MonthOption,
  Report
} from "@/components/organization/ReportsComponents";
import { useEmployees, useGenerateReport, useSpecificReport } from "@/hooks";
import { Employee } from "@/types";
import { useState } from "react";
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
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[0].value);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

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
    onSuccess: () => {
      toast.success(`Report generated for ${selectedEmployee?.name}`);
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

  // Filter employees based on search query and department
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = departmentFilter === "all" ||
      (employee.department === departmentFilter);
    return matchesSearch && matchesDepartment;
  });

  // Get unique departments for filtering
  const departments = [...new Set(employees
    .filter(e => e.department)
    .map(e => e.department))] as string[];

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
        departments={departments}
        employeesLoading={employeesLoading}
        monthOptions={monthOptions}
      />

      {/* Two column layout: employee list and details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee List */}
        <EmployeeList
          filteredEmployees={filteredEmployees}
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