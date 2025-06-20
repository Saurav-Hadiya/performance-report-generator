import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
    const { email, password, role } = await request.json();
    
    if(!email || !password) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { 
                role: role ?? 'organization',
            },
            emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/organization/verify`,
        },
    });
    
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Check if user needs to confirm email
    if (data.user && data.user.identities && data.user.identities.length === 0) {
        return NextResponse.json({ 
            message: 'This email is already registered. Please check your inbox for the confirmation link.', 
            user: null 
        }, { status: 200 });
    }

    return NextResponse.json({ 
        message: 'We\'ve sent a confirmation link to your email address. Please check your inbox to verify your account.', 
        user: data.user,
        emailVerification: true 
    }, { status: 200 });
}
