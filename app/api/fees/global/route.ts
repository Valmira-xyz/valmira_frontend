import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/fees/global`
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch global fees' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/fees/global`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update global fees' },
      { status: 500 }
    );
  }
}
