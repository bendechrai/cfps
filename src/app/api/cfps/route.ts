import { NextResponse } from 'next/server';
import { CFPService } from '@/services/cfp/cfp.service';

export async function GET() {
  try {
    const cfpService = CFPService.getInstance();
    const cfps = await cfpService.fetchCFPs();
    return NextResponse.json(cfps);
  } catch (error) {
    console.error('Error fetching CFPs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CFPs' },
      { status: 500 }
    );
  }
}
