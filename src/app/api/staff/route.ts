import { NextRequest, NextResponse } from 'next/server';
import { getStaff, createStaff } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const staff = await getStaff({ department, status, search });
    return NextResponse.json({ success: true, staff });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch staff members' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ign, discord_tag, role, department, status, loa_reason, loa_return_date } = body;

    if (!ign || !ign.trim()) {
      return NextResponse.json({ success: false, error: 'Staff IGN is required' }, { status: 400 });
    }
    if (!role) {
      return NextResponse.json({ success: false, error: 'Staff role is required' }, { status: 400 });
    }
    if (!department) {
      return NextResponse.json({ success: false, error: 'Staff department is required' }, { status: 400 });
    }

    const newStaff = await createStaff({
      ign: ign.trim(),
      discord_tag: discord_tag?.trim() || '',
      role,
      department: department.trim(),
      status: status || 'Active',
      loa_reason,
      loa_return_date,
    });

    return NextResponse.json({ success: true, staff: newStaff }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create staff member' },
      { status: 500 }
    );
  }
}
