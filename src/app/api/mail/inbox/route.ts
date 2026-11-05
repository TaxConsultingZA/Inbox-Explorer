import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MailService } from '@/lib/graph/mail-service';
import { requireAuthorizedUser, AuthError } from '@/lib/auth/session';
import { GraphError, GraphAuthError } from '@/lib/graph/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const querySchema = z.object({
  search: z.string().optional(),
  isRead: z.enum(['true', 'false']).optional().transform((v) => (v === undefined ? undefined : v === 'true')),
  hasAttachments: z.enum(['true', 'false']).optional().transform((v) => (v === undefined ? undefined : v === 'true')),
  from: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  top: z.string().optional().transform((v) => (v ? parseInt(v, 10) : undefined)),
  skip: z.string().optional().transform((v) => (v ? parseInt(v, 10) : undefined)),
  nextLink: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Enforce web application user authorization
    await requireAuthorizedUser(request);

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      search: searchParams.get('search') || undefined,
      isRead: searchParams.get('isRead') || undefined,
      hasAttachments: searchParams.get('hasAttachments') || undefined,
      from: searchParams.get('from') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      top: searchParams.get('top') || undefined,
      skip: searchParams.get('skip') || undefined,
      nextLink: searchParams.get('nextLink') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'InvalidQueryParameters',
            message: 'Invalid request query parameters.',
            details: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const inboxData = await MailService.getInboxMessages(parsed.data);
    return NextResponse.json(inboxData);
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
            retryAfter: error.retryAfter,
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
