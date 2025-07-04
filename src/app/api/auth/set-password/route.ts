import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase/admin';
import { SUPABASE_INVITE_EXPIRATION_TIME } from '@/lib/supabase/config';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email and password are required',
        error: 'VALIDATION_ERROR'
      }, { status: 400 });
    }
    
    // Get the user by email
    const { data, error: getUserError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (getUserError) {
      console.error('Error getting users:', getUserError);
      return NextResponse.json({
        success: false,
        message: 'Error retrieving users',
        error: 'SERVER_ERROR'
      }, { status: 500 });
    }
    
    // Find the user with the matching email
    const user = data.users.find(u => u.email === email);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found',
        error: 'NOT_FOUND'
      }, { status: 404 });
    }
    
    // Check if invitation has expired (24 hours)
    // This is a safeguard even though we check in the validate-invite endpoint
    const createdAt = new Date(user.created_at);
    const now = new Date();
    const differenceInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    if (differenceInHours > SUPABASE_INVITE_EXPIRATION_TIME && !user.email_confirmed_at) {
      return NextResponse.json({
        success: false,
        message: 'Invitation has expired. Please request a new invitation.',
        error: 'EXPIRED'
      }, { status: 410 });
    }
    
    // Update the user's password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password }
    );
    
    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json({
        success: false,
        message: 'Failed to update password',
        error: 'SERVER_ERROR'
      }, { status: 500 });
    }
    
    // If this is a new user (not confirmed), confirm their email now
    if (!user.email_confirmed_at) {
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id, 
        { email_confirm: true }
      );
      
      if (confirmError) {
        console.error('Error confirming email:', confirmError);
        // Continue anyway, as password is set
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
      data: { userId: user.id }
    });
    
  } catch (error: any) {
    console.error('Error setting password:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'An unexpected error occurred',
      error: 'SERVER_ERROR'
    }, { status: 500 });
  }
} 