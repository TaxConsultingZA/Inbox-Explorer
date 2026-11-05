import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  graphFetch,
  GraphThrottlingError,
  GraphAuthError,
  GraphNotFoundError,
} from '@/lib/graph/client';

// Mock getGraphAccessToken from auth/msal
vi.mock('@/lib/auth/msal', () => ({
  getGraphAccessToken: vi.fn().mockResolvedValue('test_bearer_token'),
}));

describe('Microsoft Graph Resilient HTTP Client', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('performs successful authenticated request to Graph API', async () => {
    const mockResponseData = { value: [{ id: '1', subject: 'Test' }] };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'request-id': 'req-123' }),
      json: async () => mockResponseData,
    });

    const result = await graphFetch('/users/test@example.com/messages');
    expect(result).toEqual(mockResponseData);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/test@example.com/messages'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test_bearer_token',
          ConsistencyLevel: 'eventual',
        }),
      })
    );
  });

  it('handles HTTP 429 throttling with Retry-After header backoff', async () => {
    const mockResponseData = { value: [{ id: '2', subject: 'Throttled Then Succeeded' }] };

    // 1st call: 429 with Retry-After: 0.05
    // 2nd call: 200 OK
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'Retry-After': '0' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'request-id': 'req-retry' }),
        json: async () => mockResponseData,
      });

    const result = await graphFetch('/users/test@example.com/mailFolders/inbox/messages', {
      maxRetries: 2,
    });

    expect(result).toEqual(mockResponseData);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('throws GraphThrottlingError when 429 retries are exhausted', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({ 'Retry-After': '0' }),
    });

    await expect(
      graphFetch('/users/test@example.com/messages', { maxRetries: 1 })
    ).rejects.toThrow(GraphThrottlingError);
  });

  it('handles transient 503 Service Unavailable with exponential backoff and succeeds on retry', async () => {
    const mockData = { value: [] };

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockData,
      });

    const result = await graphFetch('/users/test@example.com/messages', {
      maxRetries: 2,
    });

    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('throws GraphAuthError on 401 Unauthorized', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers(),
      json: async () => ({ error: { message: 'Token is invalid' } }),
    });

    await expect(graphFetch('/users/test@example.com/messages')).rejects.toThrow(GraphAuthError);
  });

  it('throws GraphAuthError with actionable guidance on 403 Forbidden', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 403,
      headers: new Headers(),
      json: async () => ({
        error: { code: 'ErrorAccessDenied', message: 'Access is denied. Check credentials and try again.' },
      }),
    });

    try {
      await graphFetch('/users/restricted@example.com/messages');
      expect.unreachable('Should have thrown GraphAuthError');
    } catch (err: any) {
      expect(err).toBeInstanceOf(GraphAuthError);
      expect(err.status).toBe(403);
      expect(err.message).toContain('Exchange Online RBAC for Applications');
    }
  });

  it('throws GraphNotFoundError on 404 Mailbox Not Found', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      headers: new Headers(),
      json: async () => ({ error: { code: 'ResourceNotFound', message: 'Mailbox not found' } }),
    });

    await expect(graphFetch('/users/nonexistent@example.com/messages')).rejects.toThrow(
      GraphNotFoundError
    );
  });
});

