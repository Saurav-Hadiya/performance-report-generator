import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET a specific employee
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the employee with department details
    const { data: employee, error: empError } = await supabase
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
      .eq('id', id)
      .single();

    if (empError) {
      console.error('Error fetching employee:', empError);
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Get reviewees for this employee
    const { data: reviewRelationships, error: relError } = await supabase
      .from('employee_review_to')
      .select(`
        reviewee_id
      `)
      .eq('reviewer_id', id);

    if (relError) {
      console.error('Error fetching review relationships:', relError);
      // Continue without reviewees
    }

    // Get the details of all reviewees
    const revieweeIds = reviewRelationships?.map(rel => rel.reviewee_id) || [];
    let assignedReviewees: any[] = [];

    if (revieweeIds.length > 0) {
      const { data: reviewees, error: revieweesError } = await supabase
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

      if (!revieweesError && reviewees) {
        assignedReviewees = reviewees.map(reviewee => ({
          _id: reviewee.id,
          name: reviewee.name,
          role: reviewee.role,
          department: (reviewee.departments as any)?.name ?? null
        }));
      }
    }

    // Format the response
    const formattedEmployee = {
      _id: employee.id,
      name: employee.name,
      role: employee.role,
      email: employee.email,
      department: (employee.departments as any)?.name ?? null,
      assignedReviewees
    };

    return NextResponse.json(formattedEmployee, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch employee:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee' },
      { status: 500 }
    );
  }
}

// DELETE an employee
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if employee exists
    const { error: checkError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError) {
      console.error('Error checking employee:', checkError);
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Delete all review relationships for this employee
    const { error: reviewError } = await supabase
      .from('employee_review_to')
      .delete()
      .or(`reviewer_id.eq.${id},reviewee_id.eq.${id}`);

    if (reviewError) {
      console.error('Error deleting review relationships:', reviewError);
      // Continue anyway, as the employee deletion might still succeed
    }

    // Delete the employee
    const { error: deleteError } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting employee:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete employee' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Employee deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to delete employee:', error);
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    );
  }
}

