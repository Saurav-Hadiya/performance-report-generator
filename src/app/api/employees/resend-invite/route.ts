import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import supabaseAdmin from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { employeeId } = await req.json();
    
    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Get current user's info
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting current user:', userError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get organization for current user
    const { data: orgData, error: orgError } = await supabase
      .from('organization')
      .select('id, name')
      .eq('user_id', user.id)
      .single();
    
    if (orgError || !orgData) {
      console.error('Error getting organization:', orgError);
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }
    
    // Get employee details
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, name, email, role, department_id')
      .eq('id', employeeId)
      .eq('organization_id', orgData.id)
      .single();
    
    if (empError || !employee) {
      console.error('Error getting employee:', empError);
      return NextResponse.json(
        { error: 'Employee not found or does not belong to your organization' },
        { status: 404 }
      );
    }
    
    // Check if employee has an email
    if (!employee.email) {
      return NextResponse.json(
        { error: 'Employee does not have an email address' },
        { status: 400 }
      );
    }
    
    // Check if user already exists in Supabase auth
    const { data: existingUsers, error: userCheckError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userCheckError) {
      console.error('Error checking existing users:', userCheckError);
      return NextResponse.json(
        { error: 'Failed to check existing users' },
        { status: 500 }
      );
    }
    
    // Find if user with this email already exists
    const existingUser = existingUsers.users.find(user => user.email === employee.email);
    
    // invitation URL with custom sign-up path
    let signUpURL = `${process.env.NEXT_PUBLIC_APP_URL}/signup?organization_id=${orgData.id}&email=${encodeURIComponent(employee.email)}&name=${encodeURIComponent(employee.name)}&role=${encodeURIComponent(employee.role)}`;
    
    if (employee.department_id) {
      signUpURL += `&department_id=${employee.department_id}`;
    }
    
    if (existingUser) {
      // User already exists in auth
      if (existingUser.email_confirmed_at) {
        // User has already confirmed their email and has an account
        return NextResponse.json({
          message: `${employee.email} has already confirmed their account. No invitation needed.`
        }, { status: 200 });
      } else {
        // User exists but hasn't confirmed email yet - we can resend the invitation
        // We'll use a different approach to resend the invitation
        try {
          // Try to resend the invitation by creating a new one
          // This will override the previous invitation
          const { error: emailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(employee.email, {
            data: {
              organization_id: orgData.id,
              name: employee.name,
              role: 'employee',
              invited_by: user.id
            },
            redirectTo: signUpURL
          });
          
          if (emailError) {
            // If there's still an error, delete the existing user and recreate
            
            // Delete the existing unconfirmed user
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
            
            if (deleteError) {
              console.error('Error deleting existing user:', deleteError);
              return NextResponse.json({
                error: 'Failed to resend invitation. Please try again later.'
              }, { status: 500 });
            }
            
            // Now send a new invitation
            const { error: newInviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(employee.email, {
              data: {
                organization_id: orgData.id,
                name: employee.name,
                role: 'employee',
                invited_by: user.id
              },
              redirectTo: signUpURL
            });
            
            if (newInviteError) {
              console.error('Error sending new invitation after deletion:', newInviteError);
              return NextResponse.json(
                { error: newInviteError.message },
                { status: 500 }
              );
            }
          }
          
          return NextResponse.json({
            message: `Invitation resent to ${employee.email}`
          }, { status: 200 });
          
        } catch (error) {
          console.error('Error in resend invitation process:', error);
          return NextResponse.json({
            error: 'Failed to resend invitation. Please try again later.'
          }, { status: 500 });
        }
      }
    }
    
    // User doesn't exist, send new invitation
    const { error: emailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(employee.email, {
      data: {
        organization_id: orgData.id,
        name: employee.name,
        role: 'employee',
        invited_by: user.id
      },
      redirectTo: signUpURL
    });
    
    if (emailError) {
      console.error('Error sending invitation email:', emailError);
      return NextResponse.json(
        { error: emailError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: `Invitation resent to ${employee.email}`
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error resending employee invitation:', error);
    return NextResponse.json(
      { error: 'Failed to resend employee invitation' },
      { status: 500 }
    );
  }
} 