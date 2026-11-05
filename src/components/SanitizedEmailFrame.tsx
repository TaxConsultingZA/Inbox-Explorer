'use client';

import React, { useEffect, useRef, useState } from 'react';

interface SanitizedEmailFrameProps {
  htmlContent: string;
  isPlainText?: boolean;
}

export function SanitizedEmailFrame({ htmlContent, isPlainText = false }: SanitizedEmailFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [frameHeight, setFrameHeight] = useState<number>(450);

  // Construct isolated document with protective styling and system font stack
  const preparedDoc = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          :root {
            color-scheme: light dark;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
            padding: 16px;
            color: #1e293b;
            background-color: transparent;
            word-break: break-word;
          }
          @media (prefers-color-scheme: dark) {
            body {
              color: #f1f5f9;
            }
            a {
              color: #38bdf8 !important;
            }
            table, td, th {
              border-color: #334155 !important;
            }
          }
          img {
            max-width: 100% !important;
            height: auto !important;
          }
          table {
            max-width: 100% !important;
          }
          pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 13px;
          }
          a {
            color: #0f6cbd;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        ${isPlainText ? `<pre>${htmlContent}</pre>` : htmlContent}
      </body>
    </html>
  `;

  useEffect(() => {
    // Dynamically adjust height to content if possible
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
        // Cross-origin sandboxing may block direct height access, fallback to comfortable scroll
      }
    };

    const frame = iframeRef.current;
    if (frame) {
      frame.addEventListener('load', handleLoad);
    }
    return () => {
      if (frame) frame.removeEventListener('load', handleLoad);
    };
  }, [htmlContent]);

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
      <iframe
        ref={iframeRef}
        title="Email Body Viewport"
        srcDoc={preparedDoc}
        // Strict sandbox: allows links to open in new tab (allow-popups),
        // but forbids allow-scripts and allow-same-origin to prevent script execution
        sandbox="allow-popups allow-popups-to-escape-sandbox"
        className="w-full border-none transition-all duration-150"
        style={{ height: `${frameHeight}px`, minHeight: '400px' }}
      />
    </div>
  );
}
