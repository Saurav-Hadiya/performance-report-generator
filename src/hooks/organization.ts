import queryKeys from '@/constants/QueryKeys';
import {
    addDepartment,
    checkDepartmentInUse,
    deleteDepartment,
    fetchOrganization,
    updateOrganization,
    fetchDepartments
} from '@/services/organization.services';
import { Organization } from '@/types';
import {
    useMutation,
    UseMutationOptions,
    useQuery,
    useQueryClient,
    UseQueryOptions,
} from '@tanstack/react-query';

// Organization hooks
export const useOrganization = (options?: UseQueryOptions<Organization>) => {
    return useQuery({
        queryKey: [queryKeys.organization],
        queryFn: fetchOrganization,
        ...options,
    });
};

// Departments hook
export const useDepartments = (options?: UseQueryOptions<{id: string, name: string}[]>) => {
    return useQuery({
        queryKey: [queryKeys.departments],
        queryFn: fetchDepartments,
        // Always refetch when component mounts
        refetchOnMount: 'always',
        // Enable refetch on window focus
        refetchOnWindowFocus: true,
        // Set a short stale time to ensure frequent refreshes
        staleTime: 1000 * 30, // 30 seconds
        ...options,
    });
};

export const useUpdateOrganization = (
    options?: UseMutationOptions<
        Organization,
        Error,
        Partial<Organization>
    >
) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateOrganization,
        onSuccess: (updatedOrganization) => {
            queryClient.setQueryData(
                [queryKeys.organization],
                updatedOrganization
            );
        },
        ...options,
    });
};

export const useAddDepartment = (
    options?: UseMutationOptions<
        Organization,
        Error,
        string
    >
) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: addDepartment,
        onMutate: async (departmentName) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: [queryKeys.departments] });
            
            // Snapshot previous values for potential rollback
            const previousDepartments = queryClient.getQueryData([queryKeys.departments]);
            
            return { previousDepartments };
        },
        onSuccess: async (updatedOrganization) => {
            // Update the organization data in the cache
            queryClient.setQueryData(
                [queryKeys.organization],
                updatedOrganization
            );
            
            try {
                // Directly fetch fresh departments data
                const departments = await fetchDepartments();
                
                // Update departments cache with fresh data
                queryClient.setQueryData([queryKeys.departments], departments);
                
                // Force a background refetch to ensure consistency
                queryClient.invalidateQueries({
                    queryKey: [queryKeys.departments],
                    refetchType: 'none', // Only mark as stale, refetch will happen on next render
                });
                
                // Also invalidate employees data which might depend on departments
                queryClient.invalidateQueries({
                    queryKey: [queryKeys.employees],
                });
            } catch (err) {
                console.error('Failed to refresh departments after adding:', err);
                // Fallback to standard invalidation
                queryClient.invalidateQueries({
                    queryKey: [queryKeys.departments],
                    refetchType: 'all',
                });
            }
        },
        onError: (err, newDepartment, context: any) => {
            // If the mutation fails, use the context we saved to roll back
            if (context?.previousDepartments) {
                queryClient.setQueryData([queryKeys.departments], context.previousDepartments);
            }
        },
        ...options,
    });
};

export const useDeleteDepartment = (
    options?: UseMutationOptions<
        Organization,
        Error,
        string
    >
) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteDepartment,
        onMutate: async (departmentName) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: [queryKeys.departments] });
            
            // Snapshot previous values for potential rollback
            const previousDepartments = queryClient.getQueryData([queryKeys.departments]);
            
            return { previousDepartments };
        },
        onSuccess: async (updatedOrganization) => {
            // Update the organization data in the cache
            queryClient.setQueryData(
                [queryKeys.organization],
                updatedOrganization
            );
            
            try {
                // Directly fetch fresh departments data
                const departments = await fetchDepartments();
                
                // Update departments cache with fresh data
                queryClient.setQueryData([queryKeys.departments], departments);
                
                // Force a background refetch to ensure consistency
                queryClient.invalidateQueries({
                    queryKey: [queryKeys.departments],
                    refetchType: 'none', // Only mark as stale, refetch will happen on next render
                });
                
                // Also invalidate employees data which might depend on departments
                queryClient.invalidateQueries({
                    queryKey: [queryKeys.employees],
                });
            } catch (err) {
                console.error('Failed to refresh departments after deletion:', err);
                // Fallback to standard invalidation
                queryClient.invalidateQueries({
                    queryKey: [queryKeys.departments],
                    refetchType: 'all',
                });
            }
        },
        onError: (err, deletedDepartment, context: any) => {
            // If the mutation fails, use the context we saved to roll back
            if (context?.previousDepartments) {
                queryClient.setQueryData([queryKeys.departments], context.previousDepartments);
            }
        },
        ...options,
    });
};

export const useCheckDepartmentInUse = (
    departmentName: string,
    options?: Omit<UseQueryOptions<{ inUse: boolean }, Error, { inUse: boolean }>, 'queryKey' | 'queryFn'>
) => {
    return useQuery<{ inUse: boolean }, Error>({
        queryKey: [queryKeys.departments, 'inUse', departmentName],
        queryFn: () => checkDepartmentInUse(departmentName),
        // Don't refetch automatically
        staleTime: Infinity,
        ...options,
    });
}; 