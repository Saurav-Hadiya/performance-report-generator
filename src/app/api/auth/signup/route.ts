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
                emailVerified: false,
            },
            emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/organization/details`,
        },
    });
    
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    
    return NextResponse.json({
        message: 'Please check your email to confirm your account',
        needsEmailConfirmation: true,
        email: email,
        user: data.user // Include user data for consistency
    }, { status: 200 });
}
