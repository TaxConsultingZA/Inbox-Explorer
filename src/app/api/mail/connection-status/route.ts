import { NextRequest, NextResponse } from 'next/server';
import { MailService } from '@/lib/graph/mail-service';
import { getSession } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    const status = await MailService.checkConnectionStatus();

    return NextResponse.json({
      ...status,
      userSession: session
        ? {
            email: session.email,
            isAuthorized: session.isAuthorized,
          }
        : null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to check connection status';
    return NextResponse.json(
      {
        status: 'error',
        errorMessage: message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
