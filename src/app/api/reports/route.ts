import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET reports for an employee
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');
    
    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
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
    
    // Fetch all reports for the employee
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .eq('employee_id', employeeId)
      .order('month', { ascending: false });
    
    if (reportsError) {
      console.error('Error fetching reports:', reportsError);
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      );
    }
    
    // Format the response to match the expected structure
    const formattedReports = reports.map(report => ({
      _id: report.id,
      employeeId: report.employee_id,
      month: report.month,
      ranking: report.ranking,
      improvements: report.improvements,
      qualities: report.qualities,
      summary: report.summary,
      createdAt: report.created_at,
      updatedAt: report.created_at // Supabase doesn't have separate updatedAt
    }));
    
    return NextResponse.json(formattedReports, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
} 