'use client';

import React from 'react';
import { X, Copy, Check } from 'lucide-react';
import { InternetMessageHeader } from '@/types/mail';

interface HeadersModalProps {
  isOpen: boolean;
  onClose: () => void;
  headers?: InternetMessageHeader[];
  subject: string;
}

export function HeadersModal({ isOpen, onClose, headers = [], subject }: HeadersModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const rawHeadersText = headers.map((h) => `${h.name}: ${h.value}`).join('\n');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rawHeadersText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Internet Message Headers
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xl">
              {subject}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy All'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto font-mono text-xs text-slate-800 dark:text-slate-200 space-y-2 bg-slate-50 dark:bg-slate-950/50">
          {headers.length === 0 ? (
            <p className="text-slate-500 italic">No custom Internet headers returned for this message.</p>
          ) : (
            headers.map((h, i) => (
              <div key={i} className="border-b border-slate-200/50 dark:border-slate-800/50 pb-1.5 break-all">
                <span className="font-semibold text-outlook-600 dark:text-outlook-400">{h.name}:</span>{' '}
                <span>{h.value}</span>
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-outlook-600 hover:bg-outlook-700 rounded-md transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

