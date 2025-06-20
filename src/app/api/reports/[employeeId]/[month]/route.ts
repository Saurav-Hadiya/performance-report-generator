import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET specific report for employee and month
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ employeeId: string; month: string }> }
) {
  try {
    const { employeeId, month } = await params;
    
    if (!employeeId || !month) {
      return NextResponse.json(
        { error: 'Employee ID and month are required' },
        { status: 400 }
      );
    }

    // Validate month format
    const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!monthRegex.test(month)) {
      return NextResponse.json(
        { error: 'Invalid month format. Use YYYY-MM' },
        { status: 400 }
      );
    }
    
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
    
    // Verify that the employee exists and belongs to the same organization
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, organization_id')
      .eq('id', employeeId)
      .single();
    
    if (empError || !employee) {
      console.error('Error fetching employee:', empError);
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    // Get current user's organization
    const { data: orgData, error: orgError } = await supabase
      .from('organization')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (orgError || !orgData) {
      console.error('Error fetching organization:', orgError);
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }
    
    // Verify employee belongs to the same organization
    if (employee.organization_id !== orgData.id) {
      return NextResponse.json(
        { error: 'Employee not found in your organization' },
        { status: 403 }
      );
    }
    
    // Fetch the specific report for the employee and month
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('month', month)
      .single();
    
    if (reportError) {
      if (reportError.code === 'PGRST116') {
        // No report found - return null instead of error
        return NextResponse.json(null, { status: 200 });
      }
      
      console.error('Error fetching report:', reportError);
      return NextResponse.json(
        { error: 'Failed to fetch report' },
        { status: 500 }
      );
    }
    
    // Format the response to match the expected structure
    const formattedReport = {
      _id: report.id,
      employeeId: report.employee_id,
      month: report.month,
      ranking: report.ranking,
      improvements: report.improvements,
      qualities: report.qualities,
      summary: report.summary,
      criterias: report.criterias,
      createdAt: report.created_at,
      updatedAt: report.created_at
    };
    
    return NextResponse.json(formattedReport, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
} 