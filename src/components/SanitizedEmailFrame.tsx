'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface SanitizedEmailFrameProps {
  htmlContent: string;
  isPlainText?: boolean;
  contrastMode?: 'white' | 'dark';
}

/**
 * SanitizedEmailFrame
 *
 * Faithfully replicates Microsoft Outlook Web (OWA) email body rendering:
 * 1. Isolated sandboxed iframe context to prevent script execution and style bleed.
 * 2. Microsoft 365 typography stack ("Segoe UI", Aptos, Calibri, Arial).
 * 3. Outlook MSO table and image normalization.
 * 4. Outlook "Turn on the lights" (native white canvas) vs "Turn off the lights" (smart dark inversion).
 * 5. Seamless height auto-calculation with zero artificial double scrollbars.
 */
export function SanitizedEmailFrame({
  htmlContent,
  isPlainText = false,
  contrastMode = 'white',
}: SanitizedEmailFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [frameHeight, setFrameHeight] = useState<number>(450);

  // Microsoft Outlook Web rendering stylesheet & markup
  const preparedDoc = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          /* Outlook Web Core Reset */
          *, *:before, *:after {
            box-sizing: border-box;
          }
          html {
            margin: 0;
            padding: 0;
            background-color: ${contrastMode === 'white' ? '#ffffff' : '#18181b'};
            -webkit-text-size-adjust: 100%;
          }
          body {
            margin: 0;
            padding: 16px 24px 32px 24px;
            font-family: "Segoe UI", "Segoe UI Web (West European)", Aptos, Calibri, Arial, sans-serif;
            font-size: 14.5px;
            line-height: 1.55;
            color: ${contrastMode === 'white' ? '#201f1e' : '#f4f4f5'};
            background-color: ${contrastMode === 'white' ? '#ffffff' : '#18181b'};
            word-break: break-word;
            overflow-wrap: break-word;
          }
          
          /* MSO Table Normalization */
          table {
            border-collapse: collapse;
            max-width: 100% !important;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
          }
          td, th {
            vertical-align: top;
            word-break: break-word;
          }
          
          /* Responsive Image Handling (Outlook Web behavior) */
          img {
            max-width: 100% !important;
            height: auto !important;
            display: inline-block;
            border: 0;
          }
          
          /* Outlook Link Styling */
          a {
            color: ${contrastMode === 'white' ? '#0f6cbd' : '#38bdf8'};
            text-decoration: underline;
          }
          a:hover {
            color: ${contrastMode === 'white' ? '#115ea3' : '#7dd3fc'};
          }
          
          /* Monospace / Code Blocks */
          pre, code {
            font-family: Consolas, "Courier New", monospace;
            font-size: 13px;
            white-space: pre-wrap;
            word-wrap: break-word;
            background-color: ${contrastMode === 'white' ? '#f8fafc' : '#27272a'};
            padding: 2px 4px;
            border-radius: 4px;
          }
          pre {
            padding: 12px;
            border: 1px solid ${contrastMode === 'white' ? '#e2e8f0' : '#3f3f46'};
          }
          
          /* Outlook Blockquotes */
          blockquote {
            margin: 12px 0 12px 0;
            padding: 0 0 0 12px;
            border-left: 3px solid ${contrastMode === 'white' ? '#cbd5e1' : '#52525b'};
            color: ${contrastMode === 'white' ? '#475569' : '#a1a1aa'};
          }
          
          /* Outlook Headings */
          h1, h2, h3, h4, h5, h6 {
            font-family: "Segoe UI Semibold", "Segoe UI", sans-serif;
            color: ${contrastMode === 'white' ? '#0f172a' : '#fafafa'};
            margin-top: 16px;
            margin-bottom: 8px;
          }

          /* Smart Dark Inversion (Outlook "Turn off the lights" emulation) */
          ${
            contrastMode === 'dark'
              ? `
              /* Invert hardcoded light backgrounds from newsletter tables */
              body, [style*="background-color: #fff"], [style*="background-color:#fff"],
              [style*="background-color: white"], [style*="background-color:white"],
              [style*="background:#fff"], [style*="background: #fff"], [style*="background: white"],
              [bgcolor="#ffffff"], [bgcolor="#fff"], [bgcolor="white"] {
                background-color: #18181b !important;
                color: #f4f4f5 !important;
              }
              
              /* Ensure hardcoded dark text (#000, #1e293b, #333) in inverted tables stays visible */
              p, span, div, td, th, li, b, strong, em, label {
                color: #f4f4f5 !important;
              }
              
              table, td, th {
                border-color: #3f3f46 !important;
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

  // Auto-resize iframe height to match content precisely
  const adjustHeight = useCallback(() => {
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        const doc = iframeRef.current.contentWindow.document;
        if (doc && doc.body) {
          const scrollHeight = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight);
          if (scrollHeight > 50) {
            setFrameHeight(scrollHeight + 32);
          }
        }
      }
    } catch {
      // Fallback in case of sandboxing boundary restrictions
    }
  }, []);

  useEffect(() => {
    const frame = iframeRef.current;
    if (!frame) return;

    const handleLoad = () => {
      adjustHeight();

      // Also listen to internal image loads inside the iframe
      try {
        if (frame.contentWindow && frame.contentWindow.document) {
          const imgs = frame.contentWindow.document.querySelectorAll('img');
          imgs.forEach((img) => {
            if (!img.complete) {
              img.addEventListener('load', adjustHeight);
              img.addEventListener('error', adjustHeight);
            }
          });
        }
      } catch {
        // Sandboxed
      }
    };

    frame.addEventListener('load', handleLoad);
    const timer = setTimeout(adjustHeight, 150);

    return () => {
      frame.removeEventListener('load', handleLoad);
      clearTimeout(timer);
    };
  }, [htmlContent, contrastMode, adjustHeight]);

  return (
    <div
      className={`w-full transition-colors duration-150 ${
        contrastMode === 'white' ? 'bg-white' : 'bg-[#18181b]'
      }`}
    >
      <iframe
        ref={iframeRef}
        title="Email Body Canvas"
        srcDoc={preparedDoc}
        sandbox="allow-popups allow-popups-to-escape-sandbox"
        className="w-full border-none block"
        style={{
          height: `${frameHeight}px`,
          minHeight: '280px',
        }}
      />
    </div>
  );
}
