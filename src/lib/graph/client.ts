import { appConfig } from '../config';
import { getGraphAccessToken } from '../auth/msal';

export class GraphError extends Error {
  public status: number;
  public code?: string;
  public requestId?: string;
  public retryAfter?: number;

  constructor(message: string, status: number, code?: string, requestId?: string, retryAfter?: number) {
    super(message);
    this.name = 'GraphError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.retryAfter = retryAfter;
  }
}

export class GraphAuthError extends GraphError {
  constructor(message: string, status: number, code?: string, requestId?: string) {
    super(message, status, code, requestId);
    this.name = 'GraphAuthError';
  }
}

export class GraphThrottlingError extends GraphError {
  constructor(message: string, retryAfter?: number, requestId?: string) {
    super(message, 429, 'ApplicationThrottled', requestId, retryAfter);
    this.name = 'GraphThrottlingError';
  }
}

export class GraphNotFoundError extends GraphError {
  constructor(message: string, requestId?: string) {
    super(message, 404, 'ResourceNotFound', requestId);
    this.name = 'GraphNotFoundError';
  }
}

interface GraphFetchOptions extends RequestInit {
  timeoutMs?: number;
  maxRetries?: number;
}

/**
 * Executes an authenticated HTTP request to Microsoft Graph API v1.0
 * with automatic bearer token injection, timeout handling, HTTP 429 Retry-After,
 * and exponential backoff retry for transient 5xx errors.
 */
export async function graphFetch<T = any>(
  pathOrUrl: string,
  options: GraphFetchOptions = {}
): Promise<T> {
  const isFullUrl = pathOrUrl.startsWith('https://');
  const targetUrl = isFullUrl ? pathOrUrl : `${appConfig.azure.graphEndpoint}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;

  const timeoutMs = options.timeoutMs ?? appConfig.graph.timeoutMs;
  const maxRetries = options.maxRetries ?? 3;
  let attempt = 0;

  while (attempt <= maxRetries) {
    const token = await getGraphAccessToken();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(targetUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          // ConsistencyLevel: eventual is required for advanced Graph queries ($search, advanced filters)
          ConsistencyLevel: 'eventual',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      const requestId = response.headers.get('request-id') || response.headers.get('client-request-id') || undefined;

      // Handle HTTP 429 Throttling
      if (response.status === 429) {
        const retryAfterHeader = response.headers.get('Retry-After');
        const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : Math.pow(2, attempt) + 1;

        if (attempt < maxRetries) {
          attempt++;
          console.warn(`[Graph 429 Throttled] Backing off for ${retryAfterSeconds}s (attempt ${attempt}/${maxRetries})...`);
          await new Promise((res) => setTimeout(res, retryAfterSeconds * 1000));
          continue;
        }

        throw new GraphThrottlingError(
          `Microsoft Graph rate limit exceeded. Retry after ${retryAfterSeconds} seconds.`,
          retryAfterSeconds,
          requestId
        );
      }

      // Handle Transient 5xx Server Errors (500, 502, 503, 504)
      if (response.status >= 500 && response.status <= 504) {
        if (attempt < maxRetries) {
          attempt++;
          const jitter = Math.random() * 200;
          const delayMs = Math.pow(2, attempt) * 500 + jitter;
          console.warn(`[Graph ${response.status}] Transient error, retrying in ${Math.round(delayMs)}ms (attempt ${attempt}/${maxRetries})...`);
          await new Promise((res) => setTimeout(res, delayMs));
          continue;
        }
      }

      // Handle 401 Unauthorized
      if (response.status === 401) {
        throw new GraphAuthError(
          'Unauthorized: Microsoft Graph rejected the application credentials or the access token has expired.',
          401,
          'Unauthorized',
          requestId
        );
      }

      // Handle 403 Forbidden (RBAC / Application Access Policy restrictions)
      if (response.status === 403) {
        let details = 'Forbidden: Application lacks permission to access the target mailbox.';
        try {
          const errorJson = await response.json();
          if (errorJson?.error?.message) {
            details = `Forbidden: ${errorJson.error.message}`;
          }
        } catch {
          // ignore json parse error
        }
        throw new GraphAuthError(
          `${details} Ensure Mail.Read has received Admin Consent and Exchange Online RBAC for Applications allows this mailbox.`,
          403,
          'AccessDenied',
          requestId
        );
      }

      // Handle 404 Not Found
      if (response.status === 404) {
        throw new GraphNotFoundError(
          `Microsoft Graph resource or target mailbox '${appConfig.mailbox.targetUpn}' was not found. Verify the mailbox exists in Exchange Online.`,
          requestId
        );
      }

      // Handle other non-2xx errors
      if (!response.ok) {
        let errorMsg = `Microsoft Graph request failed with status ${response.status} ${response.statusText}`;
        let errorCode = 'UnknownError';
        try {
          const errorJson = await response.json();
          if (errorJson?.error) {
            errorCode = errorJson.error.code || errorCode;
            errorMsg = errorJson.error.message || errorMsg;
          }
        } catch {
          // ignore
        }
        throw new GraphError(errorMsg, response.status, errorCode, requestId);
      }

      // For 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      if (err instanceof GraphError) {
        throw err;
      }

      if (err instanceof Error && err.name === 'AbortError') {
        throw new GraphError(`Microsoft Graph request timed out after ${timeoutMs}ms.`, 408, 'RequestTimeout');
      }

      const rawMsg = err instanceof Error ? err.message : String(err);
      // Ensure no secrets leak in unexpected network errors
      const sanitized = rawMsg
        .replace(new RegExp(appConfig.azure.clientSecret || '____', 'g'), '[REDACTED]')
        .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [REDACTED]');

      throw new GraphError(`Network error communicating with Microsoft Graph: ${sanitized}`, 500, 'NetworkError');
    }
  }

  throw new GraphError('Maximum retries exceeded for Microsoft Graph request.', 500, 'MaxRetriesExceeded');
}
