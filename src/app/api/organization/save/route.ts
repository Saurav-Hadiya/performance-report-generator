import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
    const { name, address, phone } = await request.json();

    if (!name) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get the current user to ensure they're authenticated
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // First check if organization already exists for this user
    const { data: existingOrg } = await supabase
        .from('organization')
        .select('id')
        .eq('user_id', userData.user.id)
        .maybeSingle();
    
    let result;
    
    if (existingOrg) {
        // Update existing organization
        const { data, error } = await supabase
            .from('organization')
            .update({
                name,
                address,
                phone
            })
            .eq('id', existingOrg.id)
            .select()
            .single();
            
        if (error) {
            console.error('Error updating organization details:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        
        result = data;
    } else {
        // Insert new organization details
        const { data, error } = await supabase
            .from('organization')
            .insert({
                name,
                email: userData.user.email,
                address,
                phone,
                user_id: userData.user.id
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving organization details:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        
        result = data;
    }

    return NextResponse.json({ 
        message: 'Organization details saved successfully', 
        organization: result 
    }, { status: 200 });
} 