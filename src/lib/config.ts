import { z } from 'zod';

const envSchema = z.object({
  AZURE_TENANT_ID: z.string().default(''),
  AZURE_CLIENT_ID: z.string().default(''),
  AZURE_CLIENT_SECRET: z.string().default(''),
  OUTLOOK_MAILBOX_UPN: z.string().default(''),
  AUTH_ALLOWED_USER_OBJECT_IDS: z.string().default(''),
  AUTH_SECRET: z.string().default('insecure-dev-secret-do-not-use-in-production-min-32-chars-long!'),
  AUTH_REDIRECT_URI: z.string().default('http://localhost:3000/api/auth/callback'),
  DEV_MODE: z.string().default('false'),
  GRAPH_REQUEST_TIMEOUT_MS: z.string().default('15000'),
  GRAPH_PAGE_SIZE: z.string().default('15'),
  GRAPH_SAFEGUARD_MAX_BATCH: z.string().default('25'),
  GRAPH_MIN_REQUEST_INTERVAL_MS: z.string().default('300'),
});

const rawEnv = envSchema.parse({
  AZURE_TENANT_ID: process.env.AZURE_TENANT_ID,
  AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID,
  AZURE_CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET,
  OUTLOOK_MAILBOX_UPN: process.env.OUTLOOK_MAILBOX_UPN,
  AUTH_ALLOWED_USER_OBJECT_IDS: process.env.AUTH_ALLOWED_USER_OBJECT_IDS,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_REDIRECT_URI: process.env.AUTH_REDIRECT_URI,
  DEV_MODE: process.env.DEV_MODE,
  GRAPH_REQUEST_TIMEOUT_MS: process.env.GRAPH_REQUEST_TIMEOUT_MS,
  GRAPH_PAGE_SIZE: process.env.GRAPH_PAGE_SIZE,
  GRAPH_SAFEGUARD_MAX_BATCH: process.env.GRAPH_SAFEGUARD_MAX_BATCH,
  GRAPH_MIN_REQUEST_INTERVAL_MS: process.env.GRAPH_MIN_REQUEST_INTERVAL_MS,
});

const isProd = process.env.NODE_ENV === 'production';
const rawDevMode = rawEnv.DEV_MODE.toLowerCase() === 'true';

// HARD SECURITY ENFORCEMENT: Dev mode is strictly deactivated in production.
if (isProd && rawDevMode) {
  console.warn(
    '[SECURITY NOTICE] DEV_MODE is disabled in production. Connecting to live Microsoft Entra & Exchange.'
  );
}

// In local dev, if Entra credentials are empty or placeholders, default devMode to true if requested or if credentials are placeholders
const hasValidEntraConfig = Boolean(
  rawEnv.AZURE_TENANT_ID &&
  rawEnv.AZURE_CLIENT_ID &&
  rawEnv.AZURE_CLIENT_SECRET &&
  rawEnv.OUTLOOK_MAILBOX_UPN &&
  !rawEnv.AZURE_TENANT_ID.includes('00000000') &&
  !rawEnv.AZURE_CLIENT_SECRET.includes('your_entra_app_client_secret')
);

// Dev mode is strictly impossible in production
const isDevModeActive = !isProd && (rawDevMode || !hasValidEntraConfig);

export const appConfig = {
  isProduction: isProd,
  isDevMode: isDevModeActive,
  azure: {
    tenantId: rawEnv.AZURE_TENANT_ID,
    clientId: rawEnv.AZURE_CLIENT_ID,
    clientSecret: rawEnv.AZURE_CLIENT_SECRET,
    authority: `https://login.microsoftonline.com/${rawEnv.AZURE_TENANT_ID || 'common'}`,
    graphDefaultScope: 'https://graph.microsoft.com/.default',
    graphEndpoint: 'https://graph.microsoft.com/v1.0',
    hasValidConfig: hasValidEntraConfig,
  },
  mailbox: {
    // Strictly server-configured target mailbox. No arbitrary client overrides.
    targetUpn: rawEnv.OUTLOOK_MAILBOX_UPN || 'shared-inbox@example.com',
  },
  auth: {
    allowedObjectIds: rawEnv.AUTH_ALLOWED_USER_OBJECT_IDS
      ? rawEnv.AUTH_ALLOWED_USER_OBJECT_IDS.split(',').map((id) => id.trim()).filter(Boolean)
      : [],
    authSecret: rawEnv.AUTH_SECRET,
    redirectUri: rawEnv.AUTH_REDIRECT_URI,
  },
  graph: {
    timeoutMs: Math.max(1000, parseInt(rawEnv.GRAPH_REQUEST_TIMEOUT_MS, 10) || 15000),
    defaultPageSize: Math.min(25, Math.max(5, parseInt(rawEnv.GRAPH_PAGE_SIZE, 10) || 15)),
    safeguardMaxBatch: Math.min(25, Math.max(5, parseInt(rawEnv.GRAPH_SAFEGUARD_MAX_BATCH, 10) || 25)),
    minRequestIntervalMs: Math.max(100, parseInt(rawEnv.GRAPH_MIN_REQUEST_INTERVAL_MS, 10) || 300),
  },
};

