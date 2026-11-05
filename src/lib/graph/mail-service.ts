import { appConfig } from '../config';
import { graphFetch } from './client';
import { sanitizeEmailHtml } from '../security/sanitize';
import {
  GraphMessage,
  GraphAttachment,
  InboxQueryParams,
  InboxResponse,
  ConnectionStatus,
} from '@/types/mail';
import { MOCK_MESSAGES, MOCK_ATTACHMENTS } from './mock-data';

// Minimal fields required for the inbox list view as specified in Section 3
export const INBOX_SELECT_FIELDS = [
  'id',
  'subject',
  'sender',
  'from',
  'toRecipients',
  'receivedDateTime',
  'isRead',
  'hasAttachments',
  'importance',
  'bodyPreview',
  'conversationId',
  'webLink',
].join(',');

// Full fields requested only when reading a single message
export const MESSAGE_DETAIL_SELECT_FIELDS = [
  'id',
  'subject',
  'sender',
  'from',
  'toRecipients',
  'ccRecipients',
  'bccRecipients',
  'receivedDateTime',
  'sentDateTime',
  'hasAttachments',
  'importance',
  'bodyPreview',
  'body',
  'conversationId',
  'webLink',
  'internetMessageHeaders',
].join(',');

// Simple short-lived in-memory cache to prevent pounding Graph API during rapid UI transitions
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const cacheStore = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string): T | null {
  const entry = cacheStore.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data as T;
  }
  cacheStore.delete(key);
  return null;
}

