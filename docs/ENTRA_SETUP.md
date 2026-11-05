# Microsoft Entra App Registration & Permission Setup Guide

This guide details the procedure for registering and configuring the application identity in **Microsoft Entra ID (formerly Azure Active Directory)** to enable secure, server-side, app-only communication with Microsoft Exchange Online via Microsoft Graph API v1.0.

---

## 1. Core Architecture: Delegated vs. Application Permissions

Understanding the difference between **Delegated** and **Application** permissions is critical for security:

| Feature | Delegated Permissions (`Mail.Read`) | Application Permissions (`Mail.Read`) |
| :--- | :--- | :--- |
| **Authentication Flow** | OAuth 2.0 Authorization Code Flow (on behalf of a signed-in user) | OAuth 2.0 Client Credentials Flow (daemon/service-to-service) |
| **User Presence** | Interactive user sign-in required | No interactive user sign-in to Exchange required |
| **Target Identity** | Restricted to the mailbox of the signed-in user | Accesses Exchange Online mailboxes as an enterprise service principal |
| **Consent Required** | User consent (or Admin consent if restricted by tenant policies) | **Mandatory Tenant Administrator Consent** |
| **Use Case in Inbox Explorer** | Not suitable for automated shared-mailbox reading | **Used by Inbox Explorer** (`@azure/msal-node`) to read the target mailbox |

### Why Administrator Consent is Mandatory
Application permissions grant access to data without a signed-in user interactively approving each session. Because an application with `Mail.Read` can potentially read enterprise communications, Microsoft Entra enforces that **only a Global Administrator or Privileged Role Administrator** can grant tenant-wide consent to application permissions.

---

## 2. Step-by-Step Microsoft Entra Registration

### Step 1: Register New Application
1. Navigate to the [Microsoft Entra Admin Center](https://entra.microsoft.com/) or Azure Portal.
2. Go to **Identity** > **Applications** > **App registrations**.
3. Select **+ New registration**.
4. Configure:
   - **Name**: `Inbox-Explorer-Exchange-Client` (or your organizational naming convention).
   - **Supported account types**: *Accounts in this organizational directory only (Single tenant)*.
   - **Redirect URI**: Web platform -> `http://localhost:3000/api/auth/callback` (or your production URL).
5. Click **Register**.

### Step 2: Note Down Application Identifiers
From the application's **Overview** blade, copy and save:
- **Application (client) ID**: Set as `AZURE_CLIENT_ID` in your `.env.local`.
- **Directory (tenant) ID**: Set as `AZURE_TENANT_ID` in your `.env.local`.

### Step 3: Create a Confidential Client Secret
1. Under **Manage**, select **Certificates & secrets**.
2. Select **+ New client secret**.
3. Description: `Inbox Explorer Daemon Credentials`.
4. Expiration: Choose a duration conforming to your company policy (e.g., 180 days or 365 days).
5. Click **Add**.
6. **IMMEDIATELY COPY THE SECRET VALUE** from the `Value` column.
   > [!IMPORTANT]
   > The secret value is displayed only once. If you navigate away, it will be masked permanently.
   > Set this value as `AZURE_CLIENT_SECRET` in your `.env.local`.
   > **NEVER** commit this value to Git or expose it to frontend client code.

### Step 4: Configure Microsoft Graph Application Permissions
1. Under **Manage**, select **API permissions**.
2. Click **+ Add a permission**.
3. Select **Microsoft Graph**.
4. Select **Application permissions** (NOT Delegated permissions).
5. Search for `Mail.Read` and check the checkbox.
6. Click **Add permissions**.

### Step 5: Grant Tenant Admin Consent
1. In the **API permissions** table, you will see `Mail.Read` with a warning stating *Not granted for `<Your Tenant>`*.
2. Click **Grant admin consent for `<Your Tenant>`**.
3. Confirm with **Yes**. The status will change to a green checkmark: *Granted for `<Your Tenant>`*.

---

## 3. Web Application User Authentication & Allowlist

To protect the web application interface from unauthorized internal users:
1. Locate the **Object ID** of each authorized administrator or auditor from **Microsoft Entra** > **Users**.
2. Set `AUTH_ALLOWED_USER_OBJECT_IDS` in `.env.local` as a comma-separated list of these GUIDs:
   ```env
   AUTH_ALLOWED_USER_OBJECT_IDS=00000000-1111-2222-3333-444444444444,55555555-6666-7777-8888-999999999999
   ```
3. Generate a cryptographic string for `AUTH_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

---

## 4. Next Step: Mandatory Exchange Online Mailbox Scoping

> [!WARNING]
> By default, granting `Mail.Read` application permissions in Entra ID allows the application to read **ALL** Exchange Online mailboxes across the entire tenant.
> **DO NOT stop here.** You MUST proceed to configure **Exchange Online RBAC for Applications** or **Application Access Policies** to lock this application strictly to the target mailbox (`OUTLOOK_MAILBOX_UPN`).
>
> Follow the detailed instructions in [EXCHANGE_RBAC.md](./EXCHANGE_RBAC.md).
