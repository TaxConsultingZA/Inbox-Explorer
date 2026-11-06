export interface EmailAddress {
  name?: string;
  address: string;
}

export interface Recipient {
  emailAddress: EmailAddress;
}

export interface ItemBody {
  contentType: 'text' | 'html';
  content: string;
}

export interface InternetMessageHeader {
  name: string;
  value: string;
}

export type MessageImportance = 'low' | 'normal' | 'high';

export interface GraphMessage {
  id: string;
  subject: string;
  bodyPreview?: string;
  receivedDateTime: string;
  sentDateTime?: string;
  hasAttachments: boolean;
  internetMessageId?: string;
  conversationId?: string;
  isRead: boolean;
  importance: MessageImportance;
  webLink?: string;
  sender?: Recipient;
  from?: Recipient;
  toRecipients?: Recipient[];
  ccRecipients?: Recipient[];
  bccRecipients?: Recipient[];
  body?: ItemBody;
  internetMessageHeaders?: InternetMessageHeader[];
}

export interface GraphAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  isInline: boolean;
  lastModifiedDateTime?: string;
  contentBytes?: string;
}

export interface InboxQueryParams {
  search?: string;
  subject?: string;
  searchScope?: 'all' | 'subject' | 'from' | 'body';
  isRead?: boolean;
  hasAttachments?: boolean;
  from?: string;
  startDate?: string;
  endDate?: string;
  top?: number;
  skip?: number;
  nextLink?: string;
}

export interface InboxResponse {
  value: GraphMessage[];
  nextLink?: string;
  totalCount?: number;
  metadata: {
    targetMailbox: string;
    searchApplied: boolean;
    filtersApplied: string[];
    isDevMode: boolean;
    safeguardBatchLimit: number;
    batchSize: number;
    timestamp: string;
  };
}

export interface ConnectionStatus {
  status: 'connected' | 'error' | 'unconfigured' | 'dev_mock';
  tenantIdConfigured: boolean;
  clientIdConfigured: boolean;
  clientSecretConfigured: boolean;
  mailboxUpnConfigured: boolean;
  mailboxUpn?: string;
  tokenAcquisitionSuccessful: boolean;
  mailboxReachable: boolean;
  messageCount?: number;
  errorMessage?: string;
  errorDetails?: string;
  timestamp: string;
  mode: 'entra_live' | 'dev_mock';
}

export interface UserSession {
  userObjectId: string;
  email: string;
  name: string;
  isAuthorized: boolean;
}

