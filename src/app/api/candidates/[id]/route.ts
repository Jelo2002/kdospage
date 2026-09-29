import { NextRequest, NextResponse } from 'next/server';
import { updateCandidate, deleteCandidate } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const updated = await updateCandidate(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, candidate: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update candidate' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const deleted = await deleteCandidate(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Candidate not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Candidate deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete candidate' },
      { status: 500 }
    );
  }
}
