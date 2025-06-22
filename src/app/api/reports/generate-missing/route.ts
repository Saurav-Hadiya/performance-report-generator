import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePerformanceReport } from '@/services/gemini.services';
import { isCurrentMonth, isCompletedMonth } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, months } = body;

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }
    
    if (!months || !Array.isArray(months) || months.length === 0) {
      return NextResponse.json(
        { error: 'Months array is required' },
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

    // Get employee details
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, name, role, department_id, organization_id')
      .eq('id', employeeId)
      .eq('organization_id', orgData.id)
      .single();
    
    if (empError || !employee) {
      console.error('Error fetching employee:', empError);
      return NextResponse.json(
        { error: 'Employee not found or does not belong to your organization' },
        { status: 404 }
      );
    }

    // Track generated and failed reports
    const generatedReports = [];
    const failedMonths = [];
    
    // Process each month for this employee
    for (const month of months) {
      try {
        // Check if report already exists
        const { data: existingReport } = await supabase
          .from('reports')
          .select('id')
          .eq('employee_id', employeeId)
          .eq('month', month)
          .single();
          
        if (existingReport) {
          const isCurrent = isCurrentMonth(month);
          const isCompleted = isCompletedMonth(month);
          
          if (isCompleted) {
            // For completed months, just get the existing report without regenerating
            const { data: fullReport } = await supabase
              .from('reports')
              .select('*')
              .eq('id', existingReport.id)
              .single();
              
            if (fullReport) {
              generatedReports.push({
                _id: fullReport.id,
                employeeId: fullReport.employee_id,
                month: fullReport.month,
                ranking: fullReport.ranking,
                improvements: fullReport.improvements,
                qualities: fullReport.qualities,
                summary: fullReport.summary,
                createdAt: fullReport.created_at,
                updatedAt: fullReport.created_at,
                isRegenerated: false,
                message: 'Report for completed month cannot be regenerated'
              });
            }
            continue;
          }
        }
        
        // Get the start and end dates for the month
        const [year, monthNum] = month.split('-').map(Number);
        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0, 23, 59, 59);
        
        // Get reviews for this employee for the specified month
        const { data: reviews } = await supabase
          .from('reviews')
          .select('content')
          .eq('target_employee_id', employeeId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
        
        // If no reviews, generate a default report with zero rating
        let performanceReport;
        
        if (!reviews || reviews.length === 0) {
          // Create a default report with zero rating
          performanceReport = {
            ranking: 0, // Zero rating when no reviews
            improvements: [], // No improvements to note
            qualities: [], // No qualities to note
            summary: `No reviews were found for ${employee.name} in ${month}. No performance data available.`,
            criterias: []
          };
        } else {
          // Extract review contents
          const reviewContents = reviews.map(review => review.content);
          
          // Generate a report using Gemini AI
          performanceReport = await generatePerformanceReport(
            reviewContents,
            employee.name,
            employee.role
          );
        }
        
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
            console.error(`Error updating report for ${month}:`, updateError);
            failedMonths.push({
              month,
              error: updateError.message
            });
            continue;
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
            console.error(`Error saving report for ${month}:`, insertError);
            failedMonths.push({
              month,
              error: insertError.message
            });
            continue;
          }
          
          newReport = insertedReport;
        }
        
        generatedReports.push({
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
        });
      } catch (error) {
        console.error(`Error generating report for ${month}:`, error);
        failedMonths.push({
          month,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const success = failedMonths.length === 0;
    
    return NextResponse.json({
      success,
      generatedReports,
      failedMonths
    }, { status: 200 });
    
  } catch (error) {
    console.error('Failed to generate missing reports:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 