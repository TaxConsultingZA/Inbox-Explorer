'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ExternalLink,
  Paperclip,
  Download,
  AlertCircle,
  FileCode,
  Printer,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Mail,
  User,
  Clock,
  Shield,
  FileText,
  Image as ImageIcon,
  Sun,
  Moon,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { GraphMessage, GraphAttachment } from '@/types/mail';
import { SanitizedEmailFrame } from './SanitizedEmailFrame';
import { HeadersModal } from './HeadersModal';

interface ReadingPaneProps {
  messageId?: string;
  onClose?: () => void;
}

// Microsoft 365 Persona Palette
const PERSONA_PALETTE = [
  'bg-[#0078d4]', // Fluent Blue
  'bg-[#107c41]', // Fluent Green
  'bg-[#d83b01]', // Fluent Orange
  'bg-[#8764b8]', // Fluent Purple
  'bg-[#038387]', // Fluent Teal
  'bg-[#c239b3]', // Fluent Magenta
  'bg-[#004e8c]', // Fluent Navy
  'bg-[#498205]', // Fluent Olive
  'bg-[#a4262c]', // Fluent Crimson
  'bg-[#5c2d91]', // Fluent Plum
];

function getPersonaColor(identifier: string): string {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PERSONA_PALETTE[Math.abs(hash) % PERSONA_PALETTE.length];
}

