import queryKeys from '@/constants/QueryKeys';
import { 
    fetchEmployeeReports, 
    fetchSpecificReport, 
    generateEmployeeReport, 
    fetchBestEmployees, 
    generateMissingReports,
    BestEmployeeResponse 
} from '@/services/report.services';
import { PerformanceReport } from '@/types';
import {
    useMutation,
    UseMutationOptions,
    useQuery,
    useQueryClient,
    UseQueryOptions,
} from '@tanstack/react-query';

// Hook to fetch all reports for an employee
export const useEmployeeReports = (
    employeeId: string,
    options?: Omit<UseQueryOptions<PerformanceReport[]>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: [queryKeys.reportsByEmployee(employeeId)],
        queryFn: () => fetchEmployeeReports(employeeId),
        enabled: !!employeeId,
        ...options,
    });
};

// Hook to fetch a specific report by employee ID and month
export const useSpecificReport = (
    employeeId: string,
    month: string,
    options?: Omit<UseQueryOptions<PerformanceReport | null>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: queryKeys.reportByEmployeeAndMonth(employeeId, month),
        queryFn: () => fetchSpecificReport(employeeId, month),
        enabled: !!employeeId && !!month,
        ...options,
    });
};

// Hook to generate a report for an employee for a specific month
export const useGenerateReport = (
    options?: UseMutationOptions<
        PerformanceReport,
        Error,
        { employeeId: string; month: string }
    >
) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: generateEmployeeReport,
        onSuccess: (newReport) => {
            // Invalidate the employee's reports list
            queryClient.invalidateQueries({ 
                queryKey: [queryKeys.reportsByEmployee(newReport.employeeId)]
            });
            
            // Invalidate the specific report query to force refetch
            queryClient.invalidateQueries({
                queryKey: queryKeys.reportByEmployeeAndMonth(newReport.employeeId, newReport.month)
            });
            
            // Also set the query data directly for immediate UI update
            queryClient.setQueryData(
                queryKeys.reportByEmployeeAndMonth(newReport.employeeId, newReport.month),
                newReport
            );
            
            // Invalidate best employees data as well since reports affect rankings
            queryClient.invalidateQueries({ queryKey: [queryKeys.bestEmployees] });
        },
        ...options,
    });
};

// Hook to fetch the best employee based on the last 3 months of reports
export const useBestEmployees = (
    options?: Omit<UseQueryOptions<BestEmployeeResponse>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: [queryKeys.bestEmployees],
        queryFn: fetchBestEmployees,
        ...options,
    });
};

// Hook to generate missing reports for employees
export const useGenerateMissingReports = (
    options?: UseMutationOptions<
        {
            generatedReports: PerformanceReport[];
            failedMonths: Array<{ month: string; error: string }>;
            success: boolean;
        },
        Error,
        { employeeId: string; months: string[] }
    >
) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: generateMissingReports,
        onSuccess: (data, variables) => {
            // Invalidate the employee's reports list
            queryClient.invalidateQueries({ 
                queryKey: [queryKeys.reportsByEmployee(variables.employeeId)]
            });
            
            // Invalidate specific report queries for each generated report
            data.generatedReports.forEach(report => {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.reportByEmployeeAndMonth(report.employeeId, report.month)
                });
                
                // Set the query data directly for immediate UI update
                queryClient.setQueryData(
                    queryKeys.reportByEmployeeAndMonth(report.employeeId, report.month),
                    report
                );
            });
            
            // Invalidate best employee query after generating missing reports
            queryClient.invalidateQueries({ queryKey: [queryKeys.bestEmployees] });
            
            // Also invalidate all reports queries
            queryClient.invalidateQueries({ queryKey: [queryKeys.reports] });
        },
        ...options,
    });
}; 