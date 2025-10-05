import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/fees/projects/${params.projectId}/zero`,
      {
        method: 'POST',
      }
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Failed to set project fees to zero' },
      { status: 500 }
    );
  }
}
