import { NextRequest, NextResponse } from 'next/server';
import { appConfig } from '../config';
import { UserSession } from '@/types/mail';

const SESSION_COOKIE_NAME = 'inbox_explorer_session';

/**
 * Validates the current user session and verifies that their Entra User Object ID
 * is in the server-configured allowlist (AUTH_ALLOWED_USER_OBJECT_IDS).
 */
export async function getSession(request?: Request | NextRequest): Promise<UserSession | null> {
  // If in Local Development Mode, simulate an authorized session
  if (appConfig.isDevMode) {
    const devOid = appConfig.auth.allowedObjectIds[0] || 'dev-local-user-oid-0001';
    return {
      userObjectId: devOid,
      email: 'admin.auditor@contoso.onmicrosoft.com',
      name: 'Entra Mailbox Auditor (Dev Mode)',
      isAuthorized: true,
    };
  }

  // Check request headers or cookies for authenticated user claims
  if (!request) {
    return null;
  }

  const userOid = request.headers.get('x-ms-client-principal-id') ||
                  request.headers.get('x-user-oid');
  const userEmail = request.headers.get('x-ms-client-principal-name') ||
                    request.headers.get('x-user-email') ||
                    'authenticated-user@domain.com';
  const userName = request.headers.get('x-user-name') || userEmail;

  if (!userOid) {
    // In production, an unauthenticated request returns null
    return null;
  }

  // Check against authorized user allowlist if configured
  const allowed = appConfig.auth.allowedObjectIds.length === 0 ||
                  appConfig.auth.allowedObjectIds.includes(userOid);

  return {
    userObjectId: userOid,
    email: userEmail,
    name: userName,
    isAuthorized: allowed,
  };
}

/**
 * Enforces that the request has an authorized user session.
 * Throws 401 Unauthorized or 403 Forbidden response if check fails.
 */
export async function requireAuthorizedUser(request: Request): Promise<UserSession> {
  const session = await getSession(request);

  if (!session) {
    throw new AuthError('Authentication required. Please sign in with your enterprise account.', 401);
  }

  if (!session.isAuthorized) {
    throw new AuthError('Access denied. Your Entra User Object ID is not authorized to access this mailbox.', 403);
  }

  return session;
}

export class AuthError extends Error {
  public status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}
