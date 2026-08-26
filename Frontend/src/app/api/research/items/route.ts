import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function GET() {
  try {
    const response = await fetch(`${config.api.baseUrl}/research/items`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch research items' }, { status: 500 });
  }
}