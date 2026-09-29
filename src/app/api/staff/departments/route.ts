import { NextResponse } from 'next/server';
import { getDepartmentsHealth } from '@/lib/db';

export async function GET() {
  try {
    const departments = await getDepartmentsHealth();
    return NextResponse.json({ success: true, departments });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to calculate department health' },
      { status: 500 }
    );
  }
}
