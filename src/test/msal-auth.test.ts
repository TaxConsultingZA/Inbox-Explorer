import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMsalClient, getGraphAccessToken, resetMsalClient } from '@/lib/auth/msal';
import { appConfig } from '@/lib/config';

const mockAcquireToken = vi.fn();

// Mock @azure/msal-node
vi.mock('@azure/msal-node', () => {
  return {
    ConfidentialClientApplication: vi.fn().mockImplementation(() => ({
      acquireTokenByClientCredential: mockAcquireToken,
    })),
    LogLevel: {
      Error: 0,
      Warning: 1,
      Info: 2,
      Verbose: 3,
    },
  };
});

describe('MSAL Node Client Credentials Flow', () => {
  beforeEach(() => {
    resetMsalClient();
    mockAcquireToken.mockReset();
    appConfig.azure.clientId = 'test-client-guid';
    appConfig.azure.clientSecret = 'super_secret_key_123';
    appConfig.azure.tenantId = 'test-tenant-guid';
    appConfig.azure.authority = 'https://login.microsoftonline.com/test-tenant-guid';
  });

  it('acquires a token with the https://graph.microsoft.com/.default scope', async () => {
    const mockToken = 'mock_jwt_access_token_for_testing';

    mockAcquireToken.mockResolvedValueOnce({
      accessToken: mockToken,
      expiresOn: new Date(Date.now() + 3600 * 1000),
    });

    const client = getMsalClient();
    expect(client).toBeDefined();

    const token = await getGraphAccessToken();
    expect(token).toBe(mockToken);
    expect(mockAcquireToken).toHaveBeenCalledWith({
      scopes: ['https://graph.microsoft.com/.default'],
    });

    // Singleton check
    const client2 = getMsalClient();
    expect(client2).toBe(client);
  });

  it('prevents client secret leakage in error output when acquisition fails', async () => {
    const secret = 'super_secret_credential_value_9876';

    appConfig.azure.clientId = 'test-client-id';
    appConfig.azure.clientSecret = secret;
    appConfig.azure.authority = 'https://login.microsoftonline.com/test-tenant';

    mockAcquireToken.mockRejectedValueOnce(
      new Error(`AADSTS7000215: Invalid client secret provided: ${secret}`)
    );

    // Call getGraphAccessToken and expect sanitized error
    await expect(getGraphAccessToken()).rejects.toThrow();

    // Verify raw secret was not exposed in the error message
    mockAcquireToken.mockRejectedValueOnce(
      new Error(`AADSTS7000215: Invalid client secret provided: ${secret}`)
    );
    try {
      await getGraphAccessToken();
    } catch (err: any) {
      expect(err.message).not.toContain(secret);
      expect(err.message).toContain('[REDACTED_SECRET]');
    }
  });
});
