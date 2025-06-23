import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET assigned employees for the authenticated employee
export async function GET(req: NextRequest) {
  try {
    // Get search query from URL params
    const searchQuery = req.nextUrl.searchParams.get('search') || '';
    
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    // Get the employee details for the authenticated user
    const { data: currentEmployee, error: empError } = await supabase
      .from('employees')
      .select(`
        id,
        name,
        role,
        email,
        department_id,
        departments:department_id(
          id,
          name
        )
      `)
      .eq('email', user.email)
      .single();
    if (empError) {
      console.error('Error fetching employee profile:', empError);
      return NextResponse.json(
        { error: 'Employee profile not found' },
        { status: 404 }
      );
    }
    
    // Get employees assigned to this reviewer
    const { data: assignedReviewees, error: relError } = await supabase
      .from('employee_review_to')
      .select(`
        reviewee_id
      `)
      .eq('reviewer_id', currentEmployee.id);
    
    if (relError) {
      console.error('Error fetching assigned reviewees:', relError);
      return NextResponse.json(
        { error: 'Failed to fetch assigned reviewees' },
        { status: 500 }
      );
    }
    // Get the details of assigned reviewees
    const revieweeIds = assignedReviewees.map(rel => rel.reviewee_id);
    
    if (revieweeIds.length === 0) {
      // No assigned reviewees, return empty array
      return NextResponse.json({
        currentEmployee: {
          _id: currentEmployee.id,
          name: currentEmployee.name,
          role: currentEmployee.role,
          email: currentEmployee.email,
          department: (currentEmployee.departments as any)?.name ?? null
        },
        assignedReviewees: []
      }, { status: 200 });
    }
    
    // Build the query for reviewees
    let query = supabase
      .from('employees')
      .select(`
        id,
        name,
        role,
        department_id,
        departments:department_id(
          id,
          name
        )
      `)
      .in('id', revieweeIds);
    
    // Apply search filter on the server side if provided
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,role.ilike.%${searchQuery}%`);
    }
          
    const { data: reviewees, error: revieweeError } = await query;
          
    if (revieweeError) {
      console.error('Error fetching reviewee details:', revieweeError);
      return NextResponse.json(
        { error: 'Failed to fetch reviewee details' },
        { status: 500 }
      );
    }
    
    // Format the response to match the expected structure
    const formattedReviewees = reviewees.map(reviewee => {
      // Use type assertions to access nested properties
      const dept = (reviewee.departments as any)?.name ?? null;
      
      return {
        _id: reviewee.id,
        name: reviewee.name,
        role: reviewee.role,
        department: dept
      };
    });
    
    // Also return the current employee's basic info
    const dept = (currentEmployee.departments as any)?.name ?? null;
    const currentEmployeeData = {
      _id: currentEmployee.id,
      name: currentEmployee.name,
      role: currentEmployee.role,
      email: currentEmployee.email,
      department: dept
    };
    
    return NextResponse.json({
      currentEmployee: currentEmployeeData,
      assignedReviewees: formattedReviewees
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch assigned employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assigned employees' },
      { status: 500 }
    );
  }
} 