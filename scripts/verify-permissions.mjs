#!/usr/bin/env node

/**
 * Microsoft Entra & Exchange Online Permission Verification Script
 *
 * Validates that the configured application credentials in .env.local (or environment variables)
 * have all necessary permissions to communicate with Microsoft Graph and the target Exchange Online mailbox.
 *
 * Usage:
 *   node scripts/verify-permissions.mjs
 *   npm run test:permissions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ConfidentialClientApplication } from '@azure/msal-node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// ANSI Terminal Colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function logHeader(text) {
  console.log(`\n${colors.bold}${colors.blue}=== ${text} ===${colors.reset}`);
}

function logPass(title, detail = '') {
  console.log(` ${colors.green}✔ PASS${colors.reset}  ${colors.bold}${title}${colors.reset}${detail ? ` - ${colors.dim}${detail}${colors.reset}` : ''}`);
}

function logFail(title, errorDetail = '', remediation = '') {
  console.log(` ${colors.red}✖ FAIL${colors.reset}  ${colors.bold}${title}${colors.reset}`);
  if (errorDetail) console.log(`        ${colors.red}${errorDetail}${colors.reset}`);
  if (remediation) console.log(`        ${colors.yellow}Remediation: ${remediation}${colors.reset}`);
}

function logWarn(title, detail = '') {
  console.log(` ${colors.yellow}▲ WARN${colors.reset}  ${colors.bold}${title}${colors.reset}${detail ? ` - ${colors.yellow}${detail}${colors.reset}` : ''}`);
}

function logInfo(title, detail = '') {
  console.log(` ${colors.cyan}ℹ INFO${colors.reset}  ${title}${detail ? ` - ${colors.dim}${detail}${colors.reset}` : ''}`);
}

// 1. Load Environment Variables from .env.local or .env
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) {
      logInfo(`Loading configuration from`, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          // Remove quotes if present
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
      break;
    }
  }
}

async function runVerification() {
  console.log(`${colors.bold}${colors.cyan}
╔════════════════════════════════════════════════════════════════════════╗
║     INBOX EXPLORER - MICROSOFT ENTRA & EXCHANGE PERMISSION AUDITOR     ║
╚════════════════════════════════════════════════════════════════════════╝${colors.reset}`);

  loadEnv();

  const tenantId = process.env.AZURE_TENANT_ID || '';
  const clientId = process.env.AZURE_CLIENT_ID || '';
  const clientSecret = process.env.AZURE_CLIENT_SECRET || '';
  const mailboxUpn = process.env.OUTLOOK_MAILBOX_UPN || '';
  const isDevMode = (process.env.DEV_MODE || '').toLowerCase() === 'true';

  let hasErrors = false;

  // --------------------------------------------------------------------------
  // STEP 1: Configuration Sanity Check
  // --------------------------------------------------------------------------
  logHeader('STEP 1: Configuration Sanity Check');

  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isPlaceholderGuid = (val) => val.includes('00000000-0000') || !guidRegex.test(val);
  const isPlaceholderSecret = (val) => !val || val.includes('your_entra_app_client_secret') || val.length < 8;
  const isPlaceholderUpn = (val) => !val || val.includes('yourdomain.onmicrosoft.com') || !val.includes('@');

  if (!tenantId || isPlaceholderGuid(tenantId)) {
    logFail('AZURE_TENANT_ID is invalid or placeholder', tenantId, 'Provide your Entra Directory (Tenant) ID GUID in .env.local.');
    hasErrors = true;
  } else {
    logPass('AZURE_TENANT_ID format valid', `${tenantId.slice(0, 8)}...`);
  }

  if (!clientId || isPlaceholderGuid(clientId)) {
    logFail('AZURE_CLIENT_ID is invalid or placeholder', clientId, 'Provide your Entra Application (Client) ID GUID in .env.local.');
    hasErrors = true;
  } else {
    logPass('AZURE_CLIENT_ID format valid', `${clientId.slice(0, 8)}...`);
  }

  if (!clientSecret || isPlaceholderSecret(clientSecret)) {
    logFail('AZURE_CLIENT_SECRET is missing or placeholder', '[REDACTED]', 'Generate a confidential client secret in Entra App Registrations and save to .env.local.');
    hasErrors = true;
  } else {
    logPass('AZURE_CLIENT_SECRET present and non-empty', '[SECRET CONCEALED]');
  }

  if (!mailboxUpn || isPlaceholderUpn(mailboxUpn)) {
    logFail('OUTLOOK_MAILBOX_UPN is invalid or placeholder', mailboxUpn, 'Set OUTLOOK_MAILBOX_UPN to the target Exchange Online user or shared mailbox address.');
    hasErrors = true;
  } else {
    logPass('OUTLOOK_MAILBOX_UPN format valid', mailboxUpn);
  }

  if (isDevMode) {
    logWarn('DEV_MODE is currently enabled (DEV_MODE=true)', 'Local development mock mode is active. Live Entra calls will be tested now.');
  }

  if (hasErrors) {
    console.log(`\n${colors.red}${colors.bold}✖ Configuration checks failed. Please update your .env.local file with real credentials before testing live permissions.${colors.reset}\n`);
    process.exit(1);
  }

  // --------------------------------------------------------------------------
  // STEP 2: Acquire MSAL Token & Verify Token Roles / Scopes
  // --------------------------------------------------------------------------
  logHeader('STEP 2: Microsoft Entra OAuth 2.0 Token Acquisition');

  const authority = `https://login.microsoftonline.com/${tenantId}`;
  const msalClient = new ConfidentialClientApplication({
    auth: {
      clientId,
      authority,
      clientSecret,
    },
  });

  let accessToken = '';
  try {
    const authResult = await msalClient.acquireTokenByClientCredential({
      scopes: ['https://graph.microsoft.com/.default'],
    });

    if (!authResult || !authResult.accessToken) {
      throw new Error('MSAL returned an empty token response.');
    }

    accessToken = authResult.accessToken;
    logPass('Acquired app-only bearer token', `Expires on: ${new Date(authResult.expiresOn).toLocaleTimeString()}`);

    // Decode JWT payload (without verifying signature since we just received it over HTTPS from Microsoft)
    const tokenParts = accessToken.split('.');
    if (tokenParts.length === 3) {
      const payloadJson = Buffer.from(tokenParts[1], 'base64').toString('utf8');
      const payload = JSON.parse(payloadJson);
      const roles = payload.roles || [];

      logInfo('Token Application Roles granted:', roles.length > 0 ? roles.join(', ') : 'None');

      if (roles.includes('Mail.Read')) {
        logPass("Application role 'Mail.Read' confirmed in access token");
      } else {
        logFail(
          "Missing 'Mail.Read' application permission in access token",
          `Roles present: [${roles.join(', ')}]`,
          "In Entra Admin Center, navigate to App Registrations > API permissions > Add permission > Microsoft Graph > Application permissions > Mail.Read, then click 'Grant admin consent'."
        );
        hasErrors = true;
      }

      // Check for overly permissive write roles
      if (roles.includes('Mail.ReadWrite') || roles.includes('Mail.Send')) {
        logWarn(
          "Overly permissive write role detected ('Mail.ReadWrite' or 'Mail.Send')",
          'This application is designed strictly for read-only access. Adhere to the principle of least privilege by granting only Mail.Read.'
        );
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logFail('Failed to acquire Microsoft Graph token from Entra', message, 'Verify AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET match your Entra App Registration.');
    process.exit(1);
  }

  // --------------------------------------------------------------------------
  // Helper for Graph HTTP Requests
  // --------------------------------------------------------------------------
  async function callGraph(endpoint, method = 'GET', body = null) {
    const url = `https://graph.microsoft.com/v1.0${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const options = {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ConsistencyLevel: 'eventual',
      },
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(url, options);
    let data = null;
    try {
      data = await res.json();
    } catch {
      // ignore
    }
    return { ok: res.ok, status: res.status, data, statusText: res.statusText };
  }

  // --------------------------------------------------------------------------
  // STEP 3: Verify Target Mailbox / User Exists
  // --------------------------------------------------------------------------
  logHeader('STEP 3: Exchange Online Recipient Existence Check');

  const userRes = await callGraph(`/users/${encodeURIComponent(mailboxUpn)}?$select=id,displayName,userPrincipalName,mail`);
  if (userRes.ok && userRes.data) {
    logPass(
      `Target mailbox object found in tenant`,
      `Display Name: "${userRes.data.displayName || 'Shared'}" | Mail: ${userRes.data.mail || userRes.data.userPrincipalName}`
    );
  } else {
    const errCode = userRes.data?.error?.code || userRes.statusText;
    const errMsg = userRes.data?.error?.message || 'Mailbox not found.';
    logFail(
      `Cannot locate target mailbox '${mailboxUpn}' in tenant (HTTP ${userRes.status})`,
      `${errCode}: ${errMsg}`,
      `Verify the target mailbox '${mailboxUpn}' exists in Exchange Online and is not an external contact or deleted mailbox.`
    );
    hasErrors = true;
  }

  // --------------------------------------------------------------------------
  // STEP 4: Verify Inbox Folder Access (RBAC & Application Access Policy)
  // --------------------------------------------------------------------------
  logHeader('STEP 4: Inbox Folder Access & Read Verification');

  const inboxRes = await callGraph(`/users/${encodeURIComponent(mailboxUpn)}/mailFolders/inbox?$select=id,displayName,totalItemCount,unreadItemCount`);
  if (inboxRes.ok && inboxRes.data) {
    logPass(
      `Inbox folder accessed successfully`,
      `Total messages: ${inboxRes.data.totalItemCount ?? 0} | Unread: ${inboxRes.data.unreadItemCount ?? 0}`
    );
  } else {
    const errCode = inboxRes.data?.error?.code || inboxRes.statusText;
    const errMsg = inboxRes.data?.error?.message || 'Access denied.';

    if (inboxRes.status === 403) {
      logFail(
        `403 Forbidden: Access to target mailbox Inbox was blocked`,
        `${errCode}: ${errMsg}`,
        `Ensure 'Mail.Read' has received Tenant Admin Consent. If using Application Access Policies in Exchange Online, ensure '${mailboxUpn}' is a member of the policy scope group (run Test-ApplicationAccessPolicy).`
      );
    } else {
      logFail(`Unable to access inbox folder (HTTP ${inboxRes.status})`, `${errCode}: ${errMsg}`);
    }
    hasErrors = true;
  }

  // --------------------------------------------------------------------------
  // STEP 5: Verify Message Listing & Minimal Select Query
  // --------------------------------------------------------------------------
  logHeader('STEP 5: Message Listing & Query Execution');

  const msgRes = await callGraph(
    `/users/${encodeURIComponent(mailboxUpn)}/mailFolders/inbox/messages?$top=1&$select=id,subject,receivedDateTime,hasAttachments`
  );

  if (msgRes.ok && msgRes.data) {
    const count = msgRes.data.value?.length || 0;
    logPass(
      `Retrieved message listing via Graph v1.0`,
      count > 0 ? `Sample Subject: "${msgRes.data.value[0].subject || '(No Subject)'}"` : 'Inbox is empty (0 messages)'
    );
  } else {
    const errCode = msgRes.data?.error?.code || msgRes.statusText;
    logFail(`Failed to retrieve message list (HTTP ${msgRes.status})`, errCode);
    hasErrors = true;
  }

  // --------------------------------------------------------------------------
  // STEP 6: Read-Only Compliance Verification (Strict Least Privilege)
  // --------------------------------------------------------------------------
  logHeader('STEP 6: Read-Only Least-Privilege Assertion');

  // Attempt to create a draft email. In a correctly configured read-only app, this MUST be rejected (HTTP 403)
  const writeProbeRes = await callGraph(`/users/${encodeURIComponent(mailboxUpn)}/messages`, 'POST', {
    subject: '[AUDIT PROBE - SHOULD BE REJECTED]',
    body: { contentType: 'text', content: 'Auditing least privilege' },
  });

  if (writeProbeRes.status === 403 || writeProbeRes.status === 401) {
    logPass('Write operations are safely BLOCKED (Least Privilege Enforced)', `HTTP ${writeProbeRes.status} received on write probe`);
  } else if (writeProbeRes.ok) {
    logWarn(
      'Write permission is ENABLED on this application registration',
      'The application was able to create a draft message. We recommend revoking Mail.ReadWrite and restricting to Mail.Read only.'
    );
    // Cleanup the probe draft if created
    if (writeProbeRes.data?.id) {
      await callGraph(`/users/${encodeURIComponent(mailboxUpn)}/messages/${writeProbeRes.data.id}`, 'DELETE');
    }
  }

  // --------------------------------------------------------------------------
  // SUMMARY REPORT
  // --------------------------------------------------------------------------
  console.log(`\n${colors.bold}${colors.blue}========================================================================${colors.reset}`);
  if (hasErrors) {
    console.log(`${colors.red}${colors.bold}❌ AUDIT FAILED: One or more permission checks failed.${colors.reset}`);
    console.log(`${colors.yellow}Review the remediation steps above and consult docs/ENTRA_SETUP.md and docs/EXCHANGE_RBAC.md.${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bold}✔ AUDIT PASSED: All Microsoft Entra and Exchange Online permissions are verified!${colors.reset}`);
    console.log(`${colors.cyan}The application is fully configured and ready to connect to ${mailboxUpn}.${colors.reset}\n`);
    process.exit(0);
  }
}

runVerification().catch((err) => {
  console.error(`\n${colors.red}${colors.bold}Fatal error executing permission audit:${colors.reset}`, err);
  process.exit(1);
});