function setCache<T>(key: string, data: T, ttlSeconds = 20): void {
  // Purge old keys if cache grows large
  if (cacheStore.size > 200) {
    const now = Date.now();
    cacheStore.forEach((v, k) => {
      if (v.expiresAt <= now) cacheStore.delete(k);
    });
  }
  cacheStore.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export function clearMailCache(): void {
  cacheStore.clear();
}

/**
 * Escapes user input to safely construct OData string literals.
 */
function escapeODataString(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Escapes user input for Microsoft Graph $search queries.
 */
function escapeSearchTerm(term: string): string {
  return term.replace(/[\\"]/g, '\\$&').trim();
}

/**
 * Mailbox Service
 * Encapsulates all read-only interactions with Microsoft Exchange Online via Graph v1.0.
 */
export const MailService = {
  /**
   * Retrieves paginated messages from the target mailbox's Inbox.
   */
  async getInboxMessages(params: InboxQueryParams = {}): Promise<InboxResponse> {
    const targetMailbox = appConfig.mailbox.targetUpn;

    // DEV MODE: Fallback to mock data if in local dev mode
    if (appConfig.isDevMode) {
      return this._getMockInboxMessages(params);
    }

    // If a full @odata.nextLink is provided, navigate directly to it without rebuilding query
    if (params.nextLink) {
      // Validate that the nextLink is a legitimate Microsoft Graph URL to prevent SSRF
      if (!params.nextLink.startsWith('https://graph.microsoft.com/v1.0/')) {
        throw new Error('Invalid nextLink URL provided. Must be a trusted Microsoft Graph endpoint.');
      }

      const cached = getCached<InboxResponse>(params.nextLink);
      if (cached) return cached;

      const graphData = await graphFetch<{ value: GraphMessage[]; '@odata.nextLink'?: string }>(
        params.nextLink
      );

      const response: InboxResponse = {
        value: graphData.value || [],
        nextLink: graphData['@odata.nextLink'],
        metadata: {
          targetMailbox,
          searchApplied: false,
          filtersApplied: [],
          isDevMode: false,
          timestamp: new Date().toISOString(),
        },
      };

      setCache(params.nextLink, response, 15);
      return response;
    }

    const pageSize = Math.min(50, Math.max(5, params.top || appConfig.graph.defaultPageSize));
    const queryParts: string[] = [`$select=${INBOX_SELECT_FIELDS}`, `$top=${pageSize}`];

    const filters: string[] = [];
    const filtersApplied: string[] = [];

    // Filter by read status
    if (params.isRead !== undefined) {
      filters.push(`isRead eq ${params.isRead ? 'true' : 'false'}`);
      filtersApplied.push(`isRead:${params.isRead}`);
    }

    // Filter by attachment presence
    if (params.hasAttachments !== undefined) {
      filters.push(`hasAttachments eq ${params.hasAttachments ? 'true' : 'false'}`);
      filtersApplied.push(`hasAttachments:${params.hasAttachments}`);
    }

    // Filter by sender address
    if (params.from && params.from.trim()) {
      const safeFrom = escapeODataString(params.from.trim());
      filters.push(`from/emailAddress/address eq '${safeFrom}'`);
      filtersApplied.push(`from:${params.from}`);
    }

    // Filter by date range (receivedDateTime)
    if (params.startDate) {
      const safeStart = new Date(params.startDate).toISOString();
      filters.push(`receivedDateTime ge ${safeStart}`);
      filtersApplied.push(`startDate:${params.startDate}`);
    }
    if (params.endDate) {
      const safeEnd = new Date(params.endDate).toISOString();
      filters.push(`receivedDateTime le ${safeEnd}`);
      filtersApplied.push(`endDate:${params.endDate}`);
    }

    let searchApplied = false;

    // Search Handling
    // In Microsoft Graph:
    // When $search is used, Graph searches across sender, subject, and body.
    // NOTE: Graph orders search results by relevance and will fail if $orderby is supplied alongside $search.
    if (params.search && params.search.trim()) {
      const safeSearch = escapeSearchTerm(params.search);
      queryParts.push(`$search="${safeSearch}"`);
      searchApplied = true;
    } else {
      // If no search is applied, order by newest received first
      queryParts.push('$orderby=receivedDateTime desc');
    }

    if (filters.length > 0) {
      queryParts.push(`$filter=${encodeURIComponent(filters.join(' and '))}`);
    }

    const queryString = queryParts.join('&');
    const endpoint = `/users/${encodeURIComponent(targetMailbox)}/mailFolders/inbox/messages?${queryString}`;

    const cacheKey = `inbox:${endpoint}`;
    const cached = getCached<InboxResponse>(cacheKey);
    if (cached) return cached;

    const graphData = await graphFetch<{ value: GraphMessage[]; '@odata.nextLink'?: string }>(endpoint);

    const response: InboxResponse = {
      value: graphData.value || [],
      nextLink: graphData['@odata.nextLink'],
      metadata: {
        targetMailbox,
        searchApplied,
        filtersApplied,
        isDevMode: false,
        timestamp: new Date().toISOString(),
      },
    };

    setCache(cacheKey, response, 15);
    return response;
  },

  /**
   * Fetches full message details (including sanitized body and headers) for a specific email.
   */
  async getMessageDetails(messageId: string): Promise<GraphMessage> {
    const targetMailbox = appConfig.mailbox.targetUpn;

    if (!messageId || typeof messageId !== 'string') {
      throw new Error('Valid messageId is required.');
    }

    // DEV MODE: Mock email details
    if (appConfig.isDevMode) {
      const found = MOCK_MESSAGES.find((m) => m.id === messageId);
      if (!found) {
        throw new Error(`Message '${messageId}' not found in mock mailbox.`);
      }
      return {
        ...found,
        body: found.body
          ? {
              contentType: found.body.contentType,
              content: sanitizeEmailHtml(found.body.content),
            }
          : undefined,
      };
    }

    const cacheKey = `msg:${messageId}`;
    const cached = getCached<GraphMessage>(cacheKey);
    if (cached) return cached;

    const endpoint = `/users/${encodeURIComponent(targetMailbox)}/messages/${encodeURIComponent(messageId)}?$select=${MESSAGE_DETAIL_SELECT_FIELDS}`;
    const rawMessage = await graphFetch<GraphMessage>(endpoint);

    // Sanitize HTML body if present
    const sanitizedMessage: GraphMessage = {
      ...rawMessage,
      body: rawMessage.body
        ? {
            contentType: rawMessage.body.contentType,
            content:
              rawMessage.body.contentType === 'html'
                ? sanitizeEmailHtml(rawMessage.body.content)
                : rawMessage.body.content,
          }
        : undefined,
    };

    setCache(cacheKey, sanitizedMessage, 30);
    return sanitizedMessage;
  },

  /**
   * Retrieves metadata list of attachments for a given message.
   */
  async getMessageAttachments(messageId: string): Promise<GraphAttachment[]> {
    const targetMailbox = appConfig.mailbox.targetUpn;

    if (!messageId) {
      throw new Error('Valid messageId is required.');
    }

    if (appConfig.isDevMode) {
      const attachments = MOCK_ATTACHMENTS[messageId] || [];
      // Strip raw content bytes from list view for lightweight metadata transfer
      return attachments.map(({ contentBytes, ...meta }) => meta as GraphAttachment);
    }

    const cacheKey = `att-meta:${messageId}`;
    const cached = getCached<GraphAttachment[]>(cacheKey);
    if (cached) return cached;

    const endpoint = `/users/${encodeURIComponent(targetMailbox)}/messages/${encodeURIComponent(messageId)}/attachments?$select=id,name,contentType,size,isInline,lastModifiedDateTime`;
    const result = await graphFetch<{ value: GraphAttachment[] }>(endpoint);

    const attachments = result.value || [];
    setCache(cacheKey, attachments, 60);
    return attachments;
  },

  /**
   * Retrieves content of a specific attachment for on-demand safe downloading.
   */
  async getAttachmentContent(messageId: string, attachmentId: string): Promise<GraphAttachment> {
    const targetMailbox = appConfig.mailbox.targetUpn;

    if (!messageId || !attachmentId) {
      throw new Error('Both messageId and attachmentId are required.');
    }

    if (appConfig.isDevMode) {
      const list = MOCK_ATTACHMENTS[messageId] || [];
      const item = list.find((a) => a.id === attachmentId);
      if (!item) {
        throw new Error(`Attachment '${attachmentId}' not found.`);
      }
      return item;
    }

    const endpoint = `/users/${encodeURIComponent(targetMailbox)}/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}`;
    const attachment = await graphFetch<GraphAttachment>(endpoint);
    return attachment;
  },

  /**
   * Diagnostic health check of Entra credentials & Exchange mailbox reachability.
   */
  async checkConnectionStatus(): Promise<ConnectionStatus> {
    const { tenantId, clientId, clientSecret, hasValidConfig } = appConfig.azure;
    const targetMailbox = appConfig.mailbox.targetUpn;

    if (appConfig.isDevMode) {
      return {
        status: 'dev_mock',
        tenantIdConfigured: Boolean(tenantId),
        clientIdConfigured: Boolean(clientId),
        clientSecretConfigured: Boolean(clientSecret),
        mailboxUpnConfigured: Boolean(targetMailbox),
        mailboxUpn: targetMailbox,
        tokenAcquisitionSuccessful: true,
        mailboxReachable: true,
        messageCount: MOCK_MESSAGES.length,
        errorMessage: undefined,
        timestamp: new Date().toISOString(),
        mode: 'dev_mock',
      };
    }

    const baseStatus: ConnectionStatus = {
      status: 'unconfigured',
      tenantIdConfigured: Boolean(tenantId && !tenantId.includes('00000000')),
      clientIdConfigured: Boolean(clientId && !clientId.includes('00000000')),
      clientSecretConfigured: Boolean(clientSecret && !clientSecret.includes('your_entra')),
      mailboxUpnConfigured: Boolean(targetMailbox && !targetMailbox.includes('example.com')),
      mailboxUpn: targetMailbox,
      tokenAcquisitionSuccessful: false,
      mailboxReachable: false,
      timestamp: new Date().toISOString(),
      mode: 'entra_live',
    };

    if (!hasValidConfig) {
      baseStatus.errorMessage = 'Microsoft Entra configuration is incomplete or contains placeholder values.';
      return baseStatus;
    }

    try {
      // Test 1: Probe Token Acquisition & Mailbox Inbox Folder
      const endpoint = `/users/${encodeURIComponent(targetMailbox)}/mailFolders/inbox?$select=id,displayName,totalItemCount,unreadItemCount`;
      const inboxFolder = await graphFetch<{ totalItemCount?: number; unreadItemCount?: number }>(endpoint, {
        timeoutMs: 8000,
        maxRetries: 1,
      });

      baseStatus.status = 'connected';
      baseStatus.tokenAcquisitionSuccessful = true;
      baseStatus.mailboxReachable = true;
      baseStatus.messageCount = inboxFolder.totalItemCount;
      return baseStatus;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      baseStatus.status = 'error';
      baseStatus.errorMessage = msg;
      baseStatus.tokenAcquisitionSuccessful = !msg.includes('Authentication with Microsoft Entra failed');
      baseStatus.mailboxReachable = false;
      return baseStatus;
    }
  },

  /**
   * Delta Query Stubs (for future synchronization service expansion, Section 9).
   * Supports retrieving only changes since the last delta token without full mailbox rescan.
   */
  async getInboxDelta(deltaLinkOrToken?: string): Promise<{ value: GraphMessage[]; deltaLink?: string; nextLink?: string }> {
    const targetMailbox = appConfig.mailbox.targetUpn;
    const url = deltaLinkOrToken || `/users/${encodeURIComponent(targetMailbox)}/mailFolders/inbox/messages/delta?$select=${INBOX_SELECT_FIELDS}`;
    return graphFetch(url);
  },

  /**
   * Internal mock inbox filter/search engine for local development.
   */
  _getMockInboxMessages(params: InboxQueryParams): InboxResponse {
    let filtered = [...MOCK_MESSAGES];

    if (params.isRead !== undefined) {
      filtered = filtered.filter((m) => m.isRead === params.isRead);
    }

    if (params.hasAttachments !== undefined) {
      filtered = filtered.filter((m) => m.hasAttachments === params.hasAttachments);
    }

    if (params.from && params.from.trim()) {
      const f = params.from.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.from?.emailAddress.address.toLowerCase().includes(f) ||
          m.from?.emailAddress.name?.toLowerCase().includes(f)
      );
    }

    if (params.search && params.search.trim()) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.subject.toLowerCase().includes(s) ||
          m.bodyPreview?.toLowerCase().includes(s) ||
          m.from?.emailAddress.name?.toLowerCase().includes(s) ||
          m.from?.emailAddress.address.toLowerCase().includes(s)
      );
    }

    // Default newest first
    filtered.sort((a, b) => new Date(b.receivedDateTime).getTime() - new Date(a.receivedDateTime).getTime());

    const pageSize = params.top || 30;
    const skip = params.skip || 0;
    const paginated = filtered.slice(skip, skip + pageSize);
    const hasMore = skip + pageSize < filtered.length;

    return {
      value: paginated,
      nextLink: hasMore ? `https://graph.microsoft.com/v1.0/mock-next-link?skip=${skip + pageSize}` : undefined,
      totalCount: filtered.length,
      metadata: {
        targetMailbox: appConfig.mailbox.targetUpn,
        searchApplied: Boolean(params.search),
        filtersApplied: [
          params.isRead !== undefined ? `isRead:${params.isRead}` : '',
          params.hasAttachments !== undefined ? `hasAttachments:${params.hasAttachments}` : '',
        ].filter(Boolean),
        isDevMode: true,
        timestamp: new Date().toISOString(),
      },
    };
  },
};
