import { Organization } from '@/types';

// Fetch organization settings
export const fetchOrganization = async (): Promise<Organization> => {
    const response = await fetch('/api/organization');
    if (!response.ok) {
        throw new Error('Failed to fetch organization settings');
    }
    return response.json();
};

// Update organization settings
export const updateOrganization = async (organization: Partial<Organization>): Promise<Organization> => {
    const response = await fetch('/api/organization', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(organization),
    });
    if (!response.ok) {
        throw new Error('Failed to update organization settings');
    }
    return response.json();
};

// Add a department
export const addDepartment = async (departmentName: string): Promise<Organization> => {
    const response = await fetch('/api/organization/departments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ departmentName }),
    });
    if (!response.ok) {
        throw new Error('Failed to add department');
    }
    return response.json();
};

// Delete a department
export const deleteDepartment = async (departmentName: string): Promise<Organization> => {
    const response = await fetch(`/api/organization/departments/${encodeURIComponent(departmentName)}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete department');
    }
    return response.json();
};

// Check if department is being used by employees
export const checkDepartmentInUse = async (departmentName: string): Promise<{ inUse: boolean }> => {
    const response = await fetch(`/api/organization/departments/${encodeURIComponent(departmentName)}/check`);
    if (!response.ok) {
        throw new Error('Failed to check department usage');
    }
    return response.json();
};

// Fetch all departments
export const fetchDepartments = async (): Promise<{id: string, name: string}[]> => {
    const response = await fetch('/api/organization/departments');
    if (!response.ok) {
        throw new Error('Failed to fetch departments');
    }
    return response.json();
}; 