export function ReadingPane({ messageId, onClose }: ReadingPaneProps) {
  const [message, setMessage] = useState<GraphMessage | null>(null);
  const [attachments, setAttachments] = useState<GraphAttachment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isHeadersOpen, setIsHeadersOpen] = useState<boolean>(false);
  const [showRecipientDetails, setShowRecipientDetails] = useState<boolean>(false);
  const [contrastMode, setContrastMode] = useState<'white' | 'dark'>('white');

  useEffect(() => {
    if (!messageId) {
      setMessage(null);
      setAttachments([]);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setShowRecipientDetails(false);

    // Fetch full message details and attachments in parallel
    Promise.all([
      fetch(`/api/mail/messages/${encodeURIComponent(messageId)}`).then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error?.message || 'Failed to fetch email details');
        }
        return res.json();
      }),
      fetch(`/api/mail/messages/${encodeURIComponent(messageId)}/attachments`).then(async (res) => {
        if (!res.ok) return { value: [] };
        return res.json();
      }),
    ])
      .then(([msgData, attData]) => {
        if (isMounted) {
          setMessage(msgData);
          setAttachments(attData.value || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [messageId]);

  const senderName = message?.from?.emailAddress?.name || message?.from?.emailAddress?.address || 'Unknown';
  const senderEmail = message?.from?.emailAddress?.address || '';

  const personaColor = useMemo(() => {
    return getPersonaColor(senderEmail || senderName || 'User');
  }, [senderEmail, senderName]);

  const initials = useMemo(() => {
    return senderName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
  }, [senderName]);

  // Check if message originated from an external sender (standard Outlook warning)
  const isExternalSender = useMemo(() => {
    if (!message) return false;
    const bodyText = (message.bodyPreview || '') + (message.body?.content || '');
    return bodyText.toLowerCase().includes('external sender') ||
           bodyText.toLowerCase().includes('outside your organization');
  }, [message]);

  const formattedDate = useMemo(() => {
    if (!message?.receivedDateTime) return '';
    const d = new Date(message.receivedDateTime);
    return d.toLocaleString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }, [message?.receivedDateTime]);

  if (!messageId) {
    return (
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center h-full p-8 text-center bg-slate-50/50 dark:bg-slate-950/40 text-slate-400 dark:text-slate-500 select-none overflow-hidden">
        <Mail className="w-14 h-14 mb-3 stroke-[1] text-slate-300 dark:text-slate-700" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select an item to read</h3>
        <p className="text-xs mt-1 max-w-sm">
          Click any email from the message list to view its full content, headers, and attachments.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 p-6 space-y-4 animate-pulse overflow-hidden">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
        <div className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
          </div>
        </div>
        <div className="flex-1 bg-slate-50 dark:bg-slate-800/30 rounded-lg p-6 space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !message) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full p-6 text-center bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 overflow-hidden">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-3 shrink-0" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Unable to load email</h3>
        <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 max-w-md break-words">{error}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 rounded"
          >
            Return to list
          </button>
        )}
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full w-full min-w-0 max-w-full bg-white dark:bg-slate-900 overflow-y-auto overflow-x-hidden font-['Segoe_UI',sans-serif]">
      {/* Outlook Action Ribbon / Command Bar */}
      <div className="px-4 sm:px-6 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 bg-slate-50/80 dark:bg-slate-950/60 w-full min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto no-scrollbar">
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-200/80 dark:bg-slate-800 rounded hover:bg-slate-300 dark:hover:bg-slate-700 shrink-0"
              title="Return to message list"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Inbox</span>
            </button>
          )}

          {/* Outlook-style Reading Canvas Contrast Toggle ("Turn on/off the lights") */}
          <button
            onClick={() => setContrastMode(contrastMode === 'white' ? 'dark' : 'white')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors shrink-0 shadow-2xs"
            title={contrastMode === 'white' ? 'Turn off the lights (Dark canvas)' : 'Turn on the lights (Light canvas)'}
          >
            {contrastMode === 'white' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Turn off the lights</span>
                <span className="sm:hidden">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Turn on the lights</span>
                <span className="sm:hidden">Light</span>
              </>
            )}
          </button>

          {/* Open in Outlook Web Link */}
          {message.webLink && (
            <a
              href={message.webLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-outlook-700 dark:text-outlook-300 bg-outlook-50 dark:bg-outlook-950/60 hover:bg-outlook-100 dark:hover:bg-outlook-900 border border-outlook-200 dark:border-outlook-800 rounded transition-colors shrink-0"
              title="Open this item directly in Outlook on the web"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open in Outlook</span>
              <span className="sm:hidden">Outlook</span>
            </a>
          )}

          {/* View Internet Headers */}
          <button
            onClick={() => setIsHeadersOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800 rounded transition-colors shrink-0"
            title="Inspect Internet RFC822 Headers"
          >
            <FileCode className="w-3.5 h-3.5 text-slate-500" />
            <span>Headers</span>
          </button>

          {/* Print */}
          <button
            onClick={() => window.print()}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800 rounded transition-colors shrink-0"
            title="Print email"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
          <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="hidden md:inline font-mono text-[11px]">Sandboxed & Sanitized</span>
        </div>
      </div>

      {/* Outlook Message Header */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 space-y-3.5 shrink-0 w-full min-w-0 max-w-full overflow-hidden bg-white dark:bg-slate-900">
        {/* Subject & Flags */}
        <div className="space-y-1.5 w-full min-w-0 max-w-full overflow-hidden">
          {message.importance === 'high' && (
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
              <span>High Importance</span>
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 leading-snug break-words max-w-full overflow-hidden tracking-tight">
            {message.subject || '(No Subject)'}
          </h1>
        </div>

        {/* External Sender Safety Warning (Classic Outlook Exchange Banner) */}
        {isExternalSender && (
          <div className="flex items-center gap-2 p-2.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 text-xs border border-amber-200/80 dark:border-amber-800/60 font-medium">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200/90 dark:bg-amber-900/90 text-amber-950 dark:text-amber-100 uppercase tracking-wider shrink-0">
              External
            </span>
            <span className="truncate">
              Be careful with links and attachments from outside your organization.
            </span>
          </div>
        )}

        {/* Sender Persona and Timestamp */}
        <div className="flex items-start gap-3.5 w-full min-w-0 max-w-full overflow-hidden">
          {/* Fluent Deterministic Avatar */}
          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full ${personaColor} text-white font-semibold text-sm flex items-center justify-center shrink-0 shadow-xs select-none`}
          >
            {initials || <User className="w-5 h-5" />}
          </div>

          <div className="flex-1 min-w-0 space-y-1 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 w-full min-w-0 overflow-hidden">
              <div className="flex flex-wrap items-baseline gap-1.5 min-w-0 overflow-hidden">
                <span className="text-sm sm:text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate max-w-full">
                  {senderName}
                </span>
                {senderEmail && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-full">
                    &lt;{senderEmail}&gt;
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{formattedDate}</span>
              </div>
            </div>

            {/* Recipient Line with Outlook "Show details" Drawer */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap min-w-0 max-w-full overflow-hidden">
              <span className="text-slate-600 dark:text-slate-300 font-medium shrink-0">To:</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[280px]">
                {message.toRecipients && message.toRecipients.length > 0
                  ? message.toRecipients.map((r) => r.emailAddress.name || r.emailAddress.address).join('; ')
                  : 'You'}
              </span>

              <button
                onClick={() => setShowRecipientDetails(!showRecipientDetails)}
                className="inline-flex items-center gap-0.5 text-[11px] text-outlook-600 dark:text-outlook-400 hover:underline shrink-0"
              >
                <span>{showRecipientDetails ? 'Hide details' : 'Show details'}</span>
                {showRecipientDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Expanded Recipient Inspector Table */}
            {showRecipientDetails && (
              <div className="mt-2.5 p-3 rounded bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 w-full min-w-0">
                <div className="grid grid-cols-[60px_1fr] gap-2">
                  <span className="text-slate-500 font-medium">From:</span>
                  <span className="text-slate-800 dark:text-slate-200 break-words">
                    {senderName} &lt;{senderEmail}&gt;
                  </span>
                </div>
                {message.toRecipients && message.toRecipients.length > 0 && (
                  <div className="grid grid-cols-[60px_1fr] gap-2">
                    <span className="text-slate-500 font-medium">To:</span>
                    <span className="text-slate-800 dark:text-slate-200 break-words">
                      {message.toRecipients.map((r) => `${r.emailAddress.name || ''} <${r.emailAddress.address}>`).join('; ')}
                    </span>
                  </div>
                )}
                {message.ccRecipients && message.ccRecipients.length > 0 && (
                  <div className="grid grid-cols-[60px_1fr] gap-2">
                    <span className="text-slate-500 font-medium">Cc:</span>
                    <span className="text-slate-800 dark:text-slate-200 break-words">
                      {message.ccRecipients.map((r) => `${r.emailAddress.name || ''} <${r.emailAddress.address}>`).join('; ')}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-[60px_1fr] gap-2">
                  <span className="text-slate-500 font-medium">Date:</span>
                  <span className="text-slate-800 dark:text-slate-200">{formattedDate}</span>
                </div>
                <div className="grid grid-cols-[60px_1fr] gap-2">
                  <span className="text-slate-500 font-medium">Security:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <Lock className="w-3 h-3" /> Signed & Authenticated via Microsoft Exchange Online
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fluent Attachment Strip */}
        {attachments.length > 0 && (
          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 w-full min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Paperclip className="w-3.5 h-3.5 text-outlook-600" />
              <span>
                {attachments.length} Attachment{attachments.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 w-full min-w-0">
              {attachments.map((att) => {
                const isImage = att.contentType.startsWith('image/');
                const isPdf = att.contentType.includes('pdf');
                const isDoc = att.contentType.includes('word') || att.name.endsWith('.docx') || att.name.endsWith('.doc');
                const isSheet = att.contentType.includes('excel') || att.contentType.includes('spreadsheet') || att.name.endsWith('.xlsx') || att.name.endsWith('.csv');
                
                const iconColor = isDoc
                  ? 'bg-blue-600 text-white'
                  : isSheet
                  ? 'bg-emerald-600 text-white'
                  : isPdf
                  ? 'bg-rose-600 text-white'
                  : isImage
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-600 text-white';

                const Icon = isImage ? ImageIcon : isPdf || isDoc || isSheet ? FileText : FileCode;
                const formattedSize = formatFileSize(att.size);
                const downloadUrl = `/api/mail/messages/${encodeURIComponent(message.id)}/attachments/${encodeURIComponent(att.id)}`;

                return (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-outlook-500 dark:hover:border-outlook-500 shadow-2xs transition-all group min-w-0 overflow-hidden"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                      <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={att.name}>
                          {att.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">{formattedSize}</p>
                      </div>
                    </div>

                    <a
                      href={downloadUrl}
                      download={att.name}
                      className="p-1.5 text-slate-400 group-hover:text-outlook-600 dark:group-hover:text-outlook-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors shrink-0 ml-1.5"
                      title={`Download ${att.name}`}
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Outlook Seamless Email Body Canvas */}
      <div className="flex-1 w-full min-w-0 max-w-full overflow-hidden">
        <SanitizedEmailFrame
          htmlContent={message.body?.content || message.bodyPreview || 'No content.'}
          isPlainText={message.body?.contentType === 'text'}
          contrastMode={contrastMode}
        />
      </div>

      {/* Internet Headers Modal */}
      <HeadersModal
        isOpen={isHeadersOpen}
        onClose={() => setIsHeadersOpen(false)}
        headers={message.internetMessageHeaders}
        subject={message.subject}
      />
    </main>
  );
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
