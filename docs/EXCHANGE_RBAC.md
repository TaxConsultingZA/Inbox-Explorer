# Exchange Online Scoping & RBAC for Applications Guide

This document describes how to restrict the Microsoft Entra application's `Mail.Read` application permissions strictly to designated Exchange Online mailboxes using **Exchange Online RBAC for Applications** and **Application Access Policies**.

---

## 1. Critical Security Architecture: Permission Additivity Warning

> [!CAUTION]
> ### CRITICAL SECURITY WARNING: PERMISSION GRANTS ARE ADDITIVE
> In Microsoft Entra and Exchange Online, permissions are strictly additive:
> - If an Entra application registration has been granted tenant-wide `Mail.Read` without restriction, the application has read access to **every single mailbox in the entire tenant**.
> - **Exchange Online RBAC for Applications and Application Access Policies do NOT override broad Entra grants if configured improperly.** If broad access was granted at the Entra level, adding a scoped policy alongside an unrestricted grant will NOT restrict access to other mailboxes.
> - **NEVER** instruct administrators to combine broad Entra `Mail.Read` with scoped Exchange RBAC as a "defense in depth" solution. Instead, you MUST ensure that mailbox access is strictly governed and audited by Exchange application policies.

---

## 2. Prerequisites

1. **Exchange Online Mailbox Exists**:
   The target mailbox specified in `OUTLOOK_MAILBOX_UPN` (e.g. `shared-inbox@yourdomain.onmicrosoft.com`) must exist as a valid user mailbox or shared mailbox in Exchange Online. It cannot be an on-premises mailbox, an alias without an Exchange recipient object, or an external contact.
2. **Exchange Online PowerShell Module**:
   Install the official PowerShell module:
   ```powershell
   Install-Module -Name ExchangeOnlineManagement -Scope CurrentUser
   ```
3. **Exchange Administrator Credentials**:
   You must be assigned the **Exchange Administrator** or **Global Administrator** role in Microsoft 365.

---

## 3. Scoping Method A: Exchange Online Application Access Policy (Recommended)

Application Access Policies restrict an app-only client (`AppId`) to an authorized mail-enabled security group or specific mailbox.

### Step 1: Connect to Exchange Online PowerShell
```powershell
Connect-ExchangeOnline -UserPrincipalName admin@yourdomain.onmicrosoft.com
```

### Step 2: Create a Mail-Enabled Security Group for Allowed Mailboxes
Create a security group containing the mailboxes the application is allowed to read:
```powershell
New-DistributionGroup -Name "Allowed-Inbox-Explorer-Mailboxes" `
  -Type "Security" `
  -PrimarySmtpAddress "allowed-inbox-explorer@yourdomain.onmicrosoft.com"
```

### Step 3: Add the Target Mailbox to the Group
```powershell
Add-DistributionGroupMember -Identity "Allowed-Inbox-Explorer-Mailboxes" `
  -Member "shared-inbox@yourdomain.onmicrosoft.com"
```

### Step 4: Create the Application Access Policy
Bind your Microsoft Entra Application ID (`AZURE_CLIENT_ID`) to the security group:
```powershell
New-ApplicationAccessPolicy `
  -AppId "YOUR_AZURE_CLIENT_ID_GUID" `
  -PolicyScopeGroupId "allowed-inbox-explorer@yourdomain.onmicrosoft.com" `
  -AccessCheckType "Mailbox" `
  -Description "Restricts Inbox Explorer app to designated shared mailboxes only."
```

### Step 5: Test and Verify the Policy
Exchange Online provides the `Test-ApplicationAccessPolicy` cmdlet to verify enforcement before deploying the app:

#### Test 1: Verify Access is GRANTED to the target mailbox
```powershell
Test-ApplicationAccessPolicy `
  -AppId "YOUR_AZURE_CLIENT_ID_GUID" `
  -Identity "shared-inbox@yourdomain.onmicrosoft.com"
```
**Expected Output:**
```
AppId               : YOUR_AZURE_CLIENT_ID_GUID
Mailbox             : shared-inbox@yourdomain.onmicrosoft.com
AccessCheckResult   : Granted
```

#### Test 2: Verify Access is DENIED to other company mailboxes
```powershell
Test-ApplicationAccessPolicy `
  -AppId "YOUR_AZURE_CLIENT_ID_GUID" `
  -Identity "ceo@yourdomain.onmicrosoft.com"
```
**Expected Output:**
```
AppId               : YOUR_AZURE_CLIENT_ID_GUID
Mailbox             : ceo@yourdomain.onmicrosoft.com
AccessCheckResult   : Denied
```

> [!NOTE]
> Changes to Application Access Policies can take up to 30 minutes to replicate across all Exchange Online directory caches globally.

---

## 4. Scoping Method B: Exchange Online RBAC for Applications (Modern Role Assignments)

Exchange Online also supports granular service principal RBAC for modern workload identities:

### Step 1: Create the Exchange Service Principal
Register the Entra application inside Exchange Online directory:
```powershell
New-ServicePrincipal -AppId "YOUR_AZURE_CLIENT_ID_GUID" `
  -ObjectId "YOUR_ENTRA_ENTERPRISE_APP_OBJECT_ID" `
  -DisplayName "Inbox-Explorer-ServicePrincipal"
```

### Step 2: Create a Management Scope
Define a custom scope targeting the specific mailbox:
```powershell
New-ManagementScope -Name "InboxExplorerMailboxScope" `
  -RecipientRestrictionFilter "UserPrincipalName -eq 'shared-inbox@yourdomain.onmicrosoft.com'"
```

### Step 3: Assign Scoped Application Role
Assign the `Application Mail.Read` role restricted to the scope:
```powershell
New-ManagementRoleAssignment `
  -Name "InboxExplorer_MailRead_Assignment" `
  -Role "Application Mail.Read" `
  -App "YOUR_AZURE_CLIENT_ID_GUID" `
  -CustomRecipientWriteScope "InboxExplorerMailboxScope"
```

---

## 5. Summary of Diagnostic Checks

If the application returns `403 Forbidden` (`AccessDenied`) with `Ensure Mail.Read has received Admin Consent and Exchange Online RBAC for Applications allows this mailbox`:

1. Run `Test-ApplicationAccessPolicy` as shown above to confirm `AccessCheckResult : Granted`.
2. Ensure the mailbox has a valid Exchange Online license and is active.
3. Ensure the mailbox address in `OUTLOOK_MAILBOX_UPN` exactly matches the Primary SMTP or UPN in Exchange.
4. Allow up to 30 minutes for newly created policies to propagate.

