'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
      <h2 className="text-xl font-bold text-rose-600">Something went wrong</h2>
      <p className="mt-2 text-sm text-slate-500 max-w-md">{error.message}</p>
      <button
        onClick={() => reset()}
        className="mt-4 rounded-md bg-outlook-600 px-4 py-2 text-xs font-semibold text-white hover:bg-outlook-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