// UPDATE an employee
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    // check if the user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'User is not authenticated' }, { status: 401 });
    }

    if (user.user_metadata.role !== 'organization') {
      return NextResponse.json({ error: 'User is not an organization' }, { status: 401 });
    }

    // check if organization exists
    const { data: organization, error: organizationError } = await supabase
      .from('organization')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (organizationError) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, role, email, department, assignedReviewees } = body;

    // First, get the current employee data to check if email is changing
    const { data: currentEmployee, error: fetchError } = await supabase
      .from('employees')
      .select('email')
      .eq('id', id)
      .eq('organization_id', organization.id)
      .single();

    if (fetchError) {
      console.error('Error fetching current employee:', fetchError);
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed
    const isEmailChanging = currentEmployee.email !== email;

    // If email is changing, check that it's not already in use
    if (isEmailChanging) {
      const { data: existingUser, error: checkError } = await supabase
        .from('employees')
        .select('id')
        .eq('email', email)
        .neq('id', id) // Exclude the current employee
        .maybeSingle(); // Use maybeSingle to not throw error if no results

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email address already in use by another employee' },
          { status: 400 }
        );
      }

      if (checkError) {
        console.error('Error checking existing user:', checkError);
        return NextResponse.json(
          { error: 'Error checking existing user' },
          { status: 400 }
        );
      }
    }

    // First, get the department ID from the department name
    let departmentId = null;
    if (department) {
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('id')
        .eq('name', department)
        .eq('organization_id', organization.id)
        .single();

      if (deptError) {
        console.error('Error finding department:', deptError);
        return NextResponse.json(
          { error: 'Department not found' },
          { status: 400 }
        );
      }

      departmentId = deptData.id;
    }

    // Update the employee
    const { data: updatedEmployee, error: updateError } = await supabase
      .from('employees')
      .update({
        name,
        role,
        email,
        department_id: departmentId,
      })
      .eq('id', id)
      .eq('organization_id', organization.id)
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
      .single();

    if (updateError) {
      console.error('Error updating employee:', updateError);
      return NextResponse.json(
        { error: 'Failed to update employee' },
        { status: 500 }
      );
    }

    // If email was changed, update the auth user record
    if (isEmailChanging) {
      try {
        // Import admin client for auth operations
        const supabaseAdmin = (await import('@/lib/supabase/admin')).default;

        // First, find the auth user with the old email
        const { data, error: authError } = await supabaseAdmin.auth.admin.listUsers();

        if (authError) {
          console.error('Error finding auth user:', authError);
          return NextResponse.json(
            { error: 'Error finding auth user' },
            { status: 400 }
          );
        } else if (data && data.users) {
          // Find the user with the matching email
          const authUser = data.users.find(user => user.email === currentEmployee.email);

          if (authUser) {
            // Update the auth user's email
            const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
              authUser.id,
              { email: email }
            );

            if (updateAuthError) {
              console.error('Error updating auth user email:', updateAuthError);
              return NextResponse.json(
                { error: 'Error updating auth user email' },
                { status: 400 }
              );
            }
          } else {
            return NextResponse.json(
              { error: 'No auth user found with email' },
              { status: 400 }
            );
          }
        }
      } catch (authUpdateError) {
        console.error('Error updating auth user:', authUpdateError);
        return NextResponse.json(
          { error: 'Error updating auth user' },
          { status: 400 }
        );
      }
    }

    // // Handle assigned reviewees if provided
    if (assignedReviewees && Array.isArray(assignedReviewees)) {
      // Delete existing relationships
      const { error: deleteRelError } = await supabase
        .from('employee_review_to')
        .delete()
        .eq('reviewer_id', id)

      if (deleteRelError) {
        console.error('Error deleting existing review relationships:', deleteRelError);
        // Continue anyway as we can still try to add the new relationships
      }

      // Add new relationships
      if (assignedReviewees.length > 0) {
        const reviewRelationships = assignedReviewees.map(revieweeId => ({
          reviewer_id: id,
          reviewee_id: revieweeId
        }));

        const { error: insertRelError } = await supabase
          .from('employee_review_to')
          .insert(reviewRelationships);

        if (insertRelError) {
          console.error('Error creating review relationships:', insertRelError);
          return NextResponse.json(
            { error: 'Failed to create review relationships' },
            { status: 500 }
          );
        }
      }
    }

    // Get updated reviewees for this employee
    const { data: reviewRelationships, error: relError } = await supabase
      .from('employee_review_to')
      .select(`
        reviewee_id
      `)
      .eq('reviewer_id', id);

    if (relError) {
      console.error('Error fetching updated review relationships:', relError);
      // Continue without reviewees
    }

    // Get the details of all reviewees
    const revieweeIds = reviewRelationships?.map(rel => rel.reviewee_id) || [];
    let updatedAssignedReviewees: any[] = [];

    if (revieweeIds.length > 0) {
      const { data: reviewees, error: revieweesError } = await supabase
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
        .eq('organization_id', organization.id)
        .in('id', revieweeIds);

      if (!revieweesError && reviewees) {
        updatedAssignedReviewees = reviewees.map(reviewee => ({
          _id: reviewee.id,
          name: reviewee.name,
          role: reviewee.role,
          department: (reviewee.departments as any)?.name ?? null
        }));
      }
    }

    // Format the response
    const formattedEmployee = {
      _id: updatedEmployee.id,
      name: updatedEmployee.name,
      role: updatedEmployee.role,
      email: updatedEmployee.email,
      department: (updatedEmployee.departments as any)?.name ?? null,
      assignedReviewees: updatedAssignedReviewees,
      emailChanged: isEmailChanging // Add flag to indicate email was changed
    };

    return NextResponse.json(formattedEmployee, { status: 200 });
  } catch (error) {
    console.error('Failed to update employee:', error);
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    );
  }
} 