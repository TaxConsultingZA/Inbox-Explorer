import { NextRequest, NextResponse } from 'next/server';
import { MailService } from '@/lib/graph/mail-service';
import { requireAuthorizedUser, AuthError } from '@/lib/auth/session';
import { GraphError, GraphAuthError } from '@/lib/graph/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAuthorizedUser(request);

    const messageId = params.id;
    if (!messageId) {
      return NextResponse.json(
        { error: { code: 'InvalidId', message: 'Message ID is required.' } },
        { status: 400 }
      );
    }

    const message = await MailService.getMessageDetails(messageId);
    return NextResponse.json(message);
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: 'Unauthorized', message: error.message } },
        { status: error.status }
      );
    }

    if (error instanceof GraphAuthError) {
      return NextResponse.json(
        { error: { code: error.code || 'GraphAuthFailed', message: error.message } },
        { status: error.status }
      );
    }

    if (error instanceof GraphError) {
      return NextResponse.json(
        {
          error: {
            code: error.code || 'GraphError',
            message: error.message,
            requestId: error.requestId,
          },
        },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: { code: 'InternalServerError', message } },
      { status: 500 }
    );
  }
}
