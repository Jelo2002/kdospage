import { NextRequest, NextResponse } from 'next/server';
import { setStaffPin, findStaffByDiscord, updateStaff } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, discord_tag, pin } = body;

    if (!pin || typeof pin !== 'string' || pin.trim().length < 4) {
      return NextResponse.json(
        { success: false, error: 'PIN must be at least 4 characters/digits' },
        { status: 400 }
      );
    }

    const staffMember = await setStaffPin(id || discord_tag, pin.trim(), discord_tag);

    if (!staffMember) {
      return NextResponse.json(
        { success: false, error: 'Staff account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: staffMember.id,
        ign: staffMember.ign,
        discord_tag: staffMember.discord_tag,
        role: staffMember.role,
        department: staffMember.department,
      },
      message: 'Security PIN assigned successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to set PIN' },
      { status: 500 }
    );
  }
}
