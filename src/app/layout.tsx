import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Inbox Explorer | Enterprise Exchange Online Reader',
  description: 'Production-quality read-only Outlook-style web application connected to Microsoft Exchange Online via Microsoft Graph API.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-outlook-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
