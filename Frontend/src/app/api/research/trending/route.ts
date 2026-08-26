import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '5';

    const response = await fetch(`${config.api.baseUrl}/research/trending?limit=${limit}`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch trending topics' }, { status: 500 });
  }
}