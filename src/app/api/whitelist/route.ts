import { NextResponse } from 'next/server';
import { getAcceptedWhitelist } from '@/lib/db';

export async function GET() {
  try {
    const whitelistData = await getAcceptedWhitelist();
    return NextResponse.json({ success: true, ...whitelistData });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate whitelist' },
      { status: 500 }
    );
  }
}
