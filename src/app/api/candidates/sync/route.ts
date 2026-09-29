import { NextRequest, NextResponse } from 'next/server';
import { syncCandidates } from '@/lib/db';
import { Candidate } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const candidates = body.candidates;

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Expected an array of candidate records to sync.' },
        { status: 400 }
      );
    }

    const result = await syncCandidates(candidates as Candidate[]);

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${result.added + result.updated} candidate records.`,
      added: result.added,
      updated: result.updated,
      total: result.total,
      candidates: result.candidates,
    });
  } catch (error: any) {
    console.error('Error syncing candidates:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to sync candidates' },
      { status: 500 }
    );
  }
}
