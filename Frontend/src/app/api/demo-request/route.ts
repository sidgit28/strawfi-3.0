import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { fullName, email, company, message } = await request.json();

    const { data, error } = await supabase
      .from('demo_requests')
      .insert([
        { full_name: fullName, email, company, message },
      ]);

    if (error) {
      console.error('Error inserting demo request:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Demo request submitted successfully!', data }, { status: 200 });
  } catch (error: any) {
    console.error('Error handling demo request:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data: requests, error } = await supabase
      .from('demo_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching demo requests from Supabase:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch demo requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error('Error handling GET request for demo requests:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 