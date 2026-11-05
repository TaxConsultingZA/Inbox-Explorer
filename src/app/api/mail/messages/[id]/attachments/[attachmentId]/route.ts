import { NextRequest, NextResponse } from 'next/server';
import { MailService } from '@/lib/graph/mail-service';
import { requireAuthorizedUser, AuthError } from '@/lib/auth/session';
import { GraphError } from '@/lib/graph/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    id: string;
    attachmentId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAuthorizedUser(request);

    const { id: messageId, attachmentId } = params;
    if (!messageId || !attachmentId) {
      return NextResponse.json(
        { error: { code: 'InvalidId', message: 'Message ID and Attachment ID are required.' } },
        { status: 400 }
      );
    }

    const attachment = await MailService.getAttachmentContent(messageId, attachmentId);

    if (!attachment || !attachment.contentBytes) {
      return NextResponse.json(
        { error: { code: 'NoContent', message: 'Attachment binary content is unavailable.' } },
        { status: 404 }
      );
    }

    const buffer = Buffer.from(attachment.contentBytes, 'base64');
    const safeFilename = encodeURIComponent(attachment.name || 'attachment.bin');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': attachment.contentType || 'application/octet-stream',
        'Content-Length': buffer.length.toString(),
        'Content-Disposition': `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: 'Unauthorized', message: error.message } },
        { status: error.status }
      );
    }

    if (error instanceof GraphError) {
      return NextResponse.json(
        { error: { code: error.code || 'GraphError', message: error.message } },
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

