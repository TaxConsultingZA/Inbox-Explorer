'use client';

import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  Paperclip,
  Download,
  AlertCircle,
  FileCode,
  Printer,
  ChevronLeft,
  Mail,
  User,
  Clock,
  Shield,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { GraphMessage, GraphAttachment } from '@/types/mail';
import { SanitizedEmailFrame } from './SanitizedEmailFrame';
import { HeadersModal } from './HeadersModal';

interface ReadingPaneProps {
  messageId?: string;
  onClose?: () => void;
}

export function ReadingPane({ messageId, onClose }: ReadingPaneProps) {
  const [message, setMessage] = useState<GraphMessage | null>(null);
  const [attachments, setAttachments] = useState<GraphAttachment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isHeadersOpen, setIsHeadersOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!messageId) {
      setMessage(null);
      setAttachments([]);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

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

  if (!messageId) {
    return (
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center h-full p-8 text-center bg-slate-50/50 dark:bg-slate-950/40 text-slate-400 dark:text-slate-500 select-none overflow-hidden">
        <Mail className="w-12 h-12 mb-3 stroke-[1] text-slate-300 dark:text-slate-700" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No email selected</h3>
        <p className="text-xs mt-1 max-w-sm">
          Select an email from the inbox list to view its full content, headers, and attachments.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 p-4 sm:p-6 space-y-4 animate-pulse overflow-hidden">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
        <div className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800">
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

  const senderName = message.from?.emailAddress?.name || message.from?.emailAddress?.address || 'Unknown';
  const senderEmail = message.from?.emailAddress?.address || '';
  const formattedDate = message.receivedDateTime
    ? new Date(message.receivedDateTime).toLocaleString(undefined, {
        dateStyle: 'full',
        timeStyle: 'medium',
      })
    : '';

  const initials = senderName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  return (
    <main className="flex-1 flex flex-col h-full w-full min-w-0 max-w-full bg-white dark:bg-slate-900 overflow-y-auto overflow-x-hidden">
      {/* Top Action Ribbon */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 bg-slate-50/70 dark:bg-slate-950/40 w-full min-w-0">
        <div className="flex items-center gap-2 min-w-0 overflow-x-auto no-scrollbar">
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

          {/* Open in Outlook Web Link */}
          {message.webLink && (
            <a
              href={message.webLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-outlook-700 dark:text-outlook-300 bg-outlook-50 dark:bg-outlook-950/60 hover:bg-outlook-100 dark:hover:bg-outlook-900 border border-outlook-200 dark:border-outlook-800 rounded transition-colors shrink-0"
              title="Open this item directly in Outlook Web"
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
            title="Inspect Internet Message RFC822 Headers"
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

      {/* Email Header Details */}
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 space-y-3.5 shrink-0 w-full min-w-0 max-w-full overflow-hidden">
        {/* Subject & Importance Banner */}
        <div className="space-y-1.5 w-full min-w-0 max-w-full overflow-hidden">
          {message.importance === 'high' && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              High Importance Message
            </div>
          )}
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug break-words max-w-full overflow-hidden">
            {message.subject || '(No Subject)'}
          </h1>
        </div>

        {/* Sender & Recipient Details */}
        <div className="flex items-start gap-3 w-full min-w-0 max-w-full overflow-hidden">
          {/* Avatar (strictly within container) */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-outlook-600 text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs">
            {initials || <User className="w-4 h-4" />}
          </div>

          <div className="flex-1 min-w-0 space-y-1 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 w-full min-w-0 overflow-hidden">
              <div className="flex flex-wrap items-baseline gap-1.5 min-w-0 overflow-hidden">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-full">
                  {senderName}
                </span>
                {senderEmail && (
                  <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-full">
                    &lt;{senderEmail}&gt;
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 shrink-0">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{formattedDate}</span>
              </div>
            </div>

            {/* To Recipients */}
            {message.toRecipients && message.toRecipients.length > 0 && (
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-wrap min-w-0 max-w-full overflow-hidden">
                <span className="font-semibold text-slate-600 dark:text-slate-300 shrink-0">To:</span>
                {message.toRecipients.map((rec, i) => (
                  <span
                    key={i}
                    className="inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] truncate max-w-[200px]"
                    title={rec.emailAddress.address}
                  >
                    {rec.emailAddress.name || rec.emailAddress.address}
                  </span>
                ))}
              </div>
            )}

            {/* CC Recipients */}
            {message.ccRecipients && message.ccRecipients.length > 0 && (
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-wrap min-w-0 max-w-full overflow-hidden mt-0.5">
                <span className="font-semibold text-slate-600 dark:text-slate-300 shrink-0">Cc:</span>
                {message.ccRecipients.map((rec, i) => (
                  <span
                    key={i}
                    className="inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] truncate max-w-[200px]"
                    title={rec.emailAddress.address}
                  >
                    {rec.emailAddress.name || rec.emailAddress.address}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Attachments Shelf */}
        {attachments.length > 0 && (
          <div className="mt-2.5 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 w-full min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Paperclip className="w-3.5 h-3.5 text-outlook-600 shrink-0" />
              <span>
                {attachments.length} Attachment{attachments.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 w-full min-w-0">
              {attachments.map((att) => {
                const isImage = att.contentType.startsWith('image/');
                const isPdf = att.contentType.includes('pdf');
                const Icon = isImage ? ImageIcon : isPdf ? FileText : FileCode;
                const formattedSize = formatFileSize(att.size);
                const downloadUrl = `/api/mail/messages/${encodeURIComponent(message.id)}/attachments/${encodeURIComponent(att.id)}`;

                return (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-outlook-400 transition-colors group min-w-0 overflow-hidden"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                      <Icon className="w-4 h-4 text-outlook-600 dark:text-outlook-400 shrink-0" />
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate" title={att.name}>
                          {att.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">{formattedSize}</p>
                      </div>
                    </div>

                    <a
                      href={downloadUrl}
                      download={att.name}
                      className="p-1.5 text-slate-400 group-hover:text-outlook-600 dark:group-hover:text-outlook-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors shrink-0 ml-1"
                      title={`Download ${att.name}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Body Viewport */}
      <div className="p-4 sm:p-6 flex-1 w-full min-w-0 max-w-full overflow-hidden">
        <SanitizedEmailFrame
          htmlContent={message.body?.content || message.bodyPreview || 'No content.'}
          isPlainText={message.body?.contentType === 'text'}
        />
      </div>

      {/* Headers Modal */}
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
