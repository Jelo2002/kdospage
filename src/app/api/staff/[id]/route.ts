import { NextRequest, NextResponse } from 'next/server';
import { updateStaff, deleteStaff } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const updated = await updateStaff(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Staff member not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, staff: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update staff member' },
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
    const deleted = await deleteStaff(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Staff member not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Staff member removed successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete staff member' },
      { status: 500 }
    );
  }
}
