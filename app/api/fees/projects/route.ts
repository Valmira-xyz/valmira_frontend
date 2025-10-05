import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/fees/projects`
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch project fees' },
      { status: 500 }
    );
  }
}
