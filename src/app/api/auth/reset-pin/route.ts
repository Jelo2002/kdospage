import { NextRequest, NextResponse } from 'next/server';
import { resetStaffPin, updateStaff } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { staffId, newPin } = body;

    if (!staffId) {
      return NextResponse.json(
        { success: false, error: 'Staff ID is required' },
        { status: 400 }
      );
    }

    let updated = null;
    if (newPin && typeof newPin === 'string' && newPin.trim().length >= 4) {
      // Set new PIN directly
      updated = await updateStaff(staffId, { pin: newPin.trim() });
    } else {
      // Reset PIN to null so staff sets a new PIN on next login
      updated = await resetStaffPin(staffId);
    }

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Staff member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: newPin
        ? `PIN for ${updated.ign} has been updated.`
        : `PIN for ${updated.ign} has been reset. They will be prompted to set a new PIN upon login.`,
      staff: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reset PIN' },
      { status: 500 }
    );
  }
}
