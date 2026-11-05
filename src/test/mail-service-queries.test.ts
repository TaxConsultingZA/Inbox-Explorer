import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MailService, INBOX_SELECT_FIELDS, clearMailCache } from '@/lib/graph/mail-service';
import { graphFetch } from '@/lib/graph/client';
import { appConfig } from '@/lib/config';

// Mock graphFetch
vi.mock('@/lib/graph/client', () => ({
  graphFetch: vi.fn(),
  GraphError: class GraphError extends Error {
    constructor(msg: string) {
      super(msg);
    }
  },
}));

describe('MailService Graph Queries & Integration', () => {
  beforeEach(() => {
    clearMailCache();
    vi.clearAllMocks();
    appConfig.isDevMode = false;
    appConfig.mailbox.targetUpn = 'target-shared@domain.com';
  });

  it('queries inbox with minimal $select fields and newest first ordering', async () => {
    const mockMessages = [
      { id: '1', subject: 'Subject 1', receivedDateTime: '2026-11-05T10:00:00Z', isRead: false },
    ];

    (graphFetch as any).mockResolvedValueOnce({
      value: mockMessages,
      '@odata.nextLink': 'https://graph.microsoft.com/v1.0/users/target-shared@domain.com/mailFolders/inbox/messages?$skip=30',
    });

    const result = await MailService.getInboxMessages({ top: 30 });

    expect(graphFetch).toHaveBeenCalledWith(
      expect.stringContaining(`$select=${INBOX_SELECT_FIELDS}`)
    );
    expect(graphFetch).toHaveBeenCalledWith(
      expect.stringContaining('$orderby=receivedDateTime desc')
    );
    expect(graphFetch).toHaveBeenCalledWith(
      expect.stringContaining('$top=30')
    );
    expect(result.value).toEqual(mockMessages);
    expect(result.nextLink).toBeDefined();
  });

  it('properly encodes $search and removes $orderby to adhere to Graph query rules', async () => {
    (graphFetch as any).mockResolvedValueOnce({ value: [] });

    await MailService.getInboxMessages({ search: 'quarterly review "urgent"' });

    expect(graphFetch).toHaveBeenCalledWith(
      expect.stringContaining('$search="quarterly review \\"urgent\\""')
    );
    // Graph rejects $orderby when $search is specified
    expect(graphFetch).not.toHaveBeenCalledWith(
      expect.stringContaining('$orderby')
    );
  });

  it('constructs OData filters correctly for sender, read status, and attachments', async () => {
    (graphFetch as any).mockResolvedValueOnce({ value: [] });

    await MailService.getInboxMessages({
      isRead: false,
      hasAttachments: true,
      from: "alice@contoso.com",
    });

    const callArg = (graphFetch as any).mock.calls[0][0];
    const decodedUrl = decodeURIComponent(callArg);

    expect(decodedUrl).toContain("isRead eq false");
    expect(decodedUrl).toContain("hasAttachments eq true");
    expect(decodedUrl).toContain("from/emailAddress/address eq 'alice@contoso.com'");
  });

  it('strictly respects @odata.nextLink without manually manipulating paging tokens', async () => {
    const trustedNextLink =
      'https://graph.microsoft.com/v1.0/users/target-shared@domain.com/mailFolders/inbox/messages?$skiptoken=X%2712345%27';

    (graphFetch as any).mockResolvedValueOnce({
      value: [{ id: 'page2-msg', subject: 'Next Page' }],
    });

    const result = await MailService.getInboxMessages({ nextLink: trustedNextLink });

    expect(graphFetch).toHaveBeenCalledWith(trustedNextLink);
    expect(result.value[0].id).toBe('page2-msg');
  });

  it('fetches full message details with sanitized HTML body', async () => {
    const dirtyHtml = '<p>Test Message</p><script>alert("xss")</script>';

    (graphFetch as any).mockResolvedValueOnce({
      id: 'msg-99',
      subject: 'Security Alert',
      body: { contentType: 'html', content: dirtyHtml },
    });

    const message = await MailService.getMessageDetails('msg-99');

    expect(message.id).toBe('msg-99');
    expect(message.body?.content).toContain('<p>Test Message</p>');
    expect(message.body?.content).not.toContain('<script');
  });
});

