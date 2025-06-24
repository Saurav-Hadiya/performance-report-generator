import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.user_metadata?.role !== 'organization') {
      return NextResponse.json({ error: 'Only organization accounts can access this endpoint' }, { status: 403 });
    }

    // Check if the organization details exist
    const { data: orgData, error } = await supabase
      .from('organization')
      .select('id, name')
      .eq('user_id', user.id)
      .single();

    // Return organization details status
    return NextResponse.json({
      detailsCompleted: !!orgData && !error,
      orgName: orgData?.name || null
    }, { status: 200 });
    
  } catch (error) {
    console.error('Failed to check organization details:', error);
    return NextResponse.json(
      { error: 'Failed to check organization details' },
      { status: 500 }
    );
  }
} 