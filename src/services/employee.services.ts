import { Employee } from '@/types';

// Fetch all employees with optional filtering
export const fetchEmployees = async (filters?: {
  search?: string;
  department?: string;
}): Promise<Employee[]> => {
    const searchParams = new URLSearchParams();
    
    if (filters?.search) {
        searchParams.append('search', filters.search);
    }
    
    if (filters?.department) {
        searchParams.append('department', filters.department);
    }
    
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`/api/employees${queryString}`);
    
    if (!response.ok) {
        throw new Error('Failed to fetch employees');
    }
    return response.json();
};

// Fetch assigned employees for authenticated employee
export const fetchAssignedEmployees = async (searchQuery?: string): Promise<{currentEmployee: Employee, assignedReviewees: Employee[]}> => {
    const queryParams = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
    const response = await fetch(`/api/employees/assigned${queryParams}`);
    if (!response.ok) {
        throw new Error('Failed to fetch assigned employees');
    }
    return response.json();
};

// Fetch an employee by ID
export const fetchEmployeeById = async (id: string): Promise<Employee> => {
    const response = await fetch(`/api/employees/${id}`);
    if (!response.ok) {
        throw new Error('Failed to fetch employee');
    }
    return response.json();
};

// Create a new employee
export const createEmployee = async (employee: Omit<Employee, '_id'>): Promise<Employee> => {
    const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(employee),
    });
    if (!response.ok) {
        throw new Error('Failed to create employee');
    }
    return response.json();
};

// Invite an employee
export const inviteEmployee = async (employeeData: { 
    email: string; 
    name: string; 
    role: string; 
    department_id?: string;
}): Promise<{ message: string }> => {
    const response = await fetch('/api/employees/invite', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to invite employee');
    }
    
    return response.json();
};

// Resend invitation to an employee
export const resendInvitation = async (employeeId: string): Promise<{ message: string }> => {
    const response = await fetch('/api/employees/resend-invite', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId }),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resend invitation');
    }
    
    return response.json();
};

// Update an employee
export const updateEmployee = async (id: string, employee: Partial<Employee>): Promise<Employee> => {
    const response = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(employee),
    });
    if (!response.ok) {
        throw new Error('Failed to update employee');
    }
    return response.json();
};

// Delete an employee
export const deleteEmployee = async (id: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete employee');
    }
    return response.json();
};
