import { NextRequest, NextResponse } from 'next/server';
import { getCandidates, createCandidate } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const minRating = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined;
    const search = searchParams.get('search') || undefined;
    const interviewer = searchParams.get('interviewer') || undefined;
    const sort = (searchParams.get('sort') as any) || 'newest';

    const candidates = await getCandidates({
      status,
      minRating,
      search,
      interviewer,
      sort,
    });

    return NextResponse.json({ success: true, candidates });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch candidates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ign, rating, notes, interviewer_ign, tags } = body;

    if (!ign || typeof ign !== 'string' || !ign.trim()) {
      return NextResponse.json({ success: false, error: 'Minecraft In-Game Name (IGN) is required' }, { status: 400 });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ success: false, error: 'Star rating must be between 1 and 5' }, { status: 400 });
    }

    console.log('[KDOS_API_POST_CANDIDATE]', JSON.stringify({
      ign: ign.trim(),
      rating: numericRating,
      notes: notes || '',
      interviewer_ign: interviewer_ign?.trim() || 'Staff',
      tags: Array.isArray(tags) ? tags : [],
      timestamp: new Date().toISOString(),
    }));

    const candidate = await createCandidate({
      ign: ign.trim(),
      rating: numericRating,
      notes: notes || '',
      interviewer_ign: interviewer_ign?.trim() || 'Staff',
      tags: Array.isArray(tags) ? tags : [],
    });

    return NextResponse.json({ success: true, candidate }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create candidate' },
      { status: 500 }
    );
  }
}
