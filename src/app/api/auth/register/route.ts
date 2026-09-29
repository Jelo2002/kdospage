import { NextRequest, NextResponse } from 'next/server';
import { createStaff, findStaffByDiscord } from '@/lib/db';
import { StaffRole } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { discord_tag, ign, role, department, pin } = body;

    if (!discord_tag || !discord_tag.trim()) {
      return NextResponse.json({ success: false, error: 'Discord handle is required' }, { status: 400 });
    }
    if (!ign || !ign.trim()) {
      return NextResponse.json({ success: false, error: 'Minecraft In-Game Name is required' }, { status: 400 });
    }
    if (!pin || pin.trim().length < 4) {
      return NextResponse.json({ success: false, error: 'PIN must be at least 4 digits/characters' }, { status: 400 });
    }

    // Check if Discord handle already exists
    const existing = await findStaffByDiscord(discord_tag);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this Discord handle already exists. Please log in instead.' },
        { status: 400 }
      );
    }

    // Security: Public self-registration is strictly restricted to Staff / Interviewer.
    // Leadership roles (Owner, Developer, Admin) can only be provisioned by existing leadership.
    const assignedRole: StaffRole = 'Interviewer';
    const assignedDept = 'Recruitment & Interviews';

    const newStaff = await createStaff({
      ign: ign.trim(),
      discord_tag: discord_tag.trim(),
      role: assignedRole,
      department: assignedDept,
      status: 'Active',
    });

    // Update with their PIN
    const { updateStaff } = await import('@/lib/db');
    const updated = await updateStaff(newStaff.id, { pin: pin.trim() });

    return NextResponse.json({
      success: true,
      user: {
        id: updated?.id || newStaff.id,
        ign: updated?.ign || newStaff.ign,
        discord_tag: updated?.discord_tag || newStaff.discord_tag,
        role: updated?.role || newStaff.role,
        department: updated?.department || newStaff.department,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Registration error' },
      { status: 500 }
    );
  }
}
