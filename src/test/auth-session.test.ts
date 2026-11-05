import { describe, it, expect, beforeEach } from 'vitest';
import { getSession, requireAuthorizedUser, AuthError } from '@/lib/auth/session';
import { appConfig } from '@/lib/config';

describe('User Authentication & Allowlist Authorization', () => {
  beforeEach(() => {
    appConfig.isDevMode = false;
    appConfig.auth.allowedObjectIds = ['allowed-guid-1234', 'allowed-guid-5678'];
  });

  it('allows access to users present in AUTH_ALLOWED_USER_OBJECT_IDS', async () => {
    const mockRequest = new Request('http://localhost:3000/api/mail/inbox', {
      headers: {
        'x-user-oid': 'allowed-guid-1234',
        'x-user-email': 'auditor@domain.com',
      },
    });

    const session = await requireAuthorizedUser(mockRequest);
    expect(session).toBeDefined();
    expect(session.userObjectId).toBe('allowed-guid-1234');
    expect(session.isAuthorized).toBe(true);
  });

  it('denies access (403 Forbidden) to users not in the allowlist', async () => {
    const mockRequest = new Request('http://localhost:3000/api/mail/inbox', {
      headers: {
        'x-user-oid': 'unauthorized-user-9999',
        'x-user-email': 'intruder@domain.com',
      },
    });

    await expect(requireAuthorizedUser(mockRequest)).rejects.toThrow(AuthError);
    try {
      await requireAuthorizedUser(mockRequest);
    } catch (err: any) {
      expect(err.status).toBe(403);
      expect(err.message).toContain('not authorized to access this mailbox');
    }
  });

  it('rejects unauthenticated requests (401 Unauthorized) in production', async () => {
    const mockRequest = new Request('http://localhost:3000/api/mail/inbox', {
      headers: {},
    });

    await expect(requireAuthorizedUser(mockRequest)).rejects.toThrow(AuthError);
    try {
      await requireAuthorizedUser(mockRequest);
    } catch (err: any) {
      expect(err.status).toBe(401);
      expect(err.message).toContain('Authentication required');
    }
  });

  it('provides a simulated authorized session in Dev Mode for local testing', async () => {
    appConfig.isDevMode = true;

    const mockRequest = new Request('http://localhost:3000/api/mail/inbox');
    const session = await getSession(mockRequest);

    expect(session).toBeDefined();
    expect(session?.isAuthorized).toBe(true);
    expect(session?.name).toContain('Dev Mode');
  });
});

