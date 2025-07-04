import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase/admin';
import { SUPABASE_INVITE_EXPIRATION_TIME } from '@/lib/supabase/config';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'Email is required',
        error: 'VALIDATION_ERROR'
      }, { status: 400 });
    }

    // Get all users to find the one matching the email
    const { data, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({
        success: false,
        message: 'Failed to validate invitation',
        error: 'SERVER_ERROR'
      }, { status: 500 });
    }

    // Find user by email
    const user = data.users.find(u => u.email === email);
    
    // If no user exists with this email, the invite was never sent or was deleted
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Invitation not found',
        error: 'NOT_FOUND'
      }, { status: 404 });
    }

    // If user has already confirmed email, they should just log in
    // if (user.email_confirmed_at) {
    //   return NextResponse.json({
    //     success: false,
    //     message: 'Account already confirmed. Please log in instead.',
    //     error: 'ALREADY_CONFIRMED'
    //   }, { status: 400 });
    // }

    // Check if invitation has expired
    const createdAt = new Date(user.created_at);
    const now = new Date();
    const differenceInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    // If invite is older than configured time, consider it expired
    if (differenceInHours > SUPABASE_INVITE_EXPIRATION_TIME) {
      return NextResponse.json({
        success: false,
        message: 'Invitation has expired',
        error: 'EXPIRED'
      }, { status: 410 });
    }

    // The invitation is valid
    return NextResponse.json({
      success: true,
      message: 'Invitation is valid',
      data: {
        valid: true
      }
    });
    
  } catch (error: any) {
    console.error('Error validating invitation:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to validate invitation',
      error: 'SERVER_ERROR'
    }, { status: 500 });
  }
} 
