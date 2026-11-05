import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Page Not Found</h2>
      <p className="mt-2 text-sm text-slate-500">The requested inbox resource does not exist.</p>
      <Link
        href="/"
        className="mt-4 rounded-md bg-outlook-600 px-4 py-2 text-xs font-semibold text-white hover:bg-outlook-700 transition-colors"
      >
        Return to Inbox
      </Link>
    </div>
  );
}
