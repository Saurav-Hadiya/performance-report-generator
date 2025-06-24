import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
    const { email, password } = await request.json();
    
    if (!email || !password) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Check if user's email is confirmed by checking if email_confirmed_at date exists
    if (!data.user.email_confirmed_at) {
        // If email not confirmed, send another verification email
        await supabase.auth.resend({
            type: 'signup',
            email,
            options: {
                emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/organization/signin`,
            }
        });
        
        return NextResponse.json({ 
            error: 'Email not verified. A new verification email has been sent.', 
            emailVerificationRequired: true,
            email: email
        }, { status: 401 });
    }
    
    // For organization users, check if they've completed their organization details
    if (data.user.user_metadata?.role === 'organization') {
        // Check if the organization details exist
        const { data: orgData, error: orgError } = await supabase
          .from('organization')
          .select('id')
          .eq('user_id', data.user.id)
          .single();
          
        // Return organization details status with the response
        return NextResponse.json({ 
            message: 'signin successfully', 
            user: data.user,
            detailsCompleted: !!orgData && !orgError
        }, { status: 200 });
    }

    return NextResponse.json({ message: 'signin successfully', user: data.user }, { status: 200 });
}
