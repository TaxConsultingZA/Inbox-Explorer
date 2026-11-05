'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

interface SanitizedEmailFrameProps {
  htmlContent: string;
  isPlainText?: boolean;
}

export function SanitizedEmailFrame({ htmlContent, isPlainText = false }: SanitizedEmailFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [frameHeight, setFrameHeight] = useState<number>(450);
  const [contrastMode, setContrastMode] = useState<'white' | 'dark'>('white');

  // Construct isolated document with explicit contrast rules to guarantee readability
  // Standard enterprise emails (like Outlook/Exchange) contain hardcoded dark colors (#1e293b, black),
  // which become invisible if rendered on a system-forced black canvas.
  const preparedDoc = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          * {
            box-sizing: border-box;
          }
          html {
            background-color: ${contrastMode === 'white' ? '#ffffff' : '#0f172a'};
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: ${contrastMode === 'white' ? '#1e293b' : '#f8fafc'};
            background-color: ${contrastMode === 'white' ? '#ffffff' : '#0f172a'};
            word-break: break-word;
            overflow-wrap: break-word;
          }
          img {
            max-width: 100% !important;
            height: auto !important;
          }
          table {
            max-width: 100% !important;
            border-collapse: collapse;
          }
          pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 13px;
            color: ${contrastMode === 'white' ? '#1e293b' : '#f8fafc'};
          }
          a {
            color: #0f6cbd;
            text-decoration: underline;
          }
          ${
            contrastMode === 'dark'
              ? `
              /* In dark canvas mode, soften any hardcoded dark text from email templates */
              div, p, span, td, th, li {
                color: #f8fafc !important;
              }
              table, td, th {
                border-color: #334155 !important;
              }
              a {
                color: #38bdf8 !important;
              }
              `
              : ''
          }
        </style>
      </head>
      <body>
        ${isPlainText ? `<pre>${htmlContent}</pre>` : htmlContent}
      </body>
    </html>
  `;

  useEffect(() => {
    const handleLoad = () => {
      try {
        if (iframeRef.current && iframeRef.current.contentWindow) {
          const doc = iframeRef.current.contentWindow.document;
          if (doc && doc.body) {
            const scrollHeight = doc.body.scrollHeight;
            if (scrollHeight > 100) {
              setFrameHeight(Math.max(scrollHeight + 40, 300));
            }
          }
        }
      } catch {
        // Cross-origin sandboxing may block direct height access
      }
    };

    const frame = iframeRef.current;
    if (frame) {
      frame.addEventListener('load', handleLoad);
    }
    return () => {
      if (frame) frame.removeEventListener('load', handleLoad);
    };
  }, [htmlContent, contrastMode]);

  return (
    <div className="w-full flex flex-col rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden bg-white dark:bg-slate-900">
      {/* Email Viewport Header / Canvas Contrast Controls */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 select-none">
        <span className="font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Message Body
        </span>

        {/* Outlook-style Reading Canvas Contrast Toggle */}
        <button
          onClick={() => setContrastMode(contrastMode === 'white' ? 'dark' : 'white')}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          title={contrastMode === 'white' ? 'Switch to Dark canvas' : 'Switch to Light canvas'}
        >
          {contrastMode === 'white' ? (
            <>
              <Moon className="w-3 h-3 text-slate-500" />
              <span>Dark canvas</span>
            </>
          ) : (
            <>
              <Sun className="w-3 h-3 text-amber-500" />
              <span>Light canvas</span>
            </>
          )}
        </button>
      </div>

      {/* Sandboxed Iframe Container */}
      <div className="w-full overflow-hidden bg-white dark:bg-slate-900">
        <iframe
          ref={iframeRef}
          title="Email Body Viewport"
          srcDoc={preparedDoc}
          sandbox="allow-popups allow-popups-to-escape-sandbox"
          className="w-full border-none transition-all duration-150 block"
          style={{ height: `${frameHeight}px`, minHeight: '320px' }}
        />
      </div>
    </div>
  );
}
