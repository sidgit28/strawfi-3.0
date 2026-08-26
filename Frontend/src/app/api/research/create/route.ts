import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create research item in Supabase
    const { data, error } = await supabase
      .from('research_memory')
      .insert([
        {
          title: body.title,
          type: body.type,
          tags: body.tags,
          content: body.content,
          username: body.username,
          created_at: body.created_at,
          relevance_score: body.relevance_score,
          author_id: session.user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating research:', error);
      return NextResponse.json({ error: 'Failed to create research' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in research creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 