import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const body = await request.json();

    const response = await fetch(`${config.api.baseUrl}/research/search?query=${query}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to perform search' }, { status: 500 });
  }
}