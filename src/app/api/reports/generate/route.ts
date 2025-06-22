import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePerformanceReport } from '@/services/gemini.services';
import { isCurrentMonth, isCompletedMonth } from '@/lib/utils';

// Helper to validate month format
function isValidMonth(month: string): boolean {
  const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
  return monthRegex.test(month);
}

// POST to generate a report
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, month } = body;

    // Validate required fields
    if (!employeeId || !month) {
      return NextResponse.json(
        { error: 'Employee ID and month are required fields' },
        { status: 400 }
      );
    }

    // Validate month format
    if (!isValidMonth(month)) {
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

    // Check if a report already exists for this employee and month
    const { data: existingReport, error: existingReportError } = await supabase
      .from('reports')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('month', month)
      .single();

    if (existingReportError && existingReportError.code !== 'PGRST116') {
      // PGRST116 is the "no rows returned" error, which is expected when no report exists
      console.error('Error checking existing report:', existingReportError);
      return NextResponse.json(
        { error: 'Failed to check existing reports' },
        { status: 500 }
      );
    }

    // If report exists, check if regeneration is allowed
    if (existingReport) {
      const isCurrent = isCurrentMonth(month);
      const isCompleted = isCompletedMonth(month);
      
      if (isCompleted) {
        // Return existing report for completed months (no regeneration allowed)
        return NextResponse.json({
          _id: existingReport.id,
          employeeId: existingReport.employee_id,
          month: existingReport.month,
          ranking: existingReport.ranking,
          improvements: existingReport.improvements,
          qualities: existingReport.qualities,
          summary: existingReport.summary,
          createdAt: existingReport.created_at,
          updatedAt: existingReport.created_at,
          isRegenerated: false,
          message: 'Report for completed month cannot be regenerated'
        }, { status: 200 });
      }
    }

    // Get employee details
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, name, role, organization_id')
      .eq('id', employeeId)
      .single();

    if (empError || !employee) {
      console.error('Error fetching employee:', empError);
      return NextResponse.json(
        { error: 'Employee not found' },
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

    // Get the start and end dates for the month
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59);

    // Get reviews for this employee for the specified month
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('content')
      .eq('target_employee_id', employeeId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    if (!reviews || reviews.length === 0) {
      return NextResponse.json(
        { error: `No reviews found for ${employee.name} in ${month}` },
        { status: 404 }
      );
    }

    // Extract review contents
    const reviewContents = reviews.map(review => review.content);

    // Generate a report using the generatePerformanceReport function
    const performanceReport = await generatePerformanceReport(
      reviewContents,
      employee.name,
      employee.role
    );

    let newReport;
    let isRegenerated = false;

    if (existingReport && isCurrentMonth(month)) {
      // Update existing report for current month
      const { data: updatedReport, error: updateError } = await supabase
        .from('reports')
        .update({
          ranking: performanceReport.ranking,
          improvements: performanceReport.improvements,
          qualities: performanceReport.qualities,
          criterias: performanceReport.criterias,
          summary: performanceReport.summary
        })
        .eq('id', existingReport.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating report:', updateError);
        return NextResponse.json(
          { error: 'Failed to update report' },
          { status: 500 }
        );
      }

      newReport = updatedReport;
      isRegenerated = true;
    } else {
      // Insert new report
      const { data: insertedReport, error: insertError } = await supabase
        .from('reports')
        .insert({
          employee_id: employeeId,
          month: month,
          ranking: performanceReport.ranking,
          improvements: performanceReport.improvements,
          qualities: performanceReport.qualities,
          criterias: performanceReport.criterias,
          summary: performanceReport.summary
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error saving report:', insertError);
        return NextResponse.json(
          { error: 'Failed to save report' },
          { status: 500 }
        );
      }

      newReport = insertedReport;
    }

    return NextResponse.json({
      _id: newReport.id,
      employeeId: newReport.employee_id,
      month: newReport.month,
      ranking: newReport.ranking,
      improvements: newReport.improvements,
      qualities: newReport.qualities,
      summary: newReport.summary,
      criterias: performanceReport.criterias,
      createdAt: newReport.created_at,
      updatedAt: newReport.created_at,
      isRegenerated,
      message: isRegenerated ? 'Report regenerated successfully' : 'Report generated successfully'
    }, { status: isRegenerated ? 200 : 201 });
  } catch (error) {
    console.error('Failed to generate report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate report';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 