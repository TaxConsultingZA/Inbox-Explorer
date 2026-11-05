import { GraphMessage, GraphAttachment } from '@/types/mail';

export const MOCK_MESSAGES: GraphMessage[] = [
  {
    id: 'msg-001',
    conversationId: 'conv-sec-9812',
    subject: '[CRITICAL] P1 Incident: Database Cluster Latency Anomaly Detected in US-East',
    bodyPreview: 'Automated Site Reliability Alert: Database replica lag exceeded 2500ms threshold at 08:42 UTC. On-call engineering team has been paged.',
    receivedDateTime: new Date(Date.now() - 1000 * 60 * 18).toISOString(), // 18 mins ago
    sentDateTime: new Date(Date.now() - 1000 * 60 * 19).toISOString(),
    hasAttachments: true,
    isRead: false,
    importance: 'high',
    webLink: 'https://outlook.office.com/mail/id/msg-001',
    from: {
      emailAddress: {
        name: 'Site Reliability Engineering Alerting',
        address: 'sre-alerts@contoso.onmicrosoft.com',
      },
    },
    sender: {
      emailAddress: {
        name: 'Site Reliability Engineering Alerting',
        address: 'sre-alerts@contoso.onmicrosoft.com',
      },
    },
    toRecipients: [
      {
        emailAddress: {
          name: 'IT Operations Shared Inbox',
          address: 'shared-inbox@contoso.onmicrosoft.com',
        },
      },
    ],
    ccRecipients: [
      {
        emailAddress: {
          name: 'Jane Doe (VP Infrastructure)',
          address: 'jane.doe@contoso.onmicrosoft.com',
        },
      },
    ],
    body: {
      contentType: 'html',
      content: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
          <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
            <h2 style="margin: 0 0 8px 0; color: #991b1b; font-size: 18px;">CRITICAL SEVERITY INCIDENT NOTICE</h2>
            <p style="margin: 0; color: #b91c1c; font-size: 14px;">PagerDuty Incident #9812 | Service: Core Transaction Engine | Region: us-east-1</p>
          </div>
          
          <p>Hello Operations Team,</p>
          <p>At <strong>08:42:15 UTC</strong>, automated telemetry detected cross-region replication lag exceeding standard SLA bounds (threshold: 500ms, current peak: 2,540ms).</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
            <thead>
              <tr style="background-color: #f1f5f9; text-align: left;">
                <th style="padding: 10px; border-bottom: 2px solid #cbd5e1;">Metric</th>
                <th style="padding: 10px; border-bottom: 2px solid #cbd5e1;">Observed Value</th>
                <th style="padding: 10px; border-bottom: 2px solid #cbd5e1;">SLA Threshold</th>
                <th style="padding: 10px; border-bottom: 2px solid #cbd5e1;">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Replication Delay</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #dc2626;">2,540 ms</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">&lt; 500 ms</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><span style="background-color: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 9999px; font-size: 12px;">CRITICAL</span></td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Query Timeout Rate</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #d97706;">4.2%</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">&lt; 0.1%</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><span style="background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 9999px; font-size: 12px;">WARNING</span></td>
              </tr>
            </tbody>
          </table>

          <p><strong>Action Items Underway:</strong></p>
          <ol style="padding-left: 20px;">
            <li>Traffic rerouting to us-east-2 secondary failover cluster initiated.</li>
            <li>Diagnostics dump attached for root-cause inspection.</li>
            <li>War room convened on Teams Channel: <em>#incident-9812-response</em>.</li>
          </ol>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #64748b;">This is an automated notification dispatched to the Exchange Online Shared Mailbox.</p>
        </div>
      `,
    },
    internetMessageHeaders: [
      { name: 'X-Incident-Id', value: 'INC-9812-US-EAST' },
      { name: 'X-Priority', value: '1' },
      { name: 'X-Mailer', value: 'Contoso Incident Bot 4.2' },
    ],
  },
  {
    id: 'msg-002',
    conversationId: 'conv-sec-9812',
    subject: 'RE: [CRITICAL] P1 Incident: Database Cluster Latency Anomaly Detected in US-East',
    bodyPreview: 'Quick update: Primary cluster connection pool exhaustion resolved. Replication lag dropped back to 38ms. Monitoring for stability.',
    receivedDateTime: new Date(Date.now() - 1000 * 60 * 4).toISOString(), // 4 mins ago
    sentDateTime: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    hasAttachments: false,
    isRead: false,
    importance: 'normal',
    webLink: 'https://outlook.office.com/mail/id/msg-002',
    from: {
      emailAddress: {
        name: 'Alex Chen (Staff Infrastructure Engineer)',
        address: 'alex.chen@contoso.onmicrosoft.com',
      },
    },
    sender: {
      emailAddress: {
        name: 'Alex Chen',
        address: 'alex.chen@contoso.onmicrosoft.com',
      },
    },
    toRecipients: [
      {
        emailAddress: {
          name: 'IT Operations Shared Inbox',
          address: 'shared-inbox@contoso.onmicrosoft.com',
        },
      },
    ],
    body: {
      contentType: 'html',
      content: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
          <p>Hi Team,</p>
          <p>We identified a rogue background ETL job that opened 1,200 unclosed connections on the primary database instance. We terminated the orphaned processes and scaled connection pool workers.</p>
          <p>Replication lag is down to <strong>38ms</strong> and error rates are back to 0.00%. We will publish the RCA document by 14:00 UTC.</p>
          <p>Thanks,<br/><strong>Alex Chen</strong><br/>Staff Infrastructure Engineer | Contoso Cloud Operations</p>
        </div>
      `,
    },
  },
  {
    id: 'msg-003',
    conversationId: 'conv-audit-2026',
    subject: 'Quarterly SOC2 Type II & ISO 27001 Compliance Audit Evidence Request',
    bodyPreview: 'Dear Exchange Mailbox Administrators, KPMG auditors have initiated the Q4 compliance sampling. Please review the attached evidence checklist.',
    receivedDateTime: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    sentDateTime: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    hasAttachments: true,
    isRead: true,
    importance: 'normal',
    webLink: 'https://outlook.office.com/mail/id/msg-003',
    from: {
      emailAddress: {
        name: 'Compliance & Governance Office',
        address: 'compliance@contoso.onmicrosoft.com',
      },
    },
    sender: {
      emailAddress: {
        name: 'Sarah Jenkins',
        address: 'sarah.jenkins@contoso.onmicrosoft.com',
      },
    },
    toRecipients: [
      {
        emailAddress: {
          name: 'IT Operations Shared Inbox',
          address: 'shared-inbox@contoso.onmicrosoft.com',
        },
      },
    ],
    body: {
      contentType: 'html',
      content: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
          <p>Dear System Custodians,</p>
          <p>As part of our annual SOC2 Type II and ISO 27001 surveillance review, external auditors require documentation regarding access control policies for all automated service principals accessing Exchange Online mailboxes via Microsoft Graph.</p>
          <p>Specifically, please confirm:</p>
          <ul>
            <li>Application Access Policies (RBAC for Applications) restricting application permissions strictly to designated mailboxes.</li>
            <li>Credential rotation log for Entra application client secrets within the last 90 days.</li>
            <li>Zero interactive logons to automated shared mailboxes.</li>
          </ul>
          <p>Please find the audit questionnaire and scope matrix attached.</p>
          <p>Best regards,<br/><strong>Sarah Jenkins</strong><br/>Head of Enterprise Compliance</p>
        </div>
      `,
    },
  },
  {
    id: 'msg-004',
    conversationId: 'conv-azure-announcement',
    subject: 'Action Required: Microsoft Graph API Deprecation Notice for Legacy Exchange Online Protocols',
    bodyPreview: 'Reminder: Basic authentication retirements and TLS 1.2 enforcement deadline approaching for all Exchange tenant applications.',
    receivedDateTime: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // Yesterday
    sentDateTime: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    hasAttachments: false,
    isRead: true,
    importance: 'high',
    webLink: 'https://outlook.office.com/mail/id/msg-004',
    from: {
      emailAddress: {
        name: 'Microsoft 365 Message Center',
        address: 'o365mc@microsoft.com',
      },
    },
    sender: {
      emailAddress: {
        name: 'Microsoft 365 Message Center',
        address: 'o365mc@microsoft.com',
      },
    },
    toRecipients: [
      {
        emailAddress: {
          name: 'Exchange Administrator',
          address: 'shared-inbox@contoso.onmicrosoft.com',
        },
      },
    ],
    body: {
      contentType: 'html',
      content: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
          <h3 style="color: #0f6cbd;">Major Update: Exchange Online Modern Authentication Transition</h3>
          <p>Tenant ID: <code>contoso-enterprise-guid</code></p>
          <p>This is a formal advisory that all custom enterprise applications interfacing with Exchange mailboxes must utilize Microsoft Graph v1.0 and OAuth 2.0 Client Credentials with scoped Application Access Policies.</p>
          <p>Legacy Exchange Web Services (EWS) basic authentication endpoints are permanently turned off. Ensure your applications use <code>@azure/msal-node</code> or official SDKs.</p>
          <p>For more details, review the Microsoft Learn technical documentation on Exchange Online RBAC for Applications.</p>
        </div>
      `,
    },
  },
  {
    id: 'msg-005',
    conversationId: 'conv-security-advisory',
    subject: 'Security Advisory: Entra ID Conditional Access Policy Update for Application Workload Identities',
    bodyPreview: 'New Conditional Access policies for workload identities are now enforceable across all production tenants. Review impacts on daemon services.',
    receivedDateTime: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    sentDateTime: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    hasAttachments: true,
    isRead: true,
    importance: 'normal',
    webLink: 'https://outlook.office.com/mail/id/msg-005',
    from: {
      emailAddress: {
        name: 'Cybersecurity Operations Center',
        address: 'soc@contoso.onmicrosoft.com',
      },
    },
    sender: {
      emailAddress: {
        name: 'Marcus Vance (CISO)',
        address: 'marcus.vance@contoso.onmicrosoft.com',
      },
    },
    toRecipients: [
      {
        emailAddress: {
          name: 'IT Operations Shared Inbox',
          address: 'shared-inbox@contoso.onmicrosoft.com',
        },
      },
    ],
    body: {
      contentType: 'html',
      content: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
          <p>All IT Engineers and Architects,</p>
          <p>We are activating tenant-wide Conditional Access for Workload Identities next Monday. Any application service principal using client secrets must adhere to IP filtering rules and approved service boundaries.</p>
          <p>Attached is the Workload Identity hardening standard document.</p>
          <p>Regards,<br/>Marcus Vance | Chief Information Security Officer</p>
        </div>
      `,
    },
  },
];

export const MOCK_ATTACHMENTS: Record<string, GraphAttachment[]> = {
  'msg-001': [
    {
      id: 'att-001-diag',
      name: 'incident_9812_cluster_telemetry.json',
      contentType: 'application/json',
      size: 48291,
      isInline: false,
      lastModifiedDateTime: new Date().toISOString(),
      contentBytes: Buffer.from(JSON.stringify({
        incidentId: 'INC-9812',
        cluster: 'db-primary-useast1',
        replicationLagMs: 2540,
        unclosedConnections: 1204,
        sourceIp: '10.240.12.88',
        timestamp: new Date().toISOString(),
      }, null, 2)).toString('base64'),
    },
    {
      id: 'att-001-chart',
      name: 'replication_lag_spike_graph.png',
      contentType: 'image/png',
      size: 142050,
      isInline: false,
      lastModifiedDateTime: new Date().toISOString(),
      contentBytes: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64').toString('base64'),
    },
  ],
  'msg-003': [
    {
      id: 'att-003-checklist',
      name: 'Q4_SOC2_Exchange_RBAC_Checklist.pdf',
      contentType: 'application/pdf',
      size: 324108,
      isInline: false,
      lastModifiedDateTime: new Date().toISOString(),
      contentBytes: Buffer.from('%PDF-1.4 Mock PDF Content For SOC2 Compliance Audit Checklist').toString('base64'),
    },
  ],
  'msg-005': [
    {
      id: 'att-005-guide',
      name: 'Contoso_Workload_Identities_Security_Standard_v3.pdf',
      contentType: 'application/pdf',
      size: 512044,
      isInline: false,
      lastModifiedDateTime: new Date().toISOString(),
      contentBytes: Buffer.from('%PDF-1.4 Mock PDF Content For Workload Identity Security').toString('base64'),
    },
  ],
};

