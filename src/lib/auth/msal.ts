import { ConfidentialClientApplication, Configuration, LogLevel } from '@azure/msal-node';
import { appConfig } from '../config';

// Global singleton instance for MSAL confidential client application
let msalAppInstance: ConfidentialClientApplication | null = null;

/**
 * Builds or retrieves the singleton ConfidentialClientApplication instance.
 * MSAL Node manages the in-memory token cache automatically across invocations.
 */
export function getMsalClient(): ConfidentialClientApplication {
  if (msalAppInstance) {
    return msalAppInstance;
  }

  const { clientId, authority, clientSecret } = appConfig.azure;

  if (!clientId || !clientSecret || !authority) {
    throw new Error('Microsoft Entra configuration is incomplete. Check AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET.');
  }

  const msalConfig: Configuration = {
    auth: {
      clientId,
      authority,
      clientSecret,
    },
    system: {
      loggerOptions: {
        loggerCallback(level, message, containsPii) {
          if (containsPii) {
            // NEVER log PII or credentials
            return;
          }
          // Do not log secrets or tokens
          if (level === LogLevel.Error) {
            console.error('[MSAL Error]', message);
          }
        },
        piiLoggingEnabled: false,
        logLevel: LogLevel.Warning,
      },
    },
  };

  msalAppInstance = new ConfidentialClientApplication(msalConfig);
  return msalAppInstance;
}

/**
 * Acquires a Microsoft Graph app-only access token using the OAuth 2.0 client credentials flow.
 * Tokens are automatically cached in-memory and renewed before expiration by MSAL.
 *
 * Scopes must be: https://graph.microsoft.com/.default
 *
 * NOTE: Returns the access token strictly on the server-side.
 * NEVER expose this token to client responses or logs.
 */
export async function getGraphAccessToken(): Promise<string> {
  const msal = getMsalClient();

  try {
    const tokenResult = await msal.acquireTokenByClientCredential({
      scopes: [appConfig.azure.graphDefaultScope],
    });

    if (!tokenResult || !tokenResult.accessToken) {
      throw new Error('MSAL failed to acquire an access token for Microsoft Graph.');
    }

    return tokenResult.accessToken;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    // Sanitize any accidental sensitive leaks in error messages
    const sanitizedMsg = message
      .replace(new RegExp(appConfig.azure.clientSecret || '____', 'g'), '[REDACTED_SECRET]')
      .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, '[REDACTED_JWT]');

    console.error('[Auth Error] Failed to acquire Microsoft Graph token:', sanitizedMsg);
    throw new Error(`Authentication with Microsoft Entra failed: ${sanitizedMsg}`);
  }
}

/**
 * Resets the MSAL client instance (used primarily in test suites).
 */
export function resetMsalClient(): void {
  msalAppInstance = null;
}
