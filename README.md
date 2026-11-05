# Inbox Explorer: Enterprise Microsoft Exchange Online Reader

A production-quality, read-only Outlook-style enterprise web application that connects to Microsoft Exchange Online using Microsoft Entra application credentials (`@azure/msal-node`) and the Microsoft Graph API v1.0.

Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Node.js server runtime** for confidential-client operations.

---

## Key Highlights & Architecture

- **True Read-Only Scope**: Dedicated exclusively to browsing, searching, filtering, and reading emails and safe attachments. No email sending, modification, deletion, or forwarding capabilities (`Mail.Read` only; zero `Mail.ReadWrite` or `Mail.Send`).
- **App-Only Authentication (`@azure/msal-node`)**: Uses the OAuth 2.0 Client Credentials flow (`https://graph.microsoft.com/.default`) with in-memory token caching.
- **Zero Client Credential Leakage**: Client secrets, tokens, and tenant credentials remain strictly server-side. No sensitive variables in frontend bundles or logs.
- **Server-Enforced Mailbox Boundary**: The target mailbox is strictly locked to `OUTLOOK_MAILBOX_UPN`. Users cannot supply arbitrary mailbox addresses.
- **Enterprise Exchange Scoping**: Includes comprehensive guides for **Exchange Online RBAC for Applications** and **Application Access Policies** to prevent broad tenant-wide mailbox reading.
- **Sandboxed & Sanitized Reading Experience**: Untrusted email HTML is sanitized server-side via `isomorphic-dompurify` and isolated in a sandboxed `iframe` (`sandbox="allow-popups"` without `allow-scripts`) to block XSS and script execution.
- **Graph Resilience & Throttling Defense**: Implements automatic HTTP 429 `Retry-After` handling, transient 5xx exponential backoff with jitter, and request timeouts via `AbortController`.
- **Outlook-Inspired 3-Pane UI**:
  - **Left Sidebar**: Folder tree, mailbox identity pill, connectivity status, theme switcher, and keyboard shortcuts.
  - **Middle Pane**: Search bar, quick filter pills (Unread, Attachments, High Importance, Date Range), conversation grouping, and message cards.
  - **Right Reading Pane**: Full email details, recipient pill chips, direct "Open in Outlook Web" link, Internet headers viewer, safe attachment downloads, and responsive body viewer.

---

## Project Structure

```
├── docs/
│   ├── ENTRA_SETUP.md               # Step-by-step Entra app registration & consent guide
│   └── EXCHANGE_RBAC.md             # Exchange Online RBAC & Application Access Policies
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/              # Health & liveness check endpoint
│   │   │   └── mail/
│   │   │       ├── connection-status/ # Live Entra & Exchange connectivity diagnostics
│   │   │       ├── inbox/           # Paginated inbox listing, filtering & search
│   │   │       └── messages/
│   │   │           └── [id]/        # Full email details & attachments download
│   │   ├── globals.css              # Global styles & Outlook custom scrollbars
│   │   ├── layout.tsx               # Root layout & enterprise metadata
│   │   └── page.tsx                 # Responsive 3-pane Outlook web application
│   ├── components/
│   │   ├── ConnectionStatusModal.tsx # Connectivity diagnostic checklist modal
│   │   ├── HeadersModal.tsx         # Internet Message RFC822 headers inspector
│   │   ├── KeyboardShortcutsModal.tsx# Keyboard shortcuts helper
│   │   ├── MessageList.tsx          # Pane B: Search, filters, and message cards
│   │   ├── ReadingPane.tsx          # Pane C: Email reading experience & attachments
│   │   ├── SanitizedEmailFrame.tsx  # Sandboxed iframe email reader
│   │   ├── Sidebar.tsx              # Pane A: Navigation, folders, and mailbox info
│   │   └── ThemeToggle.tsx          # Light and dark theme switcher
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── msal.ts              # MSAL Node ConfidentialClientApplication singleton
│   │   │   └── session.ts           # User authorization gate & allowlist verification
│   │   ├── config.ts                # Zod environment validation & security assertions
│   │   ├── graph/
│   │   │   ├── client.ts            # Resilient Graph fetch client (429 / 5xx retries)
│   │   │   ├── mail-service.ts      # Mailbox service (inbox queries, select fields, delta stubs)
│   │   │   └── mock-data.ts         # High-fidelity mock dataset for local dev testing
│   │   └── security/
│   │       └── sanitize.ts          # DOMPurify HTML sanitization rules
│   ├── test/                        # Vitest automated test suite (25 tests)
│   └── types/
│       └── mail.ts                  # TypeScript models for Graph entities
├── .env.example                     # Environment configuration template
├── next.config.mjs                  # CSP, security headers, and external packages config
├── tailwind.config.ts               # Enterprise Outlook styling palette
└── vitest.config.ts                 # Unit & integration test configuration
```

---

## Prerequisites

