import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET reviews written by the current user
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

    // Get the employee profile for the current user
    const { data: currentEmployee, error: empError } = await supabase
      .from('employees')
      .select('id, name, role')
      .eq('email', user.email)
      .single();

    if (empError || !currentEmployee) {
      console.error('Error fetching employee profile:', empError);
      return NextResponse.json(
        { error: 'Employee profile not found' },
        { status: 404 }
      );
    }

    // Build the query for reviews by the current user
    let query = supabase
      .from('reviews')
      .select(`
        id,
        content,
        created_at,
        target_employee:target_employee_id (
          id,
          name,
          role,
          department:department_id (
            id,
            name
          )
        )
      `)
      .eq('reviewed_by_id', currentEmployee.id);

    // Apply search filter if provided
    if (searchQuery) {
      // Filter by content first
      query = query.ilike('content', `%${searchQuery}%`);
    }

    // Order by creation date (newest first)
    query = query.order('created_at', { ascending: false });

    const { data: contentMatches, error: contentError } = await query;

    if (contentError) {
      console.error('Error fetching reviews by content:', contentError);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    // If we need to search by employee name, perform a second query
    let nameMatches: any[] = [];
    if (searchQuery) {
      // Get reviews by this reviewer
      const { data: employeeIds, error: empIdError } = await supabase
        .from('employees')
        .select('id')
        .ilike('name', `%${searchQuery}%`);

      if (!empIdError && employeeIds.length > 0) {
        // Get reviews for these employees
        const targetIds = employeeIds.map(e => e.id);
        const { data: employeeMatches, error: empMatchError } = await supabase
          .from('reviews')
          .select(`
            id,
            content,
            created_at,
            target_employee:target_employee_id (
              id,
              name,
              role,
              department:department_id (
                id,
                name
              )
            )
          `)
          .eq('reviewed_by_id', currentEmployee.id)
          .in('target_employee_id', targetIds)
          .order('created_at', { ascending: false });

        if (!empMatchError && employeeMatches) {
          nameMatches = employeeMatches;
        }
      }
    }

    // Combine and deduplicate results
    const combinedReviews = searchQuery
      ? [...contentMatches, ...nameMatches].filter((review, index, self) =>
        index === self.findIndex(r => r.id === review.id))
      : contentMatches;

    // Format the response
    const formattedReviews = combinedReviews.map(review => {
      const targetEmployee = review.target_employee as any;
      return {
        id: review.id,
        content: review.content,
        timestamp: review.created_at,
        targetEmployee: {
          id: targetEmployee.id,
          name: targetEmployee.name,
          role: targetEmployee.role,
          department: targetEmployee.department?.name || null
        }
      };
    });

    return NextResponse.json({
      reviewer: {
        id: currentEmployee.id,
        name: currentEmployee.name,
        role: currentEmployee.role
      },
      reviews: formattedReviews
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch my reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch my reviews' },
      { status: 500 }
    );
  }
} 