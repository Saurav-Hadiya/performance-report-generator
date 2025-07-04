// Query keys
const queryKeys = {
    employees: 'employees',
    assignedEmployees: 'assignedEmployees',
    employee: (id: string) => ['employee', id],
    reviews: 'reviews',
    reviewsByEmployee: (employeeId: string) => ['reviews', 'employee', employeeId],
    reviewsByReviewer: (reviewerId: string) => ['reviews', 'reviewer', reviewerId],
    review: (id: string) => ['review', id],
    employeeReviewByCurrentUser: (employeeId: string, currentUserId?: string) => 
      ['employeeReviewByCurrentUser', employeeId, currentUserId ?? 'anonymous'],
    myReviews: 'myReviews',
    reports: 'reports',
    reportsByEmployee: (employeeId: string) => ['reports', employeeId],
    reportByEmployeeAndMonth: (employeeId: string, month: string) => ['reports', employeeId, month],
    bestEmployees: 'bestEmployees',
    organization: 'organization',
    departments: 'departments',
    // Auth related query keys
    auth: 'auth',
    user: 'user',
    validateInvitation: 'validateInvitation',
};

export default queryKeys;