- **Node.js**: v18.18+ or v20+ (tested on Node v24.16.0)
- **npm**: 9+ or 10+
- **Microsoft 365 Tenant**: With an active Exchange Online mailbox and tenant administrator access.

---

## Quickstart & Local Development

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd Inbox-Explorer
npm install
```

### 2. Configure Environment Variables
Copy the template to `.env.local`:
```bash
cp .env.example .env.local
```

### 3. Local Development Mode (Immediate Testing without Live Credentials)
If your organization's Microsoft Entra application credentials are not yet provisioned, you can start the application immediately in **Development Mock Mode**:
```env
# .env.local
DEV_MODE=true
OUTLOOK_MAILBOX_UPN=shared-inbox@contoso.onmicrosoft.com
```

> [!NOTE]
> `DEV_MODE=true` loads a realistic dataset of enterprise emails, simulated incidents, and attachments so you can test search, filters, pagination, and theme switching without connecting to Entra.
>
> **Security Guardrail**: `DEV_MODE` is **strictly prohibited in production**. If `NODE_ENV === 'production'` and `DEV_MODE === 'true'`, the application refuses to start and throws a configuration error.

### 4. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Entra & Exchange Online Configuration

To connect the application to your live Microsoft 365 mailbox, the Microsoft 365 Administrator must provide the following configuration:

### Configuration Values Required by the Administrator

| Variable | Description | Example |
| :--- | :--- | :--- |
| `AZURE_TENANT_ID` | Directory (tenant) ID GUID from Microsoft Entra | `e8371234-abcd-4f32-9012-123456789abc` |
| `AZURE_CLIENT_ID` | Application (client) ID GUID from App Registrations | `a7489012-bcde-4321-8901-abcdef123456` |
| `AZURE_CLIENT_SECRET` | Client Secret Value from Certificates & Secrets | `xyZ8Q~...` |
| `OUTLOOK_MAILBOX_UPN` | Target Exchange Online mailbox UPN or Primary SMTP | `shared-inbox@yourdomain.onmicrosoft.com` |
| `AUTH_ALLOWED_USER_OBJECT_IDS` | Comma-separated Entra User Object ID GUIDs allowed to access this app | `11111111-2222-3333-4444-555555555555` |
| `AUTH_SECRET` | 32+ character random secret for session encryption | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `AUTH_REDIRECT_URI` | Application redirect URI registered in Microsoft Entra | `https://inbox-explorer.yourdomain.com/api/auth/callback` |
| `DEV_MODE` | Must be `false` in production | `false` |

### Setup Guides
1. **[Microsoft Entra Setup Guide](docs/ENTRA_SETUP.md)**: Details app registration, application permissions (`Mail.Read`), and admin consent.
2. **[Exchange Online RBAC & Scoping Guide](docs/EXCHANGE_RBAC.md)**: Crucial instructions for scoping `Mail.Read` to the designated mailbox using `New-ApplicationAccessPolicy` or Exchange Online RBAC for Applications.

---

## Testing

The test suite runs against mocked Microsoft Graph and MSAL responses. **Never requires live credentials.**

Run tests once:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

### Test Coverage Highlights (25 Tests Passing)
- **HTML Sanitization & Anti-XSS**: Verifies removal of `<script>`, `onerror`, `onload`, `javascript:` links, forms, and iframes, while preserving table layouts and applying `target="_blank" rel="noopener noreferrer"`.
- **MSAL Client Credentials**: Tests token acquisition with `https://graph.microsoft.com/.default` scope, in-memory caching singleton, and asserts client secrets are never exposed in error traces.
- **Graph Client Resilience**: Tests HTTP 429 rate limit backoff via `Retry-After`, transient 503 exponential retries, 401 Unauthorized handling, 403 Forbidden with RBAC guidance, and 404 Mailbox Not Found.
- **Mail Service Queries & Pagination**: Asserts minimal `$select` fields (`INBOX_SELECT_FIELDS`), `$search` vs `$orderby` rules, OData filter generation, and strict `@odata.nextLink` preservation.
- **Authentication & User Allowlist**: Enforces `AUTH_ALLOWED_USER_OBJECT_IDS` verification and rejection of unauthorized users.

---

## Production Build & Deployment

Build the optimized production bundle:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

### Production Security Checklist
- [x] Ensure `DEV_MODE=false`.
- [x] Configure strict Content Security Policy (configured in `next.config.mjs`).
- [x] Ensure `AZURE_CLIENT_SECRET` and `AUTH_SECRET` are supplied via a secure secrets manager (e.g., Azure Key Vault, AWS Secrets Manager, or Kubernetes Secrets).
- [x] Ensure `OUTLOOK_MAILBOX_UPN` is scoped via Exchange Online `New-ApplicationAccessPolicy` and verified with `Test-ApplicationAccessPolicy`.
- [x] Restrict web application access using `AUTH_ALLOWED_USER_OBJECT_IDS`.

