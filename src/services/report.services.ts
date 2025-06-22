import { PerformanceReport } from "@/types";

// Fetch reports for an employee
export const fetchEmployeeReports = async (employeeId: string): Promise<PerformanceReport[]> => {
    const response = await fetch(`/api/reports?employeeId=${employeeId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch employee reports');
    }
    return response.json();
};
// Fetch a specific report by employee ID and month
export const fetchSpecificReport = async (employeeId: string, month: string): Promise<PerformanceReport | null> => {
    const response = await fetch(`/api/reports/${employeeId}/${month}`);
    if (!response.ok) {
        throw new Error('Failed to fetch report');
    }
    const data = await response.json();
    return data; // Will be null if no report exists
};

// Generate a report for an employee for a specific month
export const generateEmployeeReport = async ({
    employeeId,
    month,
}: {
    employeeId: string;
    month: string;
}): Promise<PerformanceReport & { isRegenerated?: boolean; message?: string }> => {
    const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId, month }),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
    }
    
    return response.json();
};

// Types for the best employee response
export interface EmployeeWithDepartment {
    id: string;
    name: string;
    role: string;
    department: string;
    department_id?: string;
}

export interface BestEmployeeData {
    employee: EmployeeWithDepartment;
    avgRating: number;
    reports: {
        month: string;
        ranking: number;
        summary: string;
    }[];
}

export interface MissingReportsEmployee {
    employee: EmployeeWithDepartment;
    missingMonths: string[];
}

// This interface is replaced by an inline type in BestEmployeeResponse

export interface BestEmployeeResponse {
    hasMissingReports: boolean;
    bestEmployees?: BestEmployeeData[];
    bestEmployeesByDepartment?: Array<{
        department: {
            id: string;
            name: string;
        };
        bestEmployees: BestEmployeeData[];
    }>;
    employeesWithMissingReports?: MissingReportsEmployee[];
    months: string[];
}

// Fetch best employee data based on the last three months' ratings
export const fetchBestEmployees = async (): Promise<BestEmployeeResponse> => {
    const response = await fetch('/api/reports/best-employee');
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? 'Failed to fetch best employee data');
    }
    
    return response.json();
};

// Generate missing reports for an employee
export const generateMissingReports = async ({
    employeeId,
    months,
}: {
    employeeId: string;
    months: string[];
}): Promise<{
    generatedReports: PerformanceReport[];
    failedMonths: Array<{ month: string; error: string }>;
    success: boolean;
}> => {
    const response = await fetch('/api/reports/generate-missing', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId, months }),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate missing reports');
    }
    
    return response.json();
